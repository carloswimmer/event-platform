import type {
	ApiResponse,
	ParticipantDto,
	Skill,
} from "@event-platform/shared-types";
import type { ParticipantRepository } from "../ports/participant.repository";
import { validateParticipantSkill } from "../validators/participant.validators";

export async function createParticipant(
	participants: ParticipantRepository,
	input: { email: string; skill?: Skill },
): Promise<ApiResponse<ParticipantDto>> {
	if (!input.email || !validateParticipantSkill(input.skill)) {
		return { result: -1 };
	}

	const data = await participants.create({
		email: input.email,
		...(input.skill !== undefined ? { skill: input.skill } : {}),
	});

	return { result: 1, data };
}
