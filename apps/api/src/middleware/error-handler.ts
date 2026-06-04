import type { NextFunction, Request, Response } from "express";

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error("[api error]", err);
	res.status(500).json({
		result: -1,
		error: "Internal server error",
	});
}
