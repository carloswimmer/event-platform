import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => issue.message).join("; ");
}

export function validateBody<T extends z.ZodType>(schema: T) {
	return (req: Request, res: Response, next: NextFunction): void => {
		const parsed = schema.safeParse(req.body);

		if (!parsed.success) {
			res.status(400).json({
				result: -1,
				error: formatZodError(parsed.error),
			});
			return;
		}

		req.body = parsed.data;
		next();
	};
}

export function validateParams<T extends z.ZodType>(schema: T) {
	return (req: Request, res: Response, next: NextFunction): void => {
		const parsed = schema.safeParse(req.params);

		if (!parsed.success) {
			res.status(400).json({
				result: -1,
				error: formatZodError(parsed.error),
			});
			return;
		}

		req.params = parsed.data as Request["params"];
		next();
	};
}
