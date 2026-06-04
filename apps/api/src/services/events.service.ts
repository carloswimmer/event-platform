import type { EventRepository } from "@event-platform/domain";
import { createEvent } from "@event-platform/domain";
import type {
	ApiResponse,
	CreateEventRequest,
	EventDto,
} from "@event-platform/shared-types";
import { repositories } from "../repositories";

export class EventsService {
	constructor(private readonly events: EventRepository = repositories.events) {}

	async create(input: CreateEventRequest): Promise<ApiResponse<EventDto>> {
		return createEvent(this.events, input);
	}

	async getById(id: string): Promise<EventDto | null> {
		return this.events.findById(id);
	}
}

export const eventsService = new EventsService();
