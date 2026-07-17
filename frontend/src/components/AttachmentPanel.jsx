import React, { useState, useRef } from "react";
import { uploadAttachment, deleteAttachment, getDownloadUrl } from "../services/taskApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

// ── File type icons ──────────────────────────────────────────────────────
const FileIcon = ({ mimeType }) => {
  const isImage = mimeType?.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";
  const isDoc   = mimeType?.includes("word");
  const isXls   = mimeType?.includes("excel") || mimeType?.includes("spreadsheet");
  const isZip   = mimeType?.includes("zip");

  if (isImage) return <span className="text-green-500">🖼️</span>;
  if (isPdf)   return <span className="text-red-500">📄</span>;
  if (isDoc)   return <span className="text-blue-500">📝</span>;
  if (isXls)   return <span className="text-green-600">📊</span>;
  if (isZip)   return <span className="text-yellow-500">📦</span>;
  return <span className="text-gray-400">📎</span>;
};

// ── Format bytes ─────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = [
  "image/jpeg","image/png","image/gif","image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain","text/csv",
  "application/zip","application/x-zip-compressed",
];

const AttachmentPanel = ({ taskId, initialAttachments = [] }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);

  // ── Handle file selected ─────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    if (!ALLOWED.includes(file.type)) {
      toast.error(`Loại file "${file.type}" không được hỗ trợ`);
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File vượt quá giới hạn 5 MB");
      return;
    }

    setUploading(true);
    try {
      // Read as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(",")[1]); // strip data-URL prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await uploadAttachment(taskId, {
        originalName: file.name,
        mimeType:     file.type,
        size:         file.size,
        data:         base64,
      });

      const newAtt = res.data?.data?.attachment;
      if (newAtt) {
        setAttachments((prev) => [...prev, newAtt]);
        toast.success(`Đã upload: ${file.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  // ── Handle delete ────────────────────────────────────────────────────
  const handleDelete = async (attId) => {
    if (!window.confirm("Xóa file đính kèm này?")) return;
    try {
      await deleteAttachment(taskId, attId);
      setAttachments((prev) => prev.filter((a) => a._id !== attId));
      toast.success("Đã xóa file");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    }
  };

  // ── Download via anchor tag ──────────────────────────────────────────
  const handleDownload = (att) => {
    const url = getDownloadUrl(taskId, att._id);
    const a = document.createElement("a");
    a.href = url;
    a.download = att.originalName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📎</span>
          <h4 className="text-sm font-semibold text-gray-700">
            File đính kèm ({attachments.length})
          </h4>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span> Đang upload...
            </>
          ) : (
            <>
              <span>+</span> Thêm file
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED.join(",")}
          onChange={handleFileChange}
        />
      </div>

      {/* File list */}
      {attachments.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm cursor-pointer hover:border-blue-300 hover:text-blue-400 transition-colors"
        >
          Kéo thả hoặc click để upload file (tối đa 5 MB)
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => {
            const canDelete =
              att.uploadedBy === user?._id ||
              att.uploadedBy?._id === user?._id ||
              user?.role === "Admin";
            return (
              <div
                key={att._id}
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors group"
              >
                <FileIcon mimeType={att.mimeType} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {att.originalName}
                  </p>
                  <p className="text-xs text-gray-400">{formatBytes(att.size)}</p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(att)}
                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Tải xuống"
                  >
                    ⬇ Tải
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(att._id)}
                      className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Xóa"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttachmentPanel;
