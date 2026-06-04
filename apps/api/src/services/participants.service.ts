import type { ParticipantRepository } from "@event-platform/domain";
import { createParticipant } from "@event-platform/domain";
import type {
	ApiResponse,
	CreateParticipantRequest,
	ParticipantDto,
} from "@event-platform/shared-types";
import { ParticipantModel, toParticipantDto } from "../models/participant.model";
import { repositories } from "../repositories";

export class ParticipantsService {
	constructor(
		private readonly participants: ParticipantRepository = repositories.participants,
	) {}

	async create(
		input: CreateParticipantRequest,
	): Promise<ApiResponse<ParticipantDto>> {
		return createParticipant(this.participants, input);
	}

	async getById(id: string): Promise<ParticipantDto | null> {
		return this.participants.findById(id);
	}

	async list(): Promise<ParticipantDto[]> {
		const docs = await ParticipantModel.find().sort({ _id: 1 });
		return docs.map(toParticipantDto);
	}
}

export const participantsService = new ParticipantsService();
