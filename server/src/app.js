import express from "express";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/errorHandler.js";

const app = express();

// middleware
app.use(express.json());

// routes
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

// error middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;