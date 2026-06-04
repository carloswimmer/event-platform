import type {
	ApiResponse,
	EventDto,
	EventType,
	Skill,
} from "@event-platform/shared-types";
import type { EventRepository } from "../ports/event.repository";
import {
	validateEventSkill,
	validateEventType,
} from "../validators/event.validators";

export async function createEvent(
	events: EventRepository,
	input: { type: EventType; capacity: number; skill?: Skill },
): Promise<ApiResponse<EventDto>> {
	if (
		!validateEventType(input.type) ||
		input.capacity <= 0 ||
		!validateEventSkill(input.type, input.skill)
	) {
		return { result: -1 };
	}

	const data = await events.create({
		type: input.type,
		capacity: input.capacity,
		...(input.skill !== undefined ? { skill: input.skill } : {}),
	});

	return { result: 1, data };
}
