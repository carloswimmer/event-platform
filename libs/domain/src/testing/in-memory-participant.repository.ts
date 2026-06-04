import type { ParticipantDto } from "@event-platform/shared-types";
import type { ParticipantRepository } from "../ports/participant.repository";

export class InMemoryParticipantRepository implements ParticipantRepository {
	private readonly participants = new Map<string, ParticipantDto>();
	private idCounter = 0;

	getAll(): ParticipantDto[] {
		return [...this.participants.values()];
	}

	async findById(id: string): Promise<ParticipantDto | null> {
		return this.participants.get(id) ?? null;
	}

	async create(data: Omit<ParticipantDto, "id">): Promise<ParticipantDto> {
		const id = String(++this.idCounter);
		const participant: ParticipantDto = { ...data, id };
		this.participants.set(id, participant);
		return participant;
	}
}
