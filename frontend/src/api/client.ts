import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

// Members
export const membersApi = {
  list: () => api.get("/members"),
  create: (data: { name: string; email: string }) =>
    api.post("/members", data),
  update: (id: string, data: { name: string; email: string }) =>
    api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
};

// Rotations
export const rotationsApi = {
  list: () => api.get("/rotations"),
  get: (id: string) => api.get(`/rotations/${id}`),
  create: (data: {
    name: string;
    description?: string;
    frequency: string;
    start_date: string;
    end_date?: string;
  }) => api.post("/rotations", data),
  update: (
    id: string,
    data: {
      name: string;
      description?: string;
      frequency: string;
      start_date: string;
      end_date?: string;
      is_active: boolean;
    }
  ) => api.put(`/rotations/${id}`, data),
  delete: (id: string) => api.delete(`/rotations/${id}`),
  addMember: (id: string, member_id: string) =>
    api.post(`/rotations/${id}/members`, { member_id }),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/rotations/${id}/members/${memberId}`),
  reorderMembers: (id: string, ordered_member_ids: string[]) =>
    api.put(`/rotations/${id}/members/reorder`, { ordered_member_ids }),
  swapMembers: (
    id: string,
    member_id_a: string,
    member_id_b: string
  ) => api.post(`/rotations/${id}/members/swap`, { member_id_a, member_id_b }),
  recalculate: (id: string) => api.post(`/rotations/${id}/recalculate`),
  sendTest: (id: string) => api.post(`/rotations/${id}/send-test`),
};

// Events
export const eventsApi = {
  list: (params?: { rotation_id?: string; from?: string; to?: string }) =>
    api.get("/events", { params }),
  update: (
    id: string,
    data: { member_id?: string; title?: string; notes?: string }
  ) => api.put(`/events/${id}`, data),
};

// Gmail
export const gmailApi = {
  status: () => api.get("/gmail/status"),
  authUrl: () => api.get("/gmail/auth-url"),
  revoke: () => api.post("/gmail/revoke"),
  updateTemplates: (data: {
    email_subject_template: string;
    email_body_template: string;
  }) => api.put("/gmail/templates", data),
  sendToday: () => api.post("/gmail/send-today"),
};
