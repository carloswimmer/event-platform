import type { EventRepository } from "@event-platform/domain";
import type { EventDto } from "@event-platform/shared-types";
import { EventModel, toEventDto } from "../models/event.model";
import { parseObjectId } from "./parse-object-id";

export class MongooseEventRepository implements EventRepository {
	async findById(id: string): Promise<EventDto | null> {
		const objectId = parseObjectId(id);
		if (!objectId) {
			return null;
		}

		const doc = await EventModel.findById(objectId);
		return doc ? toEventDto(doc) : null;
	}

	async create(
		data: Omit<EventDto, "id" | "participantIds">,
	): Promise<EventDto> {
		const doc = await EventModel.create({
			type: data.type,
			capacity: data.capacity,
			...(data.skill !== undefined ? { skill: data.skill } : {}),
			participantIds: [],
		});

		return toEventDto(doc);
	}

	async addParticipant(eventId: string, participantId: string): Promise<void> {
		const eventObjectId = parseObjectId(eventId);
		const participantObjectId = parseObjectId(participantId);
		if (!eventObjectId || !participantObjectId) {
			return;
		}

		await EventModel.updateOne(
			{ _id: eventObjectId },
			{ $addToSet: { participantIds: participantObjectId } },
		);
	}

	async removeParticipant(
		eventId: string,
		participantId: string,
	): Promise<void> {
		const eventObjectId = parseObjectId(eventId);
		const participantObjectId = parseObjectId(participantId);
		if (!eventObjectId || !participantObjectId) {
			return;
		}

		await EventModel.updateOne(
			{ _id: eventObjectId },
			{ $pull: { participantIds: participantObjectId } },
		);
	}

	async countParticipants(eventId: string): Promise<number> {
		const eventObjectId = parseObjectId(eventId);
		if (!eventObjectId) {
			return 0;
		}

		const doc =
			await EventModel.findById(eventObjectId).select("participantIds");
		return doc?.participantIds.length ?? 0;
	}
}
