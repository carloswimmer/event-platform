import type { RegisterParticipantDeps } from "../use-cases/register-participant.use-case";
import { InMemoryEventRepository } from "./in-memory-event.repository";
import { InMemoryParticipantRepository } from "./in-memory-participant.repository";
import { InMemoryWaitlistRepository } from "./in-memory-waitlist.repository";

export interface InMemoryRepos extends RegisterParticipantDeps {
	events: InMemoryEventRepository;
	participants: InMemoryParticipantRepository;
	waitlist: InMemoryWaitlistRepository;
}

export function createInMemoryRepos(): InMemoryRepos {
	const events = new InMemoryEventRepository();
	const participants = new InMemoryParticipantRepository();
	const waitlist = new InMemoryWaitlistRepository();

	return { events, participants, waitlist };
}
