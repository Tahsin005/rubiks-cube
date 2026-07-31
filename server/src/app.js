import express from "express";
import cors from "cors";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import rankingsRoutes from "./modules/rankings/rankings.routes.js";
import friendsRoutes from "./modules/friends/friends.routes.js";
import achievementsRoutes from "./modules/achievements/achievements.routes.js";
import matchesRoutes from "./modules/matches/matches.routes.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/errorHandler.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/rankings", rankingsRoutes);
app.use("/friends", friendsRoutes);
app.use("/achievements", achievementsRoutes);
app.use("/matches", matchesRoutes);

// error middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;