import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
export const MAX_REPORT_DATE = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  .toISOString()
  .slice(0, 10);

export const getApiErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  const status = error.response?.status;
  const data = error.response?.data;

  if (data?.message && typeof data.message === "string" && data.message.trim()) {
    const msg = data.message.trim();
    if (msg.toLowerCase() !== "conflict") {
      return msg;
    }
  }

  if (data?.detail && typeof data.detail === "string" && data.detail.trim()) {
    const detail = data.detail.trim();
    if (detail.toLowerCase() !== "conflict") {
      return detail;
    }
  }

  if (status === 409) {
    return "An account with this email already exists. Please log in or use a different email.";
  }

  if (data?.error && typeof data.error === "string" && data.error.trim()) {
    const err = data.error.trim();
    const genericPhrases = ["conflict", "bad request", "unauthorized", "forbidden", "not found", "internal server error"];
    if (!genericPhrases.includes(err.toLowerCase())) {
      return err;
    }
  }

  return fallback;
};

export const validateReportImage = (file) => {
  if (!file) return "";
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/bmp"]);
  if (!allowedTypes.has(file.type)) return "Choose a JPEG, PNG, GIF, or BMP image.";
  if (file.size > 10 * 1024 * 1024) return "Image must be 10 MB or smaller.";
  return "";
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi = {
  login: (payload) => api.post("/api/auth/login", payload),
  register: (payload) => api.post("/api/auth/register", payload),
  requestPasswordReset: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (payload) => api.post("/api/auth/reset-password", payload),
};

export const itemsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/items`,
});

const attachAuthToken = (client) => {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("lostlink_token") || sessionStorage.getItem("lostlink_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

attachAuthToken(api);
attachAuthToken(itemsApi);

export const getItemById = (id) => itemsApi.get(`/${encodeURIComponent(id)}`);

export const getItemImage = (id) =>
  itemsApi.get(`/${encodeURIComponent(id)}/image`, { responseType: "blob" });

export const matchItemImage = (image, itemType) => {
  const payload = new FormData();
  payload.append("image", image);
  const url = `/match?itemType=${encodeURIComponent(itemType)}`;
  return itemsApi.post(url, payload);
};

export const claimsApi = {
  submitClaim: (itemId, payload) => api.post(`/api/items/${encodeURIComponent(itemId)}/claim`, payload),
  verifyClaim: (itemId, payload) => api.post(`/api/items/${encodeURIComponent(itemId)}/verify-claim`, payload),
  getClaims: (itemId) => api.get(`/api/items/${encodeURIComponent(itemId)}/claims`),
};

export const notificationsApi = {
  getNotifications: () => api.get("/api/notifications"),
  markRead: (id) => api.post(`/api/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.post("/api/notifications/read"),
};