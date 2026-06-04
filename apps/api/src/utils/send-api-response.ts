import type { ApiResponse, ResultCode } from "@event-platform/shared-types";
import type { Response } from "express";

export function statusForResult(
	result: ResultCode,
	options?: { created?: boolean },
): number {
	if (result === 1) {
		return options?.created ? 201 : 200;
	}
	if (result === 0) {
		return 200;
	}
	return 400;
}

export function sendApiResponse<T>(
	res: Response,
	body: ApiResponse<T>,
	options?: { created?: boolean },
): void {
	res.status(statusForResult(body.result, options)).json(body);
}
