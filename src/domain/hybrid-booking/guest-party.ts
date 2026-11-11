/**
 * THE GUEST PARTY: who is travelling, by category (client-safe, pure).
 *
 * Owner brief, Phase D (9/11/2026): one guest field with adults and children, rooms kept in the booking model but not
 * shown in the homepage bar. VNest has NOT confirmed any child policy: no age brackets, no charges, no limit per room,
 * no rule on whether a child counts towards a room's guests. The workbook's "Trẻ em / vật nuôi / quy định đặc biệt"
 * line reads "Không áp dụng", which is ambiguous (Q25). So, until VNest confirms:
 *
 * - children are a separate count, never added to `adults` and never part of the 1–2 guests per room rule
 *   (room-occupancy.ts counts adults only);
 * - no age, charge or capacity rule is applied to them, and no age bracket is shown;
 * - a provider is never asked about a stay with children as if it had none (resolve-availability: `children-policy`),
 *   and every summary that carries the stay says the child policy is still to be confirmed.
 *
 * Extending it: when VNest confirms age bands, add them to `CHILD_POLICY` and, if providers need ages, carry
 * `childAges` (one entry per child) beside `children`; the count stays the field's own value.
 */
export interface GuestParty {
  /** Adults: the guests the room rule counts (1–2 per room, provisional). At least 1. */
  adults: number;
  /** Children, of any age (bands unconfirmed). 0 or more; never folded into `adults`. */
  children: number;
}

export type ChildPolicy = {
  status: "unconfirmed" | "confirmed";
  /** Age bands as VNest defines them (e.g. "0–5", "6–11"); null until supplied. */
  ageBands: null | readonly { id: string; label: string; minAge: number; maxAge: number }[];
  /** Whether a child takes one of a room's guest places; null = not known, so nothing is enforced. */
  countsTowardRoomGuests: boolean | null;
};

/** What VNest has confirmed about children: nothing yet. */
export const CHILD_POLICY: ChildPolicy = Object.freeze({ status: "unconfirmed", ageBands: null, countsTowardRoomGuests: null });

/*
 * TECHNICAL BOUNDS, NOT POLICY (audit, Phase D refinement, 10/11/2026). VNest has set no limit on children; none of the
 * numbers below may be shown or described as an accommodation rule. They keep input and addresses sane, nothing more.
 * The provisional ADULT rule (1–2 per room, ≤ 6 rooms, ≤ 12 adults, owner 5/11/2026) is separate: room-occupancy.ts.
 */

/**
 * How far the children stepper counts up: a form bound chosen by the build team (same number as the request's room
 * limit, so a party of 12 adults and 6 children still fits one request). Not a VNest rule. At the bound the panel says
 * only that a larger group should contact VNest (CHILDREN_FORM_LIMIT_NOTE), never that more children are not allowed.
 */
export const CHILDREN_STEPPER_LIMIT = 6;

/** The largest `children` an address may carry: a sanity bound for parsing (as `MAX_PARSEABLE_ADULTS`), not a policy. */
export const MAX_PARSEABLE_CHILDREN = 99;

export const NO_CHILDREN = 0;

/**
 * `children` from an address: a whole number 1…MAX_PARSEABLE_CHILDREN, anything else is no children. A count above the
 * stepper's bound is kept as it is (never cut down or dropped); the stepper then only counts down from it.
 */
export function parseChildren(raw: string | readonly string[] | null | undefined): number {
  const text = (typeof raw === "string" ? raw : raw?.[0])?.trim();
  if (!text || !/^\d{1,2}$/.test(text)) return NO_CHILDREN;
  const value = Number(text);
  return value >= 1 && value <= MAX_PARSEABLE_CHILDREN ? value : NO_CHILDREN;
}

/** A whole, non-negative count within the parsing bound. */
export function clampChildren(value: number): number {
  return Math.max(NO_CHILDREN, Math.min(MAX_PARSEABLE_CHILDREN, Math.round(value) || 0));
}

/** Whether the stepper offers one more child: up to its bound, and never above a larger count already given. */
export function canAddChild(children: number): boolean {
  return children < CHILDREN_STEPPER_LIMIT;
}

/** The stepper's top for the current count: its bound, or a larger count from an address (kept, only counted down). */
export function childrenStepperMax(children: number): number {
  return Math.max(CHILDREN_STEPPER_LIMIT, children);
}

/** Shown once the stepper's bound is reached: the form's reach, not a rule. Build-team draft, owner review. */
export const CHILDREN_FORM_LIMIT_NOTE = `Đi cùng hơn ${CHILDREN_STEPPER_LIMIT} trẻ em? Vui lòng liên hệ VNest để được hỗ trợ.`;

/** True while children are in the party and VNest has not confirmed how they are booked. */
export function childPolicyPending(children: number | undefined): boolean {
  return (children ?? 0) > 0 && CHILD_POLICY.status !== "confirmed";
}

/** "2 người lớn", "2 người lớn · 1 trẻ em". */
export function partySummary(party: GuestParty): string {
  const adults = `${party.adults} người lớn`;
  return party.children > 0 ? `${adults} · ${party.children} trẻ em` : adults;
}

/** The one line shown wherever children are in a stay that is not yet confirmed. Build-team draft, owner review. */
export const CHILD_POLICY_NOTE = "Chính sách trẻ em (độ tuổi, phụ thu, số trẻ mỗi phòng) đang chờ VNest xác nhận. VNest sẽ xác nhận với bạn trước khi giữ phòng.";
