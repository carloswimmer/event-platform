import type { WaitlistEntryDto } from "@event-platform/shared-types";
import type { WaitlistRepository } from "../ports/waitlist.repository";

export class InMemoryWaitlistRepository implements WaitlistRepository {
	private readonly entries: WaitlistEntryDto[] = [];

	getAll(): WaitlistEntryDto[] {
		return [...this.entries];
	}

	async findEntry(
		eventId: string,
		participantId: string,
	): Promise<WaitlistEntryDto | null> {
		return (
			this.entries.find(
				(entry) =>
					entry.eventId === eventId && entry.participantId === participantId,
			) ?? null
		);
	}

	async add(
		entry: Omit<WaitlistEntryDto, "createdAt">,
	): Promise<WaitlistEntryDto> {
		const created: WaitlistEntryDto = {
			...entry,
			createdAt: new Date().toISOString(),
		};
		this.entries.push(created);
		return created;
	}

	async remove(eventId: string, participantId: string): Promise<void> {
		const index = this.entries.findIndex(
			(entry) =>
				entry.eventId === eventId && entry.participantId === participantId,
		);
		if (index >= 0) {
			this.entries.splice(index, 1);
		}
	}

	async getFirstForEvent(eventId: string): Promise<WaitlistEntryDto | null> {
		const forEvent = this.entries
			.filter((entry) => entry.eventId === eventId)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

		return forEvent[0] ?? null;
	}

	async listForEvent(eventId: string): Promise<WaitlistEntryDto[]> {
		return this.entries
			.filter((entry) => entry.eventId === eventId)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}
}
