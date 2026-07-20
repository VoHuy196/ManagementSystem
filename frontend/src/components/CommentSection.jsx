import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import commentApi from "../services/commentApi.js";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const Avatar = ({ name }) => {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#1890ff", "#52c41a", "#722ed1", "#f5222d", "#fa8c16", "#13c2c2"];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  // Support both ApiResponse shape {data:{user}} and direct user object
  const currentUser = user?.data?.user || user;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await commentApi.getComments(taskId);
      setComments(res.data?.data?.comments || []);
    } catch {
      toast.error("Không thể tải bình luận");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Scroll to bottom when new comment added
  useEffect(() => {
    if (comments.length) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentApi.createComment(taskId, inputText.trim());
      const newComment = res.data?.data?.comment;
      if (newComment) setComments((prev) => [...prev, newComment]);
      setInputText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await commentApi.updateComment(commentId, editText.trim());
      const updated = res.data?.data?.comment;
      if (updated) {
        setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
      }
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể chỉnh sửa");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Xóa bình luận này?")) return;
    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Đã xóa bình luận");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa");
    }
  };

  const isOwner = (comment) =>
    comment.author?._id === currentUser?._id ||
    comment.author === currentUser?._id ||
    currentUser?.role === "Admin";

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h4 className="text-sm font-semibold text-gray-700">
          Bình luận ({comments.length})
        </h4>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-1">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">Đang tải...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Chưa có bình luận nào</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <Avatar name={c.author?.fullName || c.author?.email || "?"} />
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {c.author?.fullName || c.author?.email || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dayjs(c.createdAt).fromNow()}
                      {c.isEdited && <span className="ml-1 text-gray-300">(đã sửa)</span>}
                    </span>
                  </div>

                  {editingId === c._id ? (
                    <div>
                      <textarea
                        className="w-full text-sm border border-blue-300 rounded p-2 resize-none focus:outline-none focus:border-blue-500"
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleEdit(c._id)}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 break-words">{c.content}</p>
                  )}
                </div>

                {/* Action buttons */}
                {isOwner(c) && editingId !== c._id && (
                  <div className="flex gap-3 mt-1 ml-1">
                    <button
                      onClick={() => { setEditingId(c._id); setEditText(c.content); }}
                      className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-start">
        <Avatar name={currentUser?.fullName || currentUser?.email || "?"} />
        <div className="flex-1">
          <textarea
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            rows={2}
            placeholder="Viết bình luận..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400">Ctrl+Enter để gửi</span>
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || submitting}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
