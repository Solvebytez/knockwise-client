import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const baseURL = process.env.NODE_ENV === "production" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");
console.log("🔗 API Instance baseURL:", baseURL);
console.log("🔗 NEXT_PUBLIC_API_URL env var:", process.env.NEXT_PUBLIC_API_URL);

export const apiInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - cookies are sent automatically with same-origin requests
apiInstance.interceptors.request.use(
  (config) => {
    // Cookies are sent automatically by the browser with same-origin requests
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await apiInstance.post("/auth/refresh", {});
        return apiInstance(originalRequest);
      } catch (refreshError) {
        if ((refreshError as AxiosError).response?.status === 401) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
