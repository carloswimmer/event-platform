import type { ParticipantRepository } from "@event-platform/domain";
import type { ParticipantDto } from "@event-platform/shared-types";
import { ParticipantModel, toParticipantDto } from "../models/participant.model";
import { parseObjectId } from "./parse-object-id";

export class MongooseParticipantRepository implements ParticipantRepository {
	async findById(id: string): Promise<ParticipantDto | null> {
		const objectId = parseObjectId(id);
		if (!objectId) {
			return null;
		}

		const doc = await ParticipantModel.findById(objectId);
		return doc ? toParticipantDto(doc) : null;
	}

	async create(data: Omit<ParticipantDto, "id">): Promise<ParticipantDto> {
		const doc = await ParticipantModel.create({
			email: data.email,
			...(data.skill !== undefined ? { skill: data.skill } : {}),
		});

		return toParticipantDto(doc);
	}
}
