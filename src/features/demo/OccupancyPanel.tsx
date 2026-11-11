"use client";

import { GuestStepper } from "@/features/booking-search/fields/GuestStepper";
import { useStaySearch } from "@/features/booking-search/StaySearchProvider";
import { CHILD_POLICY_NOTE, CHILDREN_FORM_LIMIT_NOTE, canAddChild, childrenStepperMax } from "@/domain/hybrid-booking/guest-party";
import { MAX_GUESTS_PER_STAY, MAX_ROOMS_PER_STAY } from "@/domain/hybrid-booking/room-occupancy";
import { useDemoRooms } from "./BookingCta";
import { ROOMS_LATER_NOTE, occupancyNote, occupancySteps } from "./occupancy-copy";

/**
 * THE GUEST PANEL of the demo bar, inside the 02.1 bar's own guests panel (desktop) and sheet section (phones).
 *
 * - Adults and children, each with its own stepper (Phase D, 9/11/2026). Children are a separate count: no age band,
 *   charge or per-room limit is applied, because VNest has confirmed none (guest-party.ts); while there are children
 *   the panel says the policy is still to be confirmed.
 * - Property pages (`roomField: "shown"`): the combined "Phòng & khách" field as frozen on 4/11, plus the children row.
 *   Rooms and adults are each the guest's own choice; N rooms take N to 2N adults (provisional rule, room-occupancy.ts);
 *   adults stop at two per room; a room is never added or removed for them; the per-room split is internal.
 * - Homepage (`roomField: "hidden"`): no room stepper. Adults go up to the request's limit and rooms are chosen at room
 *   selection, starting from the fewest that fit (occupancyFromQuery). Nothing is changed silently.
 */
export { GUEST_CAP_NOTE, GUESTS_LABEL, OCCUPANCY_LABEL, occupancyNote, occupancySummary } from "./occupancy-copy";

export function OccupancyPanel() {
  const search = useStaySearch();
  const rooms = useDemoRooms();
  if (!rooms) return null;
  const { roomAdults, guests, setOccupancy, children, setChildren, roomField } = rooms;
  const count = roomAdults.length;
  const steps = occupancySteps(guests, count, search.maxAdults);
  const withRooms = roomField === "shown";
  const adultsCap = Math.min(search.maxAdults, MAX_GUESTS_PER_STAY);

  const childrenRow = (
    <GuestStepper
      adults={children}
      min={0}
      max={childrenStepperMax(children)}
      onChange={setChildren}
      label="Trẻ em"
      decreaseLabel="Bớt một trẻ em"
      increaseLabel="Thêm một trẻ em"
      valueLabel={(n) => `${n} trẻ em`}
    />
  );

  return (
    <div className="flex flex-col gap-3" data-testid="occupancy-panel" data-room-field={roomField}>
      {withRooms ? (
        <GuestStepper
          adults={guests}
          min={steps.guestsDown ? guests - 1 : guests}
          max={steps.guestsUp ? guests + 1 : guests}
          onChange={(next) => setOccupancy(next, count)}
          decreaseLabel="Bớt một người lớn"
          increaseLabel="Thêm một người lớn"
          valueLabel={(n) => `${n} người lớn`}
        />
      ) : (
        <GuestStepper
          adults={guests}
          min={1}
          max={adultsCap}
          onChange={(next) => search.setAdults(next)}
          decreaseLabel="Bớt một người lớn"
          increaseLabel="Thêm một người lớn"
          valueLabel={(n) => `${n} người lớn`}
        />
      )}
      {childrenRow}
      {withRooms ? (
        <GuestStepper
          adults={count}
          min={steps.roomsDown ? count - 1 : count}
          max={steps.roomsUp ? count + 1 : count}
          onChange={(next) => setOccupancy(guests, next)}
          label="Phòng"
          decreaseLabel="Bớt một phòng"
          increaseLabel="Thêm một phòng"
          valueLabel={(n) => `${n} phòng`}
        />
      ) : null}
      <p className="text-sm leading-snug text-ink-muted" aria-live="polite" data-testid="occupancy-note">
        {withRooms
          ? occupancyNote(guests, count)
          : guests >= adultsCap
            ? `Tối đa ${MAX_ROOMS_PER_STAY} phòng, ${MAX_GUESTS_PER_STAY} người lớn cho mỗi yêu cầu. ${ROOMS_LATER_NOTE}`
            : ROOMS_LATER_NOTE}
      </p>
      {children > 0 ? (
        <p className="text-sm leading-snug text-ink-muted" data-testid="child-policy-note">
          {CHILD_POLICY_NOTE}
        </p>
      ) : null}
      {/* The stepper's bound is the form's, not VNest's (guest-party.ts): it says where to go, not that it is not allowed. */}
      {!canAddChild(children) ? (
        <p className="text-sm leading-snug text-ink-muted" data-testid="children-form-limit-note">
          {CHILDREN_FORM_LIMIT_NOTE}
        </p>
      ) : null}
    </div>
  );
}
