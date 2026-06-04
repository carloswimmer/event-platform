import type { Request, Response } from "express";
import { participantsService } from "../services/participants.service";
import { sendApiResponse } from "../utils/send-api-response";

export async function createParticipant(
	req: Request,
	res: Response,
): Promise<void> {
	const response = await participantsService.create(req.body);
	sendApiResponse(res, response, { created: response.result === 1 });
}

export async function listParticipants(
	_req: Request,
	res: Response,
): Promise<void> {
	const data = await participantsService.list();
	res.status(200).json({ data });
}
