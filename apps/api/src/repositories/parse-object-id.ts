import { Types } from "mongoose";

/** Returns null for invalid IDs so lookups behave like "not found". */
export function parseObjectId(id: string): Types.ObjectId | null {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}

	const objectId = new Types.ObjectId(id);
	if (objectId.toString() !== id) {
		return null;
	}

	return objectId;
}
