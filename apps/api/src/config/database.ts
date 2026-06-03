import mongoose from "mongoose";

export async function connectDatabase(uri: string): Promise<void> {
	await mongoose.connect(uri);
	console.log("[mongo] connected");
}

export async function disconnectDatabase(): Promise<void> {
	await mongoose.disconnect();
}
