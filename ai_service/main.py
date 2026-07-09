import os
import io
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ─────────────────────────────────────────────
# Global state
# ─────────────────────────────────────────────
_model: Optional[SentenceTransformer] = None
_dept_embeddings: dict = {}   # pre-computed at startup

# Predefined department descriptions for semantic department matching
DEPT_DESC = {
    "HR": "Human Resources, tuyển dụng, hành chính, nhân sự, chế độ, phúc lợi, bảo hiểm, hợp đồng lao động, đào tạo, quy chế, nội quy",
    "Engineering": "Engineering, lập trình, viết code, thiết kế cơ sở dữ liệu, API, DevOps, CI/CD, sửa lỗi, fix bug, unit test, front-end, back-end, kiến trúc phần mềm, docker",
    "Marketing": "Marketing, truyền thông, chạy quảng cáo, tối ưu SEO, viết content, chiến dịch tiếp thị, thương hiệu, fanpage, bài viết, sự kiện truyền thông",
    "Sales": "Sales, bán hàng, tư vấn khách hàng, chốt hợp đồng, đàm phán doanh thu, gọi điện khách hàng, tìm kiếm khách hàng tiềm năng, báo giá",
    "Finance": "Finance, tài chính, kế toán, thuế, bảng lương, thanh toán hóa đơn, ngân sách, dòng tiền, báo cáo tài chính, chứng từ",
    "Operations": "Operations, vận hành văn phòng, quy trình hoạt động, quản lý thiết bị, hỗ trợ kỹ thuật, thu mua văn phòng phẩm, logistics",
    "General": "General, hành chính chung, nội quy công ty, thông báo chung, sự kiện công ty, văn hóa doanh nghiệp",
}

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# ─────────────────────────────────────────────
# Helper: chunk long text into overlapping windows
# ─────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    if not words:
        return [text]
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i: i + chunk_size])
        chunks.append(chunk)
        if i + chunk_size >= len(words):
            break
    return chunks if chunks else [text]


# ─────────────────────────────────────────────
# Startup / shutdown lifecycle
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and pre-compute department embeddings once at startup."""
    global _model, _dept_embeddings
    print(f"[STARTUP] Loading SentenceTransformer model: {MODEL_NAME} ...")
    _model = SentenceTransformer(MODEL_NAME)
    print("[STARTUP] Model loaded. Pre-computing department embeddings...")
    dept_texts = list(DEPT_DESC.values())
    dept_keys  = list(DEPT_DESC.keys())
    vectors = _model.encode(dept_texts, batch_size=16, show_progress_bar=False)
    _dept_embeddings = {dept_keys[i]: vectors[i] for i in range(len(dept_keys))}
    print(f"[STARTUP] Cached embeddings for {len(_dept_embeddings)} departments. Ready!")
    yield
    # cleanup (optional)
    print("[SHUTDOWN] AI Service shutting down.")


app = FastAPI(title="PMS AI Microservice", version="2.0.0", lifespan=lifespan)


def get_model() -> SentenceTransformer:
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet. Please retry in a moment.")
    return _model


# ─────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────
class EmployeeItem(BaseModel):
    id: str
    fullName: str
    department: str
    pendingTasksCount: int = 0
    skills: Optional[List[str]] = []

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

class FeedbackItem(BaseModel):
    taskType: str = ""
    department: str = ""
    assignedUserId: str
    aiSuggested: bool = False   # True nếu là gợi ý #1 của AI

class SmartAssignRequest(BaseModel):
    task: TaskItem
    employees: List[EmployeeItem]
    historicalTasks: Optional[List[HistoricalTaskItem]] = []
    feedbackHistory: Optional[List[FeedbackItem]] = []

class VectorizeRequest(BaseModel):
    text: str


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "PMS AI Service v2",
        "cached_departments": list(_dept_embeddings.keys()),
    }


@app.post("/ai/predict-assignee")
def predict_assignee(req: SmartAssignRequest):
    if not req.employees:
        raise HTTPException(status_code=400, detail="No employees provided")

    try:
        model = get_model()
        task_text = f"{req.task.title}. {req.task.description} {req.task.taskType}"
        task_embedding = model.encode([task_text])[0]

        # ── 1. Department similarity (uses pre-cached embeddings) ──────────
        dept_similarities: dict = {}
        for dept, vec in _dept_embeddings.items():
            sim = cosine_similarity([task_embedding], [vec])[0][0]
            dept_similarities[dept] = float(sim)

        # ── 2. Historical task embeddings ──────────────────────────────────
        has_history = bool(req.historicalTasks)
        history_embeddings = []
        if has_history:
            hist_texts = [f"{t.title}. {t.description}" for t in req.historicalTasks]
            history_embeddings = model.encode(hist_texts, batch_size=32, show_progress_bar=False)

        # ── 3. Feedback boost map (employeeId → boost score) ──────────────
        feedback_boost: dict = {}
        for fb in (req.feedbackHistory or []):
            uid = fb.assignedUserId
            # If manager manually chose this person (not AI suggestion), small boost
            boost = 0.08 if not fb.aiSuggested else 0.04
            feedback_boost[uid] = feedback_boost.get(uid, 0.0) + boost

        # ── 4. Skill matching helper ───────────────────────────────────────
        task_lower = task_text.lower()
        def skill_match_score(skills: List[str]) -> float:
            if not skills:
                return 0.0
            matched = sum(1 for s in skills if s.lower() in task_lower)
            return min(matched / max(len(skills), 1), 1.0) * 0.15  # max +15%

        # ── 5. Score each candidate ────────────────────────────────────────
        predictions = []
        for emp in req.employees:
            emp_dept = emp.department if emp.department in DEPT_DESC else "General"
            dept_sim = dept_similarities.get(emp_dept, 0.2)

            # Historical performance
            hist_score = 0.0
            hist_count = 0
            if has_history:
                for idx, hist in enumerate(req.historicalTasks):
                    if str(hist.assignedTo) == str(emp.id):
                        sim = cosine_similarity([task_embedding], [history_embeddings[idx]])[0][0]
                        weight = {"Done": 1.2, "In Progress": 0.8}.get(hist.status, 0.5)
                        if hist.rating is not None:
                            weight *= (hist.rating / 5.0 + 0.5)
                        hist_score += float(sim) * weight
                        hist_count += 1

            if hist_count > 0:
                avg_hist = hist_score / hist_count
                combined = dept_sim * 0.4 + avg_hist * 0.6
                reason = f"Từng hoàn thành {hist_count} task tương tự với mức độ phù hợp kỹ năng cao."
            else:
                combined = dept_sim
                reason = f"Phù hợp với phòng ban chuyên môn {emp.department}."

            # Skill matching bonus
            skill_bonus = skill_match_score(emp.skills or [])
            if skill_bonus > 0:
                reason += f" Kỹ năng phù hợp với yêu cầu task."

            # Feedback history boost
            fb_boost = min(feedback_boost.get(emp.id, 0.0), 0.20)

            # Workload penalty (max -15%)
            workload_penalty = min(emp.pendingTasksCount * 0.03, 0.15)

            final_score = max(combined + skill_bonus + fb_boost - workload_penalty, 0.05)
            confidence = int(np.clip(final_score * 100, 10, 99))

            pending_note = f" (Tải lượng: {emp.pendingTasksCount} task đang xử lý)." if emp.pendingTasksCount > 0 else ""
            predictions.append({
                "employeeId": emp.id,
                "fullName": emp.fullName,
                "confidence": confidence,
                "reason": reason + pending_note,
            })

        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        return {"predictions": predictions[:3]}

    except HTTPException:
        raise
    except Exception as e:
        print("Error in predict_assignee:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/vectorize")
def vectorize_text(req: VectorizeRequest):
    try:
        model = get_model()
        embedding = model.encode([req.text])[0]
        return {"vector": embedding.tolist(), "success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/ocr")
async def process_document(file: UploadFile = File(...)):
    """OCR a document (PDF / DOCX / TXT) and return full text + chunk vectors."""
    try:
        file_bytes = await file.read()
        filename = (file.filename or "").lower()
        extracted_text = ""

        # ── PDF ────────────────────────────────────────────────────────────
        if filename.endswith(".pdf"):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
            doc.close()

        # ── DOCX ───────────────────────────────────────────────────────────
        elif filename.endswith(".docx"):
            try:
                from docx import Document as DocxDocument
                docx_doc = DocxDocument(io.BytesIO(file_bytes))
                extracted_text = "\n".join(p.text for p in docx_doc.paragraphs if p.text.strip())
                if not extracted_text:
                    extracted_text = f"[Tài liệu Word không có nội dung văn bản]: {file.filename}"
            except ImportError:
                extracted_text = f"[DOCX support unavailable – install python-docx]: {filename}"
            except Exception as docx_err:
                # Malformed / not a real DOCX — treat as raw text
                extracted_text = file_bytes.decode("utf-8", errors="ignore").strip()
                if not extracted_text:
                    extracted_text = f"[Không thể đọc tệp DOCX: {docx_err}]"

        # ── Plain text / CSV / JSON ────────────────────────────────────────
        elif filename.endswith((".txt", ".csv", ".json")):
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

        # ── Unknown ───────────────────────────────────────────────────────
        else:
            extracted_text = f"Tệp tin đính kèm: {file.filename}"

        clean_text = extracted_text.strip()
        if not clean_text:
            clean_text = f"Văn bản trống: {file.filename}"

        # ── Chunk & vectorize ──────────────────────────────────────────────
        model = get_model()
        chunks = chunk_text(clean_text, chunk_size=400, overlap=50)
        if not chunks:
            chunks = [clean_text]

        chunk_vectors = model.encode(chunks, batch_size=16, show_progress_bar=False).tolist()

        # Primary single embedding = mean of chunk vectors (for backward compat)
        if len(chunk_vectors) == 1:
            primary_vector = chunk_vectors[0]
        elif len(chunk_vectors) > 1:
            primary_vector = np.mean(chunk_vectors, axis=0).tolist()
        else:
            primary_vector = model.encode([clean_text])[0].tolist()

        return {
            "text": clean_text,
            "vector": primary_vector,           # mean vector (384-dim)
            "chunks": chunks,                   # list of text chunks
            "chunkVectors": chunk_vectors,       # list of per-chunk vectors
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Error in document processing:", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
