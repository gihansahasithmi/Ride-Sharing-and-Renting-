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
  getUsers: () => request("/api/auth/users"),
  getBikes: () => request("/api/bikes"),
  getOwnerBikes: (ownerId) => request(`/api/bikes/owner/${ownerId}`),
  createBike: (payload, imageFile) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("image", imageFile);
    return request("/api/bikes", {
      method: "POST",
      body: formData,
    });
  },
  updateBike: (bikeId, payload, imageFile) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (imageFile) {
      formData.append("image", imageFile);
    }
    return request(`/api/bikes/${bikeId}`, {
      method: "PUT",
      body: formData,
    });
  },
  deleteBike: (bikeId, ownerId) =>
    request(`/api/bikes/${bikeId}?ownerId=${ownerId}`, {
      method: "DELETE",
    }),
  createRental: (payload) =>
    request("/api/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateRental: (rentalId, payload) =>
    request(`/api/rentals/${rentalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteRental: (rentalId) =>
    request(`/api/rentals/${rentalId}`, {
      method: "DELETE",
    }),
  getUserRentals: (userId) => request(`/api/rentals/user/${userId}`),
  getOwnerRentals: (ownerId) => request(`/api/rentals/owner/${ownerId}`),
  getAllRentals: () => request("/api/rentals"),
  getSlipUrl: (rentalId) => `${API_BASE}/api/rentals/${rentalId}/slip`,
  deleteSlip: (rentalId) =>
    request(`/api/rentals/${rentalId}/slip`, {
      method: "DELETE",
    }),
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
  updateProfile: (userId, payload) =>
    request(`/api/auth/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteProfile: (userId, payload) =>
    request(`/api/auth/profile/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  createReview: (userId, payload) =>
    request(`/api/reviews/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  getAllReviews: () => request("/api/reviews"),
  getUserReviews: (userId) => request(`/api/reviews/user/${userId}`),
  updateReview: (reviewId, userId, payload) =>
    request(`/api/reviews/${reviewId}/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteReview: (reviewId, userId) =>
    request(`/api/reviews/${reviewId}/${userId}`, {
      method: "DELETE",
    }),
};
