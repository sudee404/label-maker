import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.IS_DOCKER ? "http://localhost:8000/api" : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
});

api.interceptors.request.use(async (config) => {
  // Skip auth header for token refresh endpoint
  if (config.url?.includes("/token/refresh/")) {
    return config;
  }

  const session = await getServerSession(authOptions);

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  } else if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor (unchanged)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      "Something went wrong";

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;