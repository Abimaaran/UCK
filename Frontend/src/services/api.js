import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

export const registerUser = async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
};

export const fetchUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

// Students API
export const getStudentProfile = async (studentId) => {
  const response = await api.get(`/students/${studentId}/profile`);
  return response.data;
};

export const getStudentAttendance = async (studentId) => {
  const response = await api.get(`/attendance/${studentId}`);
  return response.data;
};

export const getStudentFees = async (studentId) => {
  const response = await api.get(`/fees/${studentId}`);
  return response.data;
};

export const getStudentReviews = async (studentId) => {
  const response = await api.get(`/reviews/${studentId}`);
  return response.data;
};

// Generic GET for collections like achievements, coaches, tournaments
export const getCollection = async (collectionRoute) => {
  const response = await api.get(`/${collectionRoute}`);
  return response.data;
};

// Generic POST
export const createItem = async (collectionRoute, data) => {
  const response = await api.post(`/${collectionRoute}`, data);
  return response.data;
};

// Generic PUT
export const updateItem = async (collectionRoute, id, data) => {
  const response = await api.put(`/${collectionRoute}/${id}`, data);
  return response.data;
};

// Generic DELETE
export const deleteItem = async (collectionRoute, id) => {
  const response = await api.delete(`/${collectionRoute}/${id}`);
  return response.data;
};

export default api;
