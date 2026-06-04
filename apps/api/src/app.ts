import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { apiV1Router } from "./routes/api.v1.routes";
import { healthRouter } from "./routes/health.routes";

export function createApp() {
	const app = express();

	app.use(cors({ origin: env.corsOrigin }));
	app.use(express.json());
	app.use(requestLogger);

	app.get("/", (_req, res) => {
		res.json({ message: "Event Platform API" });
	});

	app.use("/health", healthRouter);
	app.use("/api/v1", apiV1Router);

	app.use(errorHandler);

	return app;
}
