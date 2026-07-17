import nodemailer from "nodemailer";

/**
 * Creates a reusable transporter.
 * Config reads from env variables:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 * Falls back gracefully if not configured.
 */
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null; // Email not configured
  }
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

const FROM = process.env.EMAIL_FROM || "ManagementSystem <noreply@managementsystem.app>";

// ── Generic send ─────────────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] Not configured – skipped email to ${to}: "${subject}"`);
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[EMAIL] Sent to ${to}: "${subject}"`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return false;
  }
};

// ── Template: Task Assigned ───────────────────────────────────────────────
export const sendTaskAssignedEmail = async ({ toEmail, toName, taskTitle, taskType, priority, dueDate, assignedByName }) => {
  const priorityColor = { High: "#f5222d", Medium: "#fa8c16", Low: "#52c41a" }[priority] || "#1890ff";
  const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString("vi-VN") : "Chưa xác định";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1890ff,#722ed1);padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">📋 Task Mới Được Giao</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <p style="font-size:16px;color:#333">Xin chào <strong>${toName}</strong>,</p>
        <p style="color:#555">Bạn vừa được giao một task mới bởi <strong>${assignedByName}</strong>:</p>

        <div style="background:#f0f5ff;border-left:4px solid #1890ff;padding:16px;border-radius:4px;margin:16px 0">
          <h2 style="margin:0 0 8px;color:#1d39c4;font-size:18px">${taskTitle}</h2>
          <p style="margin:4px 0;color:#555">
            <strong>Loại task:</strong> ${taskType} &nbsp;|&nbsp;
            <strong>Độ ưu tiên:</strong> <span style="color:${priorityColor};font-weight:bold">${priority}</span>
          </p>
          <p style="margin:4px 0;color:#555"><strong>Hạn hoàn thành:</strong> ${dueDateStr}</p>
        </div>

        <p style="color:#555">Vui lòng đăng nhập hệ thống để xem chi tiết và bắt đầu thực hiện.</p>

        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/kanbanboard"
             style="background:#1890ff;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
            Xem Task Ngay
          </a>
        </div>
      </div>
      <div style="padding:12px 24px;background:#f0f0f0;text-align:center;color:#999;font-size:12px">
        ManagementSystem – Email tự động, vui lòng không trả lời.
      </div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[ManagementSystem] Task mới: ${taskTitle}`,
    html,
  });
};

// ── Template: Task Deadline Reminder ─────────────────────────────────────
export const sendDeadlineReminderEmail = async ({ toEmail, toName, taskTitle, dueDate, daysLeft }) => {
  const urgencyColor = daysLeft <= 1 ? "#f5222d" : daysLeft <= 3 ? "#fa8c16" : "#1890ff";
  const urgencyText  = daysLeft <= 1 ? "⚠️ Rất khẩn cấp!" : daysLeft <= 3 ? "⏰ Sắp đến hạn" : "📅 Nhắc nhở";
  const dueDateStr   = new Date(dueDate).toLocaleDateString("vi-VN");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden">
      <div style="background:linear-gradient(135deg,${urgencyColor},#722ed1);padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">${urgencyText} – Deadline Task</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <p style="font-size:16px;color:#333">Xin chào <strong>${toName}</strong>,</p>
        <div style="background:#fff7e6;border-left:4px solid ${urgencyColor};padding:16px;border-radius:4px;margin:16px 0">
          <h2 style="margin:0 0 8px;color:#333;font-size:18px">${taskTitle}</h2>
          <p style="margin:4px 0;color:#555">
            <strong>Hạn hoàn thành:</strong> <span style="color:${urgencyColor};font-weight:bold">${dueDateStr}</span>
          </p>
          <p style="margin:4px 0;color:#555">
            <strong>Còn lại:</strong> <span style="color:${urgencyColor};font-weight:bold">${daysLeft} ngày</span>
          </p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/kanbanboard"
             style="background:${urgencyColor};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
            Cập nhật tiến độ
          </a>
        </div>
      </div>
      <div style="padding:12px 24px;background:#f0f0f0;text-align:center;color:#999;font-size:12px">
        ManagementSystem – Email tự động, vui lòng không trả lời.
      </div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[ManagementSystem] ${urgencyText}: "${taskTitle}" – còn ${daysLeft} ngày`,
    html,
  });
};
