import type { EventType, Skill } from "./enums";

export interface EventDto {
	id: string;
	type: EventType;
	capacity: number;
	skill?: Skill;
	participantIds: string[];
}

export interface ParticipantDto {
	id: string;
	email: string;
	skill?: Skill;
}

export interface WaitlistEntryDto {
	eventId: string;
	participantId: string;
	createdAt: string;
}
