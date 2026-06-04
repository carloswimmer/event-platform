import {
	EVENT_TYPES,
	type EventType,
	SKILLS,
	type Skill,
} from "@event-platform/shared-types";

/** Mirrors reference `validateType`. */
export function validateEventType(type: string): boolean {
	return EVENT_TYPES.includes(type as EventType);
}

/** Mirrors reference `validateSkill`. */
export function validateEventSkill(type: EventType, skill?: string): boolean {
	const isSkillNotNeeded = type !== "WORKSHOP" && !skill;
	const isValidSkill = skill !== undefined && SKILLS.includes(skill as Skill);

	return isSkillNotNeeded || isValidSkill;
}
