import type { ApiResponse } from "@event-platform/shared-types";
import {
	type RegisterParticipantDeps,
	registerParticipant,
} from "./register-participant.use-case";

export interface CancelRegistrationDeps extends RegisterParticipantDeps {}

export async function cancelRegistration(
	deps: CancelRegistrationDeps,
	participantId: string,
	eventId: string,
): Promise<ApiResponse<void>> {
	const event = await deps.events.findById(eventId);

	if (!event) {
		return { result: -1 };
	}

	const participantInEvent = event.participantIds.indexOf(participantId);
	const waitlistEntry = await deps.waitlist.findEntry(eventId, participantId);

	if (participantInEvent < 0 && !waitlistEntry) {
		return { result: -1 };
	}

	if (waitlistEntry) {
		await deps.waitlist.remove(eventId, participantId);
		return { result: 1 };
	}

	await deps.events.removeParticipant(eventId, participantId);

	const nextOnWaitlist = await deps.waitlist.getFirstForEvent(eventId);
	if (nextOnWaitlist) {
		await deps.waitlist.remove(eventId, nextOnWaitlist.participantId);
		await registerParticipant(deps, nextOnWaitlist.participantId, eventId);
	}

	return { result: 1 };
}
