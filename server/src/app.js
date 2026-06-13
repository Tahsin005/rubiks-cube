import express from "express";
import healthRoutes from "./modules/health/health.routes.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());

// routes
app.use("/health", healthRoutes);

// error middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;