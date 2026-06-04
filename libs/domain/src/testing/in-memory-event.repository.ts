import type { EventDto } from "@event-platform/shared-types";
import type { EventRepository } from "../ports/event.repository";

export class InMemoryEventRepository implements EventRepository {
	private readonly events = new Map<string, EventDto>();
	private idCounter = 0;

	getAll(): EventDto[] {
		return [...this.events.values()];
	}

	async findById(id: string): Promise<EventDto | null> {
		return this.events.get(id) ?? null;
	}

	async create(
		data: Omit<EventDto, "id" | "participantIds">,
	): Promise<EventDto> {
		const id = String(++this.idCounter);
		const event: EventDto = {
			...data,
			id,
			participantIds: [],
		};
		this.events.set(id, event);
		return event;
	}

	async addParticipant(eventId: string, participantId: string): Promise<void> {
		const event = this.events.get(eventId);
		if (!event) {
			throw new Error(`Event not found: ${eventId}`);
		}
		event.participantIds.push(participantId);
	}

	async removeParticipant(
		eventId: string,
		participantId: string,
	): Promise<void> {
		const event = this.events.get(eventId);
		if (!event) {
			throw new Error(`Event not found: ${eventId}`);
		}
		const index = event.participantIds.indexOf(participantId);
		if (index >= 0) {
			event.participantIds.splice(index, 1);
		}
	}

	async countParticipants(eventId: string): Promise<number> {
		const event = this.events.get(eventId);
		return event?.participantIds.length ?? 0;
	}
}
