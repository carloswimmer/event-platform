import { Router } from "express";
import {
	createEvent,
	getEventById,
	listEvents,
} from "../controllers/events.controller";
import {
	createParticipant,
	listParticipants,
} from "../controllers/participants.controller";
import {
	cancelRegistration,
	getWaitlist,
	registerParticipant,
} from "../controllers/registrations.controller";
import { asyncHandler } from "../middleware/async-handler";
import {
	createEventBodySchema,
	createParticipantBodySchema,
	eventAndParticipantParamsSchema,
	eventIdParamsSchema,
	idParamsSchema,
	registerBodySchema,
} from "../middleware/schemas";
import { validateBody, validateParams } from "../middleware/validate";

export const apiV1Router = Router();

apiV1Router.post(
	"/events",
	validateBody(createEventBodySchema),
	asyncHandler(createEvent),
);
apiV1Router.get("/events", asyncHandler(listEvents));
apiV1Router.get(
	"/events/:id",
	validateParams(idParamsSchema),
	asyncHandler(getEventById),
);

apiV1Router.post(
	"/participants",
	validateBody(createParticipantBodySchema),
	asyncHandler(createParticipant),
);
apiV1Router.get("/participants", asyncHandler(listParticipants));

apiV1Router.post(
	"/events/:eventId/registrations",
	validateParams(eventIdParamsSchema),
	validateBody(registerBodySchema),
	asyncHandler(registerParticipant),
);
apiV1Router.delete(
	"/events/:eventId/registrations/:participantId",
	validateParams(eventAndParticipantParamsSchema),
	asyncHandler(cancelRegistration),
);
apiV1Router.get(
	"/events/:eventId/waitlist",
	validateParams(eventIdParamsSchema),
	asyncHandler(getWaitlist),
);
