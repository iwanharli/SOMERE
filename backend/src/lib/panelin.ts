import axios from "axios";

export const panelin = axios.create({
  baseURL: process.env.PANELIN_API_URL || "https://api.panelin.id",
  headers: {
    Authorization: `Bearer ${process.env.PANELIN_API_KEY}`,
    "Content-Type": "application/json",
  },
});
