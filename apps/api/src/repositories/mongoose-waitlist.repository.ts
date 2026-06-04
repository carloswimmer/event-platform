import type { WaitlistRepository } from "@event-platform/domain";
import type { WaitlistEntryDto } from "@event-platform/shared-types";
import {
	toWaitlistEntryDto,
	WaitlistEntryModel,
} from "../models/waitlist-entry.model";
import { parseObjectId } from "./parse-object-id";

export class MongooseWaitlistRepository implements WaitlistRepository {
	async findEntry(
		eventId: string,
		participantId: string,
	): Promise<WaitlistEntryDto | null> {
		const eventObjectId = parseObjectId(eventId);
		const participantObjectId = parseObjectId(participantId);
		if (!eventObjectId || !participantObjectId) {
			return null;
		}

		const doc = await WaitlistEntryModel.findOne({
			eventId: eventObjectId,
			participantId: participantObjectId,
		});

		return doc ? toWaitlistEntryDto(doc) : null;
	}

	async add(
		entry: Omit<WaitlistEntryDto, "createdAt">,
	): Promise<WaitlistEntryDto> {
		const eventObjectId = parseObjectId(entry.eventId);
		const participantObjectId = parseObjectId(entry.participantId);
		if (!eventObjectId || !participantObjectId) {
			throw new Error("Invalid waitlist entry IDs");
		}

		const doc = await WaitlistEntryModel.create({
			eventId: eventObjectId,
			participantId: participantObjectId,
		});

		return toWaitlistEntryDto(doc);
	}

	async remove(eventId: string, participantId: string): Promise<void> {
		const eventObjectId = parseObjectId(eventId);
		const participantObjectId = parseObjectId(participantId);
		if (!eventObjectId || !participantObjectId) {
			return;
		}

		await WaitlistEntryModel.deleteOne({
			eventId: eventObjectId,
			participantId: participantObjectId,
		});
	}

	async getFirstForEvent(eventId: string): Promise<WaitlistEntryDto | null> {
		const eventObjectId = parseObjectId(eventId);
		if (!eventObjectId) {
			return null;
		}

		const doc = await WaitlistEntryModel.findOne({ eventId: eventObjectId })
			.sort({ createdAt: 1 })
			.exec();

		return doc ? toWaitlistEntryDto(doc) : null;
	}

	async listForEvent(eventId: string): Promise<WaitlistEntryDto[]> {
		const eventObjectId = parseObjectId(eventId);
		if (!eventObjectId) {
			return [];
		}

		const docs = await WaitlistEntryModel.find({ eventId: eventObjectId })
			.sort({ createdAt: 1 })
			.exec();

		return docs.map(toWaitlistEntryDto);
	}
}
