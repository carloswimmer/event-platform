import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";

async function bootstrap() {
	await connectDatabase(env.mongodbUri);

	const app = createApp();

	const server = app.listen(env.port, env.host, () => {
		console.log(`[ ready ] http://${env.host}:${env.port}`);
	});

	const shutdown = async () => {
		console.log("[shutdown] closing server and mongo");
		server.close();
		await disconnectDatabase();
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
	console.error("[fatal] failed to start API", err);
	process.exit(1);
});
