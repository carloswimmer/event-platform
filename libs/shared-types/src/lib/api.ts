import type { EventType, ResultCode, Skill } from "./enums";

export interface CreateEventRequest {
	type: EventType;
	capacity: number;
	skill?: Skill;
}

export interface CreateParticipantRequest {
	email: string;
	skill?: Skill;
}

export interface RegisterRequest {
	participantId: string;
}

export interface ApiResponse<T = unknown> {
	result: ResultCode;
	data?: T;
	error?: string;
}
