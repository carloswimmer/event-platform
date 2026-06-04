import {
	SKILLS,
	type ParticipantDto,
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

const participantSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		skill: {
			type: String,
			enum: SKILLS,
			required: false,
		},
	},
	{
		collection: "participants",
	},
);

participantSchema.index({ email: 1 }, { unique: true });

export type ParticipantDocument = HydratedDocument<
	InferSchemaType<typeof participantSchema>
>;

export const ParticipantModel: Model<ParticipantDocument> =
	(models.Participant as Model<ParticipantDocument> | undefined) ??
	model<ParticipantDocument>("Participant", participantSchema);

export function toParticipantDto(doc: ParticipantDocument): ParticipantDto {
	return {
		id: doc._id.toString(),
		email: doc.email,
		...(doc.skill !== undefined && doc.skill !== null
			? { skill: doc.skill as Skill }
			: {}),
	};
}
