import {
	type CancelRegistrationDeps,
	cancelRegistration,
	type RegisterParticipantDeps,
	registerParticipant,
} from "@event-platform/domain";
import type { ApiResponse } from "@event-platform/shared-types";
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
}

export const registrationsService = new RegistrationsService();
