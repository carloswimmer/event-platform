import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventSystem } from "./event-system";

function tick(ms = 1) {
	vi.setSystemTime(Date.now() + ms);
}

describe("EventSystem", () => {
	let system: EventSystem;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		system = new EventSystem();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("addEvent", () => {
		it("rejects invalid event type", () => {
			expect(system.addEvent("INVALID" as "WEBINAR", 5)).toBe(-1);
			expect(system.events).toHaveLength(0);
		});

		it("rejects non-positive capacity", () => {
			expect(system.addEvent("WEBINAR", 0)).toBe(-1);
			expect(system.addEvent("WEBINAR", -3)).toBe(-1);
		});

		it("requires valid skill for WORKSHOP", () => {
			expect(system.addEvent("WORKSHOP", 5)).toBe(-1);
			expect(system.addEvent("WORKSHOP", 5, "EXPERT")).toBe(-1);
			expect(system.addEvent("WORKSHOP", 5, "BEGINNER")).toBe(1);
			expect(system.events[0].skill).toBe("BEGINNER");
		});

		it("allows WEBINAR without skill", () => {
			expect(system.addEvent("WEBINAR", 3)).toBe(1);
			expect(system.events[0].skill).toBeUndefined();
		});

		it("allows CONFERENCE without skill", () => {
			expect(system.addEvent("CONFERENCE", 10)).toBe(1);
		});

		it("rejects invalid skill when provided for non-WORKSHOP", () => {
			expect(system.addEvent("WEBINAR", 2, "NOPE")).toBe(-1);
		});
	});

	describe("addParticipant", () => {
		it("rejects missing email", () => {
			expect(system.addParticipant("")).toBe(-1);
		});

		it("rejects invalid skill when provided", () => {
			expect(system.addParticipant("a@b.com", "EXPERT")).toBe(-1);
		});

		it("creates participant with email only", () => {
			expect(system.addParticipant("guest@mail.com")).toBe(1);
			expect(system.participants).toHaveLength(1);
			expect(system.participants[0].email).toBe("guest@mail.com");
		});

		it("creates participant with email and skill", () => {
			expect(system.addParticipant("p@x.com", "INTERMEDIATE")).toBe(1);
			expect(system.participants[0].skill).toBe("INTERMEDIATE");
		});
	});

	describe("registerParticipant", () => {
		it("rejects unknown event or participant", () => {
			system.addEvent("WEBINAR", 1);
			system.addParticipant("a@b.com");
			const eventId = system.events[0].id;
			const participantId = system.participants[0].id;

			expect(system.registerParticipant("missing", eventId)).toBe(-1);
			expect(system.registerParticipant(participantId, "missing")).toBe(-1);
		});

		it("rejects duplicate registration", () => {
			system.addEvent("WEBINAR", 2);
			system.addParticipant("a@b.com");
			const eventId = system.events[0].id;
			const participantId = system.participants[0].id;

			expect(system.registerParticipant(participantId, eventId)).toBe(1);
			expect(system.registerParticipant(participantId, eventId)).toBe(-1);
		});

		it("rejects when already on waitlist for the same event", () => {
			system.addEvent("WEBINAR", 1);
			tick();
			system.addParticipant("a@a.com");
			tick();
			system.addParticipant("b@b.com");
			const eventId = system.events[0].id;
			const pA = system.participants[0].id;
			const pB = system.participants[1].id;

			system.registerParticipant(pA, eventId);
			expect(system.registerParticipant(pB, eventId)).toBe(0);
			expect(system.registerParticipant(pB, eventId)).toBe(-1);
		});

		it("CONFERENCE requires allowed email domain", () => {
			system.addEvent("CONFERENCE", 5);
			system.addParticipant("outsider@gmail.com");
			const eventId = system.events[0].id;
			expect(
				system.registerParticipant(system.participants[0].id, eventId),
			).toBe(-1);

			tick();
			system.addParticipant("emp@business.org");
			expect(
				system.registerParticipant(system.participants[1].id, eventId),
			).toBe(1);

			tick();
			system.addParticipant("org@company.com");
			expect(
				system.registerParticipant(system.participants[2].id, eventId),
			).toBe(1);
		});

		it("WORKSHOP requires participant skill to match event skill", () => {
			system.addEvent("WORKSHOP", 5, "BEGINNER");
			system.addParticipant("w@x.com", "ADVANCED");
			const eventId = system.events[0].id;
			expect(
				system.registerParticipant(system.participants[0].id, eventId),
			).toBe(-1);

			tick();
			system.addParticipant("w2@x.com", "BEGINNER");
			expect(
				system.registerParticipant(system.participants[1].id, eventId),
			).toBe(1);
		});

		it("WEBINAR allows any participant with email", () => {
			system.addEvent("WEBINAR", 2);
			system.addParticipant("any@mail.com");
			expect(
				system.registerParticipant(
					system.participants[0].id,
					system.events[0].id,
				),
			).toBe(1);
		});

		it("waitlists when at capacity and returns 0", () => {
			system.addEvent("WEBINAR", 1);
			tick();
			system.addParticipant("a@a.com");
			tick();
			system.addParticipant("b@b.com");
			const eventId = system.events[0].id;
			const pA = system.participants[0].id;
			const pB = system.participants[1].id;

			expect(system.registerParticipant(pA, eventId)).toBe(1);
			expect(system.registerParticipant(pB, eventId)).toBe(0);
			expect(system.events[0].participantIds).toEqual([pA]);
			expect(system.waitlist).toEqual([{ eventId, participantId: pB }]);
		});

		it("waitlist is FIFO for the same event", () => {
			system.addEvent("WEBINAR", 1);
			tick();
			system.addParticipant("a@a.com");
			tick();
			system.addParticipant("b@b.com");
			tick();
			system.addParticipant("c@c.com");
			const eventId = system.events[0].id;
			const pA = system.participants[0].id;
			const pB = system.participants[1].id;
			const pC = system.participants[2].id;

			system.registerParticipant(pA, eventId);
			system.registerParticipant(pB, eventId);
			system.registerParticipant(pC, eventId);

			expect(system.waitlist.map((w) => w.participantId)).toEqual([pB, pC]);
		});
	});

	describe("cancelRegistration", () => {
		it("rejects unknown event", () => {
			expect(system.cancelRegistration("p", "e")).toBe(-1);
		});

		it("rejects when not registered and not on waitlist", () => {
			system.addEvent("WEBINAR", 2);
			system.addParticipant("a@a.com");
			const eventId = system.events[0].id;
			const participantId = system.participants[0].id;

			expect(system.cancelRegistration(participantId, eventId)).toBe(-1);
		});

		it("removes participant from waitlist only", () => {
			system.addEvent("WEBINAR", 1);
			tick();
			system.addParticipant("a@a.com");
			tick();
			system.addParticipant("b@b.com");
			const eventId = system.events[0].id;
			const pA = system.participants[0].id;
			const pB = system.participants[1].id;

			system.registerParticipant(pA, eventId);
			system.registerParticipant(pB, eventId);

			expect(system.cancelRegistration(pB, eventId)).toBe(1);
			expect(system.waitlist).toHaveLength(0);
			expect(system.events[0].participantIds).toEqual([pA]);
		});

		it("promotes first waitlisted participant (FIFO) when registered cancels", () => {
			system.addEvent("WEBINAR", 1);
			tick();
			system.addParticipant("a@a.com");
			tick();
			system.addParticipant("b@b.com");
			tick();
			system.addParticipant("c@c.com");
			const eventId = system.events[0].id;
			const pA = system.participants[0].id;
			const pB = system.participants[1].id;
			const pC = system.participants[2].id;

			system.registerParticipant(pA, eventId);
			system.registerParticipant(pB, eventId);
			system.registerParticipant(pC, eventId);

			expect(system.cancelRegistration(pA, eventId)).toBe(1);
			expect(system.events[0].participantIds).toEqual([pB]);
			expect(system.waitlist).toEqual([{ eventId, participantId: pC }]);
		});
	});
});
