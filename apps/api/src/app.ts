import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";

export function createApp() {
	const app = express();

	app.use(cors({ origin: env.corsOrigin }));
	app.use(express.json());

	app.get("/", (_req, res) => {
		res.json({ message: "Event Platform API" });
	});

	app.use("/health", healthRouter);

	return app;
}
