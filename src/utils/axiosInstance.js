import axios from "axios";

// const baseAPI = "http://127.0.0.1:8000";
const baseAPI = "http://192.168.0.174:8000";
//  axios instance
export const axiosInstance = axios.create({
  baseURL: baseAPI,
  headers: {
    "Content-Type": "application/json",
  },
});
