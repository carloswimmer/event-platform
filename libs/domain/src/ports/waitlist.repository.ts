import type { WaitlistEntryDto } from "@event-platform/shared-types";

export interface WaitlistRepository {
	findEntry(
		eventId: string,
		participantId: string,
	): Promise<WaitlistEntryDto | null>;
	add(entry: Omit<WaitlistEntryDto, "createdAt">): Promise<WaitlistEntryDto>;
	remove(eventId: string, participantId: string): Promise<void>;
	getFirstForEvent(eventId: string): Promise<WaitlistEntryDto | null>;
	listForEvent(eventId: string): Promise<WaitlistEntryDto[]>;
}
