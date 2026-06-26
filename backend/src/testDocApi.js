import axios from "axios";

const API_URL = "http://localhost:3000";

const test = async () => {
  console.log("Starting backend Document API test...");
  const api = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
  });

  // 1. Register a test user
  const email = `docuser${Date.now()}@test.com`;
  console.log(`Registering user with email: ${email}`);
  const regRes = await api.post("/api/auth/register", {
    fullName: "Document Tester",
    email,
    password: "Password123",
  });

  if (regRes.status !== 201) {
    console.error("Failed to register user:", regRes.status, regRes.data);
    return;
  }

  // 2. Login to get token
  console.log("Logging in...");
  const loginRes = await api.post("/api/auth/login", {
    email,
    password: "Password123",
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.error("Failed to login:", loginRes.status, loginRes.data);
    return;
  }

  const token = loginRes.data.data.token;
  console.log("Login successful! Token acquired.");

  // 3. Call GET /api/documents
  console.log("Calling GET /api/documents...");
  const docRes = await api.get("/api/documents", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Response status:", docRes.status);
  console.log("Response headers:", docRes.headers);
  console.log("Response data:", JSON.stringify(docRes.data, null, 2));

  if (docRes.status === 200 && docRes.data.success) {
    console.log("✅ API TEST PASSED successfully!");
  } else {
    console.error("❌ API TEST FAILED!");
  }
};

test().catch((err) => {
  console.error("Test execution failed:", err);
});
