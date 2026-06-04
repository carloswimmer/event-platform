import { SKILLS, type Skill } from "@event-platform/shared-types";

export function validateParticipantSkill(skill?: string): boolean {
	if (!skill) {
		return true;
	}
	return SKILLS.includes(skill as Skill);
}

export function validateConferenceEmail(email: string): boolean {
	return (
		email.includes("@business.org") || email.includes("@company.com")
	);
}
