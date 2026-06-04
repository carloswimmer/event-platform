import type { Request, Response } from "express";
import { eventsService } from "../services/events.service";
import { sendApiResponse } from "../utils/send-api-response";

export async function createEvent(req: Request, res: Response): Promise<void> {
	const response = await eventsService.create(req.body);
	sendApiResponse(res, response, { created: response.result === 1 });
}

export async function listEvents(_req: Request, res: Response): Promise<void> {
	const data = await eventsService.list();
	res.status(200).json({ data });
}

export async function getEventById(req: Request, res: Response): Promise<void> {
	const event = await eventsService.getById(req.params.id);

	if (!event) {
		res.status(404).json({ result: -1, error: "Event not found" });
		return;
	}

	res.status(200).json({ result: 1, data: event });
}
