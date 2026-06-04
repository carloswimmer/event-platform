import type { ParticipantDto } from "@event-platform/shared-types";

export interface ParticipantRepository {
	findById(id: string): Promise<ParticipantDto | null>;
	create(data: Omit<ParticipantDto, "id">): Promise<ParticipantDto>;
}
