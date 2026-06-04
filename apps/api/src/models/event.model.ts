import {
	EVENT_TYPES,
	type EventDto,
	type EventType,
	SKILLS,
	type Skill,
} from "@event-platform/shared-types";
import {
	type HydratedDocument,
	type InferSchemaType,
	type Model,
	Schema,
	model,
	models,
} from "mongoose";

const eventSchema = new Schema(
	{
		type: {
			type: String,
			enum: EVENT_TYPES,
			required: true,
		},
		capacity: {
			type: Number,
			required: true,
		},
		skill: {
			type: String,
			enum: SKILLS,
			required: false,
		},
		participantIds: [
			{
				type: Schema.Types.ObjectId,
				ref: "Participant",
			},
		],
	},
	{
		collection: "events",
	},
);

export type EventDocument = HydratedDocument<InferSchemaType<typeof eventSchema>>;

export const EventModel: Model<EventDocument> =
	(models.Event as Model<EventDocument> | undefined) ??
	model<EventDocument>("Event", eventSchema);

export function toEventDto(doc: EventDocument): EventDto {
	return {
		id: doc._id.toString(),
		type: doc.type as EventType,
		capacity: doc.capacity,
		...(doc.skill !== undefined && doc.skill !== null
			? { skill: doc.skill as Skill }
			: {}),
		participantIds: doc.participantIds.map((id) => id.toString()),
	};
}
