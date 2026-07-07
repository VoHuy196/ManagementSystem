import os
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="PMS AI Microservice", version="1.0.0")

# Lazy load model to speed up server start
_model = None

def get_model():
    global _model
    if _model is None:
        # Using a compact multilingual model (approx 120MB)
        model_name = "paraphrase-multilingual-MiniLM-L12-v2"
        print(f"Loading SentenceTransformer model: {model_name}...")
        _model = SentenceTransformer(model_name)
        print("Model loaded successfully!")
    return _model

# Predefined department descriptions for semantic department matching
DEPT_DESC = {
    "HR": "Human Resources, tuyển dụng, hành chính, nhân sự, chế độ, phúc lợi, bảo hiểm, hợp đồng lao động, đào tạo, quy chế, nội quy",
    "Engineering": "Engineering, lập trình, viết code, thiết kế cơ sở dữ liệu, API, DevOps, CI/CD, sửa lỗi, fix bug, unit test, front-end, back-end, kiến trúc phần mềm, docker",
    "Marketing": "Marketing, truyền thông, chạy quảng cáo, tối ưu SEO, viết content, chiến dịch tiếp thị, thương hiệu, fanpage, bài viết, sự kiện truyền thông",
    "Sales": "Sales, bán hàng, tư vấn khách hàng, chốt hợp đồng, đàm phán doanh thu, gọi điện khách hàng, tìm kiếm khách hàng tiềm năng, báo giá",
    "Finance": "Finance, tài chính, kế toán, thuế, bảng lương, thanh toán hóa đơn, ngân sách, dòng tiền, báo cáo tài chính, chứng từ",
    "Operations": "Operations, vận hành văn phòng, quy trình hoạt động, quản lý thiết bị, hỗ trợ kỹ thuật, thu mua văn phòng phẩm, logistics",
    "General": "General, hành chính chung, nội quy công ty, thông báo chung, sự kiện công ty, văn hóa doanh nghiệp"
}

class EmployeeItem(BaseModel):
    id: str
    fullName: str
    department: str
    pendingTasksCount: int = 0

class TaskItem(BaseModel):
    title: str
    description: str = ""
    taskType: str = "Task"
    priority: str = "Medium"

class HistoricalTaskItem(BaseModel):
    title: str
    description: str = ""
    assignedTo: str
    status: str
    rating: Optional[float] = None

class SmartAssignRequest(BaseModel):
    task: TaskItem
    employees: List[EmployeeItem]
    historicalTasks: Optional[List[HistoricalTaskItem]] = []

class VectorizeRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "PMS AI Service"}

@app.post("/ai/predict-assignee")
def predict_assignee(req: SmartAssignRequest):
    if not req.employees:
        raise HTTPException(status_code=400, detail="No employees provided")

    try:
        model = get_model()
        task_text = f"{req.task.title}. {req.task.description}"
        task_embedding = model.encode([task_text])[0]

        # Calculate semantic similarities for departments
        dept_similarities = {}
        for dept, desc in DEPT_DESC.items():
            desc_embedding = model.encode([desc])[0]
            sim = cosine_similarity([task_embedding], [desc_embedding])[0][0]
            dept_similarities[dept] = sim

        # Embed historical tasks if available
        has_history = req.historicalTasks and len(req.historicalTasks) > 0
        history_embeddings = []
        if has_history:
            hist_texts = [f"{t.title}. {t.description}" for t in req.historicalTasks]
            history_embeddings = model.encode(hist_texts)

        predictions = []

        for emp in req.employees:
            # 1. Department match score (base score)
            emp_dept = emp.department if emp.department in DEPT_DESC else "General"
            dept_sim = dept_similarities.get(emp_dept, 0.2)
            
            # 2. Historical performance score
            hist_score = 0.0
            hist_count = 0
            if has_history:
                for idx, hist in enumerate(req.historicalTasks):
                    if str(hist.assignedTo) == str(emp.id):
                        # Calculate similarity to this historical task
                        sim = cosine_similarity([task_embedding], [history_embeddings[idx]])[0][0]
                        
                        # Weight based on completion status and rating
                        weight = 1.0
                        if hist.status == "Done":
                            weight = 1.2
                        elif hist.status == "In Progress":
                            weight = 0.8
                        else:
                            weight = 0.5 # Todo or other
                        
                        if hist.rating is not None:
                            weight *= (hist.rating / 5.0 + 0.5) # rating scales it
                            
                        hist_score += sim * weight
                        hist_count += 1

            if hist_count > 0:
                avg_hist_sim = hist_score / hist_count
                # Hybrid score: 40% department, 60% historical match
                combined_sim = (dept_sim * 0.4) + (avg_hist_sim * 0.6)
                reason = f"Từng hoàn thành {hist_count} task tương tự với mức độ phù hợp kỹ năng cao."
            else:
                # No history: 100% department match
                combined_sim = dept_sim
                reason = f"Phù hợp với phòng ban chuyên môn {emp.department}."

            # 3. Workload Penalty
            # Penalize slightly for too many pending tasks (max 15% penalty)
            workload_penalty = min(emp.pendingTasksCount * 0.03, 0.15)
            final_score = max(combined_sim - workload_penalty, 0.1)

            # Convert to percentage
            confidence = int(np.clip(final_score * 100, 10, 99))

            predictions.append({
                "employeeId": emp.id,
                "fullName": emp.fullName,
                "confidence": confidence,
                "reason": reason + (f" (Tải lượng: {emp.pendingTasksCount} task đang xử lý)." if emp.pendingTasksCount > 0 else "")
            })

        # Sort by confidence score descending
        predictions = sorted(predictions, key=lambda x: x["confidence"], reverse=True)

        return {"predictions": predictions[:3]}

    except Exception as e:
        print("Error in predict_assignee:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/vectorize")
def vectorize_text(req: VectorizeRequest):
    try:
        model = get_model()
        embedding = model.encode([req.text])[0]
        return {"vector": embedding.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/ocr")
def process_document(file: UploadFile = File(...)):
    try:
        # Read file bytes
        file_bytes = file.file.read()
        filename = file.filename.lower()
        extracted_text = ""

        # Parse text if it's a PDF
        if filename.endswith(".pdf"):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
            doc.close()
        # Parse text if it's plain text/csv
        elif filename.endswith((".txt", ".csv", ".json")):
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
        else:
            extracted_text = f"Tệp tin đính kèm: {file.filename}"

        # Truncate text if it is too long for model limit (e.g. max 500 words for vectorizing)
        text_for_vector = extracted_text[:2000] if extracted_text.strip() else f"Văn bản trống: {file.filename}"

        # Generate embedding
        model = get_model()
        embedding = model.encode([text_for_vector])[0]

        return {
            "text": extracted_text,
            "vector": embedding.tolist(),
            "success": True
        }

    except Exception as e:
        print("Error in document processing:", e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
