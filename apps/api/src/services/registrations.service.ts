import {
	type CancelRegistrationDeps,
	cancelRegistration,
	type RegisterParticipantDeps,
	registerParticipant,
} from "@event-platform/domain";
import type { ApiResponse, WaitlistEntryDto } from "@event-platform/shared-types";
import type { WaitlistRepository } from "@event-platform/domain";
import { repositories } from "../repositories";

/**
 * Registration flows may update events and waitlist in one logical action
 * (e.g. FIFO promotion after cancel). Use-cases orchestrate domain rules;
 * MongoDB multi-document transactions can wrap repository calls later by
 * passing a ClientSession into repository methods (Phase 5 / production hardening).
 */
export class RegistrationsService {
	constructor(
		private readonly deps: RegisterParticipantDeps &
			CancelRegistrationDeps = repositories,
		private readonly waitlist: WaitlistRepository = repositories.waitlist,
	) {}

	async register(
		eventId: string,
		participantId: string,
	): Promise<ApiResponse<void>> {
		return registerParticipant(this.deps, participantId, eventId);
	}

	async cancel(
		eventId: string,
		participantId: string,
	): Promise<ApiResponse<void>> {
		return cancelRegistration(this.deps, participantId, eventId);
	}

	async getWaitlist(eventId: string): Promise<WaitlistEntryDto[] | null> {
		const event = await this.deps.events.findById(eventId);
		if (!event) {
			return null;
		}

		return this.waitlist.listForEvent(eventId);
	}
}

export const registrationsService = new RegistrationsService();
