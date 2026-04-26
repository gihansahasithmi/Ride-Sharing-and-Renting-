export const API_BASE = "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  getBikes: () => request("/api/bikes"),
  getOwnerBikes: (ownerId) => request(`/api/bikes/owner/${ownerId}`),
  createBike: (payload) =>
    request("/api/bikes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  createRental: (payload) =>
    request("/api/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  getUserRentals: (userId) => request(`/api/rentals/user/${userId}`),
  getOwnerRentals: (ownerId) => request(`/api/rentals/owner/${ownerId}`),
  getAllRentals: () => request("/api/rentals"),
  getSlipUrl: (rentalId) => `${API_BASE}/api/rentals/${rentalId}/slip`,
  updateRentalStatus: (rentalId, status, notes) =>
    request(`/api/rentals/${rentalId}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ""}`, {
      method: "PATCH",
    }),
  uploadSlip: async (rentalId, uploaderRole, paymentReference, notes, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const query = new URLSearchParams({
      uploaderRole,
      paymentReference,
    });
    if (notes) {
      query.set("notes", notes);
    }
    return request(`/api/rentals/${rentalId}/slip?${query.toString()}`, {
      method: "POST",
      body: formData,
    });
  },
  getDashboard: () => request("/api/admin/dashboard"),
};
