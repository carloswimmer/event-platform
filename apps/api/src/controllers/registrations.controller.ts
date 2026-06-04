import type { Request, Response } from "express";
import { registrationsService } from "../services/registrations.service";
import { sendApiResponse } from "../utils/send-api-response";

export async function registerParticipant(
	req: Request,
	res: Response,
): Promise<void> {
	const { eventId } = req.params;
	const { participantId } = req.body;

	const response = await registrationsService.register(
		eventId,
		participantId,
	);
	sendApiResponse(res, response);
}

export async function cancelRegistration(
	req: Request,
	res: Response,
): Promise<void> {
	const { eventId, participantId } = req.params;

	const response = await registrationsService.cancel(eventId, participantId);
	sendApiResponse(res, response);
}

export async function getWaitlist(req: Request, res: Response): Promise<void> {
	const waitlist = await registrationsService.getWaitlist(req.params.eventId);

	if (waitlist === null) {
		res.status(404).json({ result: -1, error: "Event not found" });
		return;
	}

	res.status(200).json({ result: 1, data: waitlist });
}
