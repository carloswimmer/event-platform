function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export const env = {
	host: process.env.HOST ?? "localhost",
	port: Number(process.env.PORT ?? 3333),
	mongodbUri: required("MONGODB_URI"),
	corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
};
