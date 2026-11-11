# Nắng property demo and homepage photography — 23 October 2026

Owner requested implementation and visual review using Bare Chic's architecture, with a distinctive image-derived palette. Status: IN REVIEW, not approved or frozen.

Objective: a second credible, image-led property presentation for the CEO demo. Guests can enter from Brand Collection, compare four named rooms, inspect grouped photos and room drawers, and reach the unchanged date selector. Any conversion benefit is a hypothesis; no booking provider is connected.

Direction: retain VNest's typography, spacing, header, mosaic, room index, amenities, location and city-level City Notes. Scope blue-grey, warm beige and timber/gold accents to The Nắng Suites. Mobile retains the swipe gallery and compact room rows. Reusing the detail system avoids duplicating interaction code; a bespoke unrelated layout was rejected as outside the requested scope.

Content: workbook v2 rows 20–23, property-level amenities F20 and transport K20. Intro/story are verbatim excerpts from E20. No unconfirmed dimensions, capacities, bedding or prices. Existing address conflict Q19 remains visible in the location note; no guessed street number. City Notes are city-level, never asserted as walking-distance recommendations.

Media: Blue Moon 17.png for the homepage showcase/card and opening property tile. Seven inspected, people-free Nắng photographs, grouped by their original room folders. Bare Hàn Ground 26.jpg replaces the homepage placeholder. Original watermarks and files retained. AVIF/WebP/JPEG derivatives at 480–1600px without enlargement. Manifest bindings verify source ID and original SHA-256. No public publication authorization is inferred.

Architecture: a new local-only draft builder and /dev/stays/the-nang-suites route, shared PropertyDetail, scoped CSS variables, demo-only photo adapters. Existing exploration routes and draft service catalogue remain unchanged. No PMS mapping or new backend dependency. Route uses existing development-only access gate, noindex metadata, and public no-number pricing regardless of URL parameters.

QA: 1440, 768, 390px; same-tab entry, hero/rooms/gallery/drawer, homepage brand/city filters, preservation journey through Bare Chic/About/Partner/City Notes, broken-image and overflow checks. No commit, deployment or freeze.
