import type { ApiResponse } from "@event-platform/shared-types";
import type { EventRepository } from "../ports/event.repository";
import type { ParticipantRepository } from "../ports/participant.repository";
import type { WaitlistRepository } from "../ports/waitlist.repository";
import { validateConferenceEmail } from "../validators/participant.validators";

export interface RegisterParticipantDeps {
	events: EventRepository;
	participants: ParticipantRepository;
	waitlist: WaitlistRepository;
}

export async function registerParticipant(
	deps: RegisterParticipantDeps,
	participantId: string,
	eventId: string,
): Promise<ApiResponse<void>> {
	const event = await deps.events.findById(eventId);
	const participant = await deps.participants.findById(participantId);

	if (!event || !participant) {
		return { result: -1 };
	}

	const isRegistered = event.participantIds.includes(participantId);
	const isInWaitlist = await deps.waitlist.findEntry(eventId, participantId);

	if (isRegistered || isInWaitlist) {
		return { result: -1 };
	}

	if (
		(event.type === "CONFERENCE" &&
			!validateConferenceEmail(participant.email)) ||
		(event.type === "WORKSHOP" && event.skill !== participant.skill)
	) {
		return { result: -1 };
	}

	if (event.participantIds.length >= event.capacity) {
		await deps.waitlist.add({ eventId, participantId });
		return { result: 0 };
	}

	await deps.events.addParticipant(eventId, participantId);
	return { result: 1 };
}
