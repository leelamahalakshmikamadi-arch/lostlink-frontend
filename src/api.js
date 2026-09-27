import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

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

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi = {
  login: (payload) => api.post("/api/auth/login", payload),
  register: (payload) => api.post("/api/auth/register", payload),
};

export const itemsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/items`,
});

export const getItemById = (id) => itemsApi.get(`/${encodeURIComponent(id)}`);

export const getItemImage = (id) =>
  itemsApi.get(`/${encodeURIComponent(id)}/image`, { responseType: "blob" });

export const matchItemImage = (image, itemType, userId, userEmail) => {
  const payload = new FormData();
  payload.append("image", image);
  let url = `/match?itemType=${encodeURIComponent(itemType)}`;
  if (userId) url += `&userId=${encodeURIComponent(userId)}`;
  if (userEmail) url += `&userEmail=${encodeURIComponent(userEmail)}`;
  return itemsApi.post(url, payload);
};

export const claimsApi = {
  submitClaim: (itemId, payload) => api.post(`/api/items/${encodeURIComponent(itemId)}/claim`, payload),
  verifyClaim: (itemId, payload) => api.post(`/api/items/${encodeURIComponent(itemId)}/verify-claim`, payload),
  getClaims: (itemId) => api.get(`/api/items/${encodeURIComponent(itemId)}/claims`),
};

export const notificationsApi = {
  getNotifications: (userId) =>
    api.get("/api/notifications", { params: userId ? { userId } : {} }),
  markRead: (id, userId) =>
    api.post(`/api/notifications/${encodeURIComponent(id)}/read`, null, { params: userId ? { userId } : {} }),
  markAllRead: (userId) => api.post("/api/notifications/read", null, { params: userId ? { userId } : {} }),
};