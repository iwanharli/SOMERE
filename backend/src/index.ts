import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { panelinRouter } from "./routes/panelin";
import { usersRouter } from "./routes/users";
import { tokenRouter } from "./routes/token";
import { dashboardRouter } from "./routes/dashboard";
import { logsRouter } from "./routes/logs";
import { tokenRequestRouter } from "./routes/tokenRequest";


const app  = express();
const PORT = process.env.PORT || 5000;

// [6] Security headers
app.use(helmet({
  crossOriginResourcePolicy:  { policy: "cross-origin" },
  contentSecurityPolicy:      false, // dihandle Vite di frontend
}));

// CORS
app.use(cors({
  origin:      process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

// [7] Body size limit — cegah payload attack
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Sembunyikan informasi server
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SOMERE API" });
});

app.use("/api/auth",      authRouter);
app.use("/api/users",     usersRouter);
app.use("/api/token",     tokenRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/logs",      logsRouter);
app.use("/api/token-requests", tokenRequestRouter);
app.use("/api/panelin",        panelinRouter);

// Global error handler — jangan bocorkan stack trace
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

app.listen(PORT, () => {
  console.log(`SOMERE backend running on http://localhost:${PORT}`);
});

export default app;
