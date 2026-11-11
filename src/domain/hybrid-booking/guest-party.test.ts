import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CHILD_POLICY,
  CHILDREN_FORM_LIMIT_NOTE,
  CHILDREN_STEPPER_LIMIT,
  MAX_PARSEABLE_CHILDREN,
  canAddChild,
  childPolicyPending,
  childrenStepperMax,
  clampChildren,
  parseChildren,
  partySummary,
} from "./guest-party.ts";

test("children from an address: any sane whole number is kept, never cut to the stepper's bound", () => {
  assert.equal(parseChildren(undefined), 0);
  assert.equal(parseChildren(""), 0);
  assert.equal(parseChildren("2"), 2);
  assert.equal(parseChildren(["3", "5"]), 3);
  assert.equal(parseChildren("7"), 7, "above the stepper's bound: kept, not dropped");
  assert.equal(parseChildren(String(MAX_PARSEABLE_CHILDREN)), MAX_PARSEABLE_CHILDREN);
  for (const bad of ["0", "-1", "1.5", "abc", "100"]) assert.equal(parseChildren(bad), 0, bad);
});

test("a child count is a whole, non-negative number within the parsing bound", () => {
  assert.equal(clampChildren(-2), 0);
  assert.equal(clampChildren(9), 9);
  assert.equal(clampChildren(500), MAX_PARSEABLE_CHILDREN);
  assert.equal(clampChildren(Number.NaN), 0);
});

test("no child policy is confirmed, so nothing about children is enforced", () => {
  assert.equal(CHILD_POLICY.status, "unconfirmed");
  assert.equal(CHILD_POLICY.ageBands, null);
  assert.equal(CHILD_POLICY.countsTowardRoomGuests, null);
  assert.equal(childPolicyPending(0), false);
  assert.equal(childPolicyPending(undefined), false);
  assert.equal(childPolicyPending(1), true);
});

test("the summary names each category and never adds children to adults", () => {
  assert.equal(partySummary({ adults: 2, children: 0 }), "2 người lớn");
  assert.equal(partySummary({ adults: 3, children: 2 }), "3 người lớn · 2 trẻ em");
});

test("the children stepper's bound is the form's, never presented as a VNest rule", () => {
  assert.equal(canAddChild(CHILDREN_STEPPER_LIMIT - 1), true);
  assert.equal(canAddChild(CHILDREN_STEPPER_LIMIT), false);
  assert.equal(childrenStepperMax(2), CHILDREN_STEPPER_LIMIT);
  assert.equal(childrenStepperMax(9), 9, "a larger count from an address is kept and only counted down");
  assert.doesNotMatch(CHILDREN_FORM_LIMIT_NOTE, /tối đa|không (được|nhận)|quy định|chính sách/i, "no wording of a limit or rule");
  assert.match(CHILDREN_FORM_LIMIT_NOTE, /liên hệ VNest/);
});
