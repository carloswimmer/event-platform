import type { WaitlistEntryDto } from "@event-platform/shared-types";
import {
	type HydratedDocument,
	type InferSchemaType,
	type Model,
	model,
	models,
	Schema,
} from "mongoose";

const waitlistEntrySchema = new Schema(
	{
		eventId: {
			type: Schema.Types.ObjectId,
			ref: "Event",
			required: true,
		},
		participantId: {
			type: Schema.Types.ObjectId,
			ref: "Participant",
			required: true,
		},
		createdAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
	},
	{
		collection: "waitlist_entries",
	},
);

waitlistEntrySchema.index({ eventId: 1, createdAt: 1 });

export type WaitlistEntryDocument = HydratedDocument<
	InferSchemaType<typeof waitlistEntrySchema>
>;

export const WaitlistEntryModel: Model<WaitlistEntryDocument> =
	(models.WaitlistEntry as Model<WaitlistEntryDocument> | undefined) ??
	model<WaitlistEntryDocument>("WaitlistEntry", waitlistEntrySchema);

export function toWaitlistEntryDto(
	doc: WaitlistEntryDocument,
): WaitlistEntryDto {
	return {
		eventId: doc.eventId.toString(),
		participantId: doc.participantId.toString(),
		createdAt: doc.createdAt.toISOString(),
	};
}
