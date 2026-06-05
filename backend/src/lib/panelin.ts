import axios from "axios";

export const panelin = axios.create({
  baseURL: process.env.PANELIN_API_URL || "https://api.panelin.id",
  timeout: 5000,
});

panelin.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${process.env.PANELIN_API_KEY}`;
  config.headers["Content-Type"] = "application/json";
  return config;
});

