import axios from "axios";
import store from "../store/store";
import { logout } from "../store/Slices/auth/authenticationSlice";

// const baseAPI = "http://127.0.0.1:8000";
const baseAPI = process.env.REACT_APP_BASE_API_URL || "http://192.168.0.174:8000";
//  axios instance
export const axiosInstance = axios.create({
  baseURL: baseAPI,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attaches the auth header automatically. Previously ~180 individual call
// sites across the app each manually built
// `{ headers: { Authorization: Bearer ${localStorage.getItem("access_token")} } }`
// by hand - this doesn't remove any of those (harmless/redundant, not
// broken), it just means new code no longer has to repeat the pattern,
// and a call site that forgets it still works.
axiosInstance.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Central 401 handling - previously every call site handled (or didn't
// handle) an expired session independently. Redirects to /login once,
// rather than leaving the user on a page silently failing every request.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      store.dispatch(logout());
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
