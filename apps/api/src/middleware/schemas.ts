import type { EventType, Skill } from "@event-platform/shared-types";
import { EVENT_TYPES, SKILLS } from "@event-platform/shared-types";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const eventTypeSchema = z.enum(
	EVENT_TYPES as [EventType, EventType, ...EventType[]],
);
const skillSchema = z.enum(SKILLS as [Skill, Skill, ...Skill[]]);

export const createEventBodySchema = z.object({
	type: eventTypeSchema,
	capacity: z.number(),
	skill: skillSchema.optional(),
});

export const createParticipantBodySchema = z.object({
	email: z.string().min(1),
	skill: skillSchema.optional(),
});

export const registerBodySchema = z.object({
	participantId: objectIdSchema,
});

export const eventIdParamsSchema = z.object({
	eventId: objectIdSchema,
});

export const eventAndParticipantParamsSchema = z.object({
	eventId: objectIdSchema,
	participantId: objectIdSchema,
});

export const idParamsSchema = z.object({
	id: objectIdSchema,
});
