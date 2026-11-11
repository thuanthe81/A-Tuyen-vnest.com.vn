import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readEnv } from "@/config/env";
import type { IsoDate } from "@/domain/dates";
import { createServices } from "./services";

const stay = { checkIn: "2026-12-10" as IsoDate, checkOut: "2026-12-12" as IsoDate, roomAdults: [2] };
const simulation = { "bare-da-kao": "available", "pepper-house": "unavailable" } as const;
const localReview = { DEPLOY_ENV: "development", CONTENT_SOURCE: "mock", BOOKING_PROVIDER: "none" };

describe("availability simulation is fail-closed", () => {
  test("off unless asked for, and only on a declared development deployment", () => {
    assert.equal(readEnv(localReview).availabilitySimulation, false, "not asked for: off");
    assert.equal(readEnv({ ...localReview, AVAILABILITY_SIMULATION: "off" }).availabilitySimulation, false);
    assert.equal(readEnv({ ...localReview, AVAILABILITY_SIMULATION: "private-review" }).availabilitySimulation, true);
    assert.equal(
      readEnv({ CONTENT_SOURCE: "mock", BOOKING_PROVIDER: "none", AVAILABILITY_SIMULATION: "private-review" }).availabilitySimulation,
      false,
      "an unidentified server could be public: refused even though it counts as development for indexing",
    );
  });

  test("asking for it on a preview or production deployment stops the server", () => {
    assert.throws(() => readEnv({ DEPLOY_ENV: "preview", CONTENT_SOURCE: "mock", AVAILABILITY_SIMULATION: "private-review" }), /private local QA only/);
    assert.throws(
      () => readEnv({ DEPLOY_ENV: "production", SITE_URL: "https://vnest.example", CONTENT_SOURCE: "files", BOOKING_PROVIDER: "none", AVAILABILITY_SIMULATION: "private-review" }),
      /private local QA only/,
    );
    assert.throws(() => readEnv({ ...localReview, AVAILABILITY_SIMULATION: "yes" }), /not valid/, "a typo is never read as consent");
  });

  test("the composition root ignores a simulation whenever the deployment does not allow it", async () => {
    const closed = createServices(readEnv(localReview)).hybridAvailability;
    assert.equal(closed.simulationAllowed, false);
    const states = await closed.resolveAll(stay, { simulation });
    assert.equal(states["bare-da-kao"]!.status, "unconfigured", "no simulated 'available' and no simulated price");
    assert.equal(states["pepper-house"]!.status, "unconfigured", "no simulated 'unavailable'");

    const open = createServices(readEnv({ ...localReview, AVAILABILITY_SIMULATION: "private-review" })).hybridAvailability;
    assert.equal(open.simulationAllowed, true);
    const simulated = await open.resolveAll(stay, { simulation });
    assert.equal(simulated["bare-da-kao"]!.status, "available");
    assert.ok(simulated["bare-da-kao"]!.status === "available" && simulated["bare-da-kao"]!.simulated, "flagged as simulated");
  });
});
