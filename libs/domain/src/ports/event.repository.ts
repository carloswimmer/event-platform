import type { EventDto } from "@event-platform/shared-types";

export interface EventRepository {
	findById(id: string): Promise<EventDto | null>;
	create(data: Omit<EventDto, "id" | "participantIds">): Promise<EventDto>;
	addParticipant(eventId: string, participantId: string): Promise<void>;
	removeParticipant(eventId: string, participantId: string): Promise<void>;
	countParticipants(eventId: string): Promise<number>;
}
