import { MongooseEventRepository } from "./mongoose-event.repository";
import { MongooseParticipantRepository } from "./mongoose-participant.repository";
import { MongooseWaitlistRepository } from "./mongoose-waitlist.repository";

export { MongooseEventRepository } from "./mongoose-event.repository";
export { MongooseParticipantRepository } from "./mongoose-participant.repository";
export { MongooseWaitlistRepository } from "./mongoose-waitlist.repository";

export const eventRepository = new MongooseEventRepository();
export const participantRepository = new MongooseParticipantRepository();
export const waitlistRepository = new MongooseWaitlistRepository();

export const repositories = {
	events: eventRepository,
	participants: participantRepository,
	waitlist: waitlistRepository,
};
