import type { ParticipantRepository } from "@event-platform/domain";
import { createParticipant } from "@event-platform/domain";
import type {
	ApiResponse,
	CreateParticipantRequest,
	ParticipantDto,
} from "@event-platform/shared-types";
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
}

export const participantsService = new ParticipantsService();
