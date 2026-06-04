import type { EventType, Skill } from "@event-platform/shared-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInMemoryRepos, type InMemoryRepos } from "../testing/create-in-memory-repos";
import { cancelRegistration } from "./cancel-registration.use-case";
import { createEvent } from "./create-event.use-case";
import { createParticipant } from "./create-participant.use-case";
import { registerParticipant } from "./register-participant.use-case";

function tick(ms = 1) {
	vi.setSystemTime(Date.now() + ms);
}

function waitlistWithoutTimestamps(
	repos: InMemoryRepos,
): { eventId: string; participantId: string }[] {
	return repos.waitlist
		.getAll()
		.map(({ eventId, participantId }) => ({ eventId, participantId }));
}

describe("domain use-cases (reference scenarios)", () => {
	let repos: InMemoryRepos;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		repos = createInMemoryRepos();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("createEvent", () => {
		it("rejects invalid event type", async () => {
			const response = await createEvent(repos.events, {
				type: "INVALID" as EventType,
				capacity: 5,
			});
			expect(response.result).toBe(-1);
			expect(repos.events.getAll()).toHaveLength(0);
		});

		it("rejects non-positive capacity", async () => {
			expect((await createEvent(repos.events, { type: "WEBINAR", capacity: 0 })).result).toBe(-1);
			expect((await createEvent(repos.events, { type: "WEBINAR", capacity: -3 })).result).toBe(-1);
		});

		it("requires valid skill for WORKSHOP", async () => {
			expect((await createEvent(repos.events, { type: "WORKSHOP", capacity: 5 })).result).toBe(-1);
			expect(
				(await createEvent(repos.events, {
					type: "WORKSHOP",
					capacity: 5,
					skill: "EXPERT" as Skill,
				})).result,
			).toBe(-1);
			expect(
				(await createEvent(repos.events, {
					type: "WORKSHOP",
					capacity: 5,
					skill: "BEGINNER",
				})).result,
			).toBe(1);
			expect(repos.events.getAll()[0]?.skill).toBe("BEGINNER");
		});

		it("allows WEBINAR without skill", async () => {
			expect((await createEvent(repos.events, { type: "WEBINAR", capacity: 3 })).result).toBe(1);
			expect(repos.events.getAll()[0]?.skill).toBeUndefined();
		});

		it("allows CONFERENCE without skill", async () => {
			expect((await createEvent(repos.events, { type: "CONFERENCE", capacity: 10 })).result).toBe(1);
		});

		it("rejects invalid skill when provided for non-WORKSHOP", async () => {
			expect(
				(await createEvent(repos.events, {
					type: "WEBINAR",
					capacity: 2,
					skill: "NOPE" as Skill,
				})).result,
			).toBe(-1);
		});
	});

	describe("createParticipant", () => {
		it("rejects missing email", async () => {
			expect((await createParticipant(repos.participants, { email: "" })).result).toBe(-1);
		});

		it("rejects invalid skill when provided", async () => {
			expect(
				(await createParticipant(repos.participants, {
					email: "a@b.com",
					skill: "EXPERT" as Skill,
				})).result,
			).toBe(-1);
		});

		it("creates participant with email only", async () => {
			expect((await createParticipant(repos.participants, { email: "guest@mail.com" })).result).toBe(1);
			expect(repos.participants.getAll()).toHaveLength(1);
			expect(repos.participants.getAll()[0]?.email).toBe("guest@mail.com");
		});

		it("creates participant with email and skill", async () => {
			expect(
				(await createParticipant(repos.participants, {
					email: "p@x.com",
					skill: "INTERMEDIATE",
				})).result,
			).toBe(1);
			expect(repos.participants.getAll()[0]?.skill).toBe("INTERMEDIATE");
		});
	});

	describe("registerParticipant", () => {
		it("rejects unknown event or participant", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 1 });
			await createParticipant(repos.participants, { email: "a@b.com" });
			const eventId = repos.events.getAll()[0].id;
			const participantId = repos.participants.getAll()[0].id;

			expect((await registerParticipant(repos, "missing", eventId)).result).toBe(-1);
			expect((await registerParticipant(repos, participantId, "missing")).result).toBe(-1);
		});

		it("rejects duplicate registration", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 2 });
			await createParticipant(repos.participants, { email: "a@b.com" });
			const eventId = repos.events.getAll()[0].id;
			const participantId = repos.participants.getAll()[0].id;

			expect((await registerParticipant(repos, participantId, eventId)).result).toBe(1);
			expect((await registerParticipant(repos, participantId, eventId)).result).toBe(-1);
		});

		it("rejects when already on waitlist for the same event", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 1 });
			tick();
			await createParticipant(repos.participants, { email: "a@a.com" });
			tick();
			await createParticipant(repos.participants, { email: "b@b.com" });
			const eventId = repos.events.getAll()[0].id;
			const pA = repos.participants.getAll()[0].id;
			const pB = repos.participants.getAll()[1].id;

			await registerParticipant(repos, pA, eventId);
			expect((await registerParticipant(repos, pB, eventId)).result).toBe(0);
			expect((await registerParticipant(repos, pB, eventId)).result).toBe(-1);
		});

		it("CONFERENCE requires allowed email domain", async () => {
			await createEvent(repos.events, { type: "CONFERENCE", capacity: 5 });
			await createParticipant(repos.participants, { email: "outsider@gmail.com" });
			const eventId = repos.events.getAll()[0].id;
			expect(
				(await registerParticipant(repos, repos.participants.getAll()[0].id, eventId)).result,
			).toBe(-1);

			tick();
			await createParticipant(repos.participants, { email: "emp@business.org" });
			expect(
				(await registerParticipant(repos, repos.participants.getAll()[1].id, eventId)).result,
			).toBe(1);

			tick();
			await createParticipant(repos.participants, { email: "org@company.com" });
			expect(
				(await registerParticipant(repos, repos.participants.getAll()[2].id, eventId)).result,
			).toBe(1);
		});

		it("WORKSHOP requires participant skill to match event skill", async () => {
			await createEvent(repos.events, {
				type: "WORKSHOP",
				capacity: 5,
				skill: "BEGINNER",
			});
			await createParticipant(repos.participants, {
				email: "w@x.com",
				skill: "ADVANCED",
			});
			const eventId = repos.events.getAll()[0].id;
			expect(
				(await registerParticipant(repos, repos.participants.getAll()[0].id, eventId)).result,
			).toBe(-1);

			tick();
			await createParticipant(repos.participants, {
				email: "w2@x.com",
				skill: "BEGINNER",
			});
			expect(
				(await registerParticipant(repos, repos.participants.getAll()[1].id, eventId)).result,
			).toBe(1);
		});

		it("WEBINAR allows any participant with email", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 2 });
			await createParticipant(repos.participants, { email: "any@mail.com" });
			expect(
				(
					await registerParticipant(
						repos,
						repos.participants.getAll()[0].id,
						repos.events.getAll()[0].id,
					)
				).result,
			).toBe(1);
		});

		it("waitlists when at capacity and returns 0", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 1 });
			tick();
			await createParticipant(repos.participants, { email: "a@a.com" });
			tick();
			await createParticipant(repos.participants, { email: "b@b.com" });
			const eventId = repos.events.getAll()[0].id;
			const pA = repos.participants.getAll()[0].id;
			const pB = repos.participants.getAll()[1].id;

			expect((await registerParticipant(repos, pA, eventId)).result).toBe(1);
			expect((await registerParticipant(repos, pB, eventId)).result).toBe(0);
			expect(repos.events.getAll()[0].participantIds).toEqual([pA]);
			expect(waitlistWithoutTimestamps(repos)).toEqual([{ eventId, participantId: pB }]);
		});

		it("waitlist is FIFO for the same event", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 1 });
			tick();
			await createParticipant(repos.participants, { email: "a@a.com" });
			tick();
			await createParticipant(repos.participants, { email: "b@b.com" });
			tick();
			await createParticipant(repos.participants, { email: "c@c.com" });
			const eventId = repos.events.getAll()[0].id;
			const pA = repos.participants.getAll()[0].id;
			const pB = repos.participants.getAll()[1].id;
			const pC = repos.participants.getAll()[2].id;

			await registerParticipant(repos, pA, eventId);
			await registerParticipant(repos, pB, eventId);
			await registerParticipant(repos, pC, eventId);

			expect(
				repos.waitlist.getAll().map((entry) => entry.participantId),
			).toEqual([pB, pC]);
		});
	});

	describe("cancelRegistration", () => {
		it("rejects unknown event", async () => {
			expect((await cancelRegistration(repos, "p", "e")).result).toBe(-1);
		});

		it("rejects when not registered and not on waitlist", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 2 });
			await createParticipant(repos.participants, { email: "a@a.com" });
			const eventId = repos.events.getAll()[0].id;
			const participantId = repos.participants.getAll()[0].id;

			expect((await cancelRegistration(repos, participantId, eventId)).result).toBe(-1);
		});

		it("removes participant from waitlist only", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 1 });
			tick();
			await createParticipant(repos.participants, { email: "a@a.com" });
			tick();
			await createParticipant(repos.participants, { email: "b@b.com" });
			const eventId = repos.events.getAll()[0].id;
			const pA = repos.participants.getAll()[0].id;
			const pB = repos.participants.getAll()[1].id;

			await registerParticipant(repos, pA, eventId);
			await registerParticipant(repos, pB, eventId);

			expect((await cancelRegistration(repos, pB, eventId)).result).toBe(1);
			expect(repos.waitlist.getAll()).toHaveLength(0);
			expect(repos.events.getAll()[0].participantIds).toEqual([pA]);
		});

		it("promotes first waitlisted participant (FIFO) when registered cancels", async () => {
			await createEvent(repos.events, { type: "WEBINAR", capacity: 1 });
			tick();
			await createParticipant(repos.participants, { email: "a@a.com" });
			tick();
			await createParticipant(repos.participants, { email: "b@b.com" });
			tick();
			await createParticipant(repos.participants, { email: "c@c.com" });
			const eventId = repos.events.getAll()[0].id;
			const pA = repos.participants.getAll()[0].id;
			const pB = repos.participants.getAll()[1].id;
			const pC = repos.participants.getAll()[2].id;

			await registerParticipant(repos, pA, eventId);
			await registerParticipant(repos, pB, eventId);
			await registerParticipant(repos, pC, eventId);

			expect((await cancelRegistration(repos, pA, eventId)).result).toBe(1);
			expect(repos.events.getAll()[0].participantIds).toEqual([pB]);
			expect(waitlistWithoutTimestamps(repos)).toEqual([
				{ eventId, participantId: pC },
			]);
		});
	});
});
