type Skill = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type EventType = "WORKSHOP" | "WEBINAR" | "CONFERENCE";

interface Event {
	id: string;
	type: EventType;
	capacity: number;
	skill?: Skill;
	participantIds: string[];
}

interface Participant {
	id: string;
	skill?: Skill;
	email: string;
}

interface Waitlist {
	eventId: string;
	participantId: string;
}

export class EventSystem {
	events: Event[] = [];
	participants: Participant[] = [];
	waitlist: Waitlist[] = [];

	addEvent(type: EventType, capacity: number, skill?: string): number {
		if (
			!this.validateType(type) ||
			capacity <= 0 ||
			!this.validateSkill(type, skill)
		)
			return -1;

		const event: Event = {
			id: Date.now().toString(),
			type,
			capacity,
			participantIds: [],
		};

		if (skill) {
			event.skill = skill as Skill;
		}

		this.events.push(event);

		return 1;
	}

	addParticipant(email: string, skill?: string) {
		if (
			(skill && !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(skill)) ||
			!email
		)
			return -1;

		const participant: Participant = {
			id: Date.now().toString(),
			email,
		};

		if (skill) {
			participant.skill = skill as Skill;
		}

		this.participants.push(participant);

		return 1;
	}

	registerParticipant(participantId: string, eventId: string) {
		const event = this.events.find((item) => item.id === eventId);
		const participant = this.participants.find(
			(item) => item.id === participantId,
		);

		// validate:
		// event exists?
		// participant exists?
		if (!event || !participant) return -1;

		// participant is already in event list?
		// participant is already in waitlist?
		const isRegistered = event.participantIds.includes(participantId);
		const isInWaitlist = this.waitlist.find(
			(item) =>
				item.eventId === eventId && item.participantId === participantId,
		);
		if (isRegistered || isInWaitlist) return -1;

		// participant has required information to that event?
		if (
			(event.type === "CONFERENCE" && !this.validateEmail(participant.email)) ||
			(event.type === "WORKSHOP" && event.skill !== participant.skill)
		)
			return -1;

		// event has free capacity? if not register in waitlist and return zero
		if (event.participantIds.length === event.capacity) {
			this.waitlist.push({
				eventId,
				participantId,
			});

			return 0;
		}

		event?.participantIds.push(participantId);

		return 1;
	}

	cancelRegistration(participantId: string, eventId: string) {
		const event = this.events.find((item) => item.id === eventId);

		// validate:
		// event exists?
		if (!event) return -1;

		// is participant registered
		const participantIndexInEvent = event.participantIds.indexOf(participantId);
		const participantIndexInWaitlist = this.waitlist.findIndex(
			(item) =>
				item.eventId === eventId && item.participantId === participantId,
		);

		if (participantIndexInEvent < 0 && participantIndexInWaitlist < 0)
			return -1;

		// participant is in waitlist?
		if (participantIndexInWaitlist >= 0) {
			this.waitlist.splice(participantIndexInWaitlist, 1);
			return 1;
		}

		// participant is in event list?
		if (participantIndexInEvent >= 0) {
			event.participantIds.splice(participantIndexInEvent, 1);

			const nextOnWaitlist = this.waitlist.findIndex(
				(item) => item.eventId === eventId,
			);
			if (nextOnWaitlist >= 0) {
				const entry = this.waitlist.splice(nextOnWaitlist, 1)[0];
				if (entry) this.registerParticipant(entry.participantId, eventId);
			}
		}

		return 1;
	}

	validateType(eventType: string) {
		return ["WORKSHOP", "WEBINAR", "CONFERENCE"].includes(eventType);
	}

	validateSkill(eventType: string, skill?: string) {
		const isSkillNotNeeded = eventType !== "WORKSHOP" && !skill;
		const isValidSkill =
			skill && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(skill);

		return isSkillNotNeeded || isValidSkill;
	}

	validateEmail(email: string) {
		return email.includes("@business.org") || email.includes("@company.com");
	}
}
