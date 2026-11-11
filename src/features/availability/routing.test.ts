import assert from "node:assert/strict";
import { test } from "node:test";
import { routes } from "@/config/routes";
import { parseIsoDate } from "@/domain/dates";
import { parseStaySearch } from "@/domain/search";
import { legacyPropertyRedirect, propertyHref, withMockScenario } from "./routing";

const known = ["co-so-mau-a", "co-so-mau-b"];
const stay = { checkIn: "2026-11-12", checkOut: "2026-11-15" };
const redirect = (query: Record<string, string | string[]>, options?: { mockEnabled?: boolean }) => legacyPropertyRedirect(query, known, "vi", options);

test("legacy /stays?property= goes to the property's own page with the stay intact", () => {
  assert.equal(redirect({ property: "co-so-mau-a", ...stay, adults: "3" }), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15&adults=3");
  // The default guest count is not repeated in the address, as everywhere else on the site.
  assert.equal(redirect({ property: "co-so-mau-a", ...stay, adults: "2" }), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15");
  assert.equal(redirect({ property: "co-so-mau-b", ...stay }), "/stays/co-so-mau-b?checkIn=2026-11-12&checkOut=2026-11-15");
});

test("a property with no dates still goes to its page, in browse mode", () => {
  assert.equal(redirect({ property: "co-so-mau-a" }), "/stays/co-so-mau-a");
  assert.equal(redirect({ property: "co-so-mau-a", adults: "4" }), "/stays/co-so-mau-a?adults=4");
  // Half a stay is carried as it is; the property page then asks for the other date.
  assert.equal(redirect({ property: "co-so-mau-a", checkIn: "2026-11-12" }), "/stays/co-so-mau-a?checkIn=2026-11-12");
});

test("only valid criteria are carried: malformed values are dropped, never passed along", () => {
  assert.equal(redirect({ property: "co-so-mau-a", checkIn: "2026-02-30", checkOut: "soon", adults: "many" }), "/stays/co-so-mau-a");
  assert.equal(redirect({ property: "co-so-mau-a", ...stay, adults: "0" }), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15");
  // Dates in the wrong order are both real dates, so they travel; the property page reports the problem.
  assert.equal(redirect({ property: "co-so-mau-a", checkIn: "2026-11-15", checkOut: "2026-11-12" }), "/stays/co-so-mau-a?checkIn=2026-11-15&checkOut=2026-11-12");
});

test("nothing from the request reaches the address unparsed", () => {
  const hostile = redirect({ property: "co-so-mau-a", ...stay, next: "https://evil.example", utm_source: "x", destination: "area", checkIn: ["2026-11-12", "//evil.example"] });
  assert.equal(hostile, "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15");
  for (const property of ["//evil.example", "../admin", "co-so-mau-a/../../x", "https://evil.example", "CO-SO-MAU-A", "co-so-mau-a?x=1"]) {
    assert.equal(redirect({ property, ...stay }), undefined, property);
  }
  // Whatever is asked, the result is a path on this site under /stays/.
  assert.match(redirect({ property: "co-so-mau-a", ...stay })!, /^\/stays\/[a-z0-9-]+(\?|$)/);
});

test("no property, or one the site does not know, stays on /stays and searches everything", () => {
  assert.equal(redirect({ ...stay }), undefined);
  assert.equal(redirect({ property: "", ...stay }), undefined);
  assert.equal(redirect({ property: "nowhere", ...stay }), undefined);
  assert.equal(redirect({}), undefined);
});

test("the development scenario travels only when the mock provider is in use, and only if it is a known one", () => {
  const query = { property: "co-so-mau-a", ...stay, mock: "with-rates" };
  assert.equal(redirect(query), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15");
  assert.equal(redirect(query, { mockEnabled: true }), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15&mock=with-rates");
  assert.equal(redirect({ ...query, mock: "<script>" }, { mockEnabled: true }), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15");
  assert.equal(redirect({ property: "co-so-mau-a", mock: "sold-out" }, { mockEnabled: true }), "/stays/co-so-mau-a?mock=sold-out");
});

test("the stay survives the round trip: what the redirect carries is what the property page reads", () => {
  const target = redirect({ property: "co-so-mau-a", ...stay, adults: "5" })!;
  const read = parseStaySearch(Object.fromEntries(new URL(target, "https://vnest.example").searchParams));
  assert.deepEqual(read.state.criteria, { checkIn: parseIsoDate("2026-11-12"), checkOut: parseIsoDate("2026-11-15"), adults: 5 });
  assert.deepEqual(read.issues, []);
  // The property is the route now, not a parameter.
  assert.deepEqual(read.state.filters, {});
});

test("links to a property carry the stay, and back to all properties too", () => {
  const criteria = { checkIn: parseIsoDate("2026-11-12")!, checkOut: parseIsoDate("2026-11-15")!, adults: 2 };
  assert.equal(propertyHref("co-so-mau-a", "vi", criteria), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15");
  assert.equal(propertyHref("co-so-mau-a", "vi", { adults: 2 }), "/stays/co-so-mau-a");
  assert.equal(propertyHref("co-so-mau-a", "vi", criteria, "sold-out"), "/stays/co-so-mau-a?checkIn=2026-11-12&checkOut=2026-11-15&mock=sold-out");
  assert.equal(routes.stays("vi", { criteria, filters: {} }), "/stays?checkIn=2026-11-12&checkOut=2026-11-15");
  assert.equal(withMockScenario("/stays", "error"), "/stays?mock=error");
  assert.equal(withMockScenario("/stays", undefined), "/stays");
});
