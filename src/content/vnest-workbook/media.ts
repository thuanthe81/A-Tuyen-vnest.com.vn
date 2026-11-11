/**
 * Photography for the client-content preview (03.3-C1). NO PHOTOGRAPH IS USED YET.
 *
 * Gate G2 (photography) needs an explicit authorisation, recorded in `G2_AUTHORISATION` below,
 * before anything is downloaded: the fetch script (docs/content/g2/fetch-photos.mjs) refuses to
 * run without it, and the page shows no photograph without it. Until then every property shows
 * a labelled placeholder. This file
 * keeps the proposed mapping ready for that checkpoint, with each file's provenance as read
 * from its public Drive folder page on 15/10/2026 (file names, ids, byte sizes and owner only;
 * nothing was downloaded). Choices were made from thumbnails and are checked at full size,
 * with sha256 recorded, only after G2 is authorised. Proposal: docs/content/03.3-C1-PROPOSAL.md §2.
 */

/** Rights as far as they are known. `client-supplied-unconfirmed`: VNest shared it; no licence, credit or use scope stated. */
export type RightsStatus = "client-supplied-unconfirmed";

/**
 * An explicit authorisation to use the client photographs, as given: by whom, in what capacity,
 * when, for which use, and where it is written down. The only scope this preview supports is
 * private review on a local machine: never committed, never deployed, never published.
 */
export type Authorisation = {
  grantedBy: string;
  /** e.g. "VNest CEO", "project owner on VNest's behalf". */
  capacity: string;
  /** ISO date. */
  date: string;
  scope: "private-local-review";
  /** Where the authorisation is recorded: a message, an email, a review-log entry. */
  reference: string;
  /** Drive file ids covered. Only these may be downloaded. */
  driveFileIds: readonly string[];
};

/**
 * GRANTED 18/10/2026 by the project owner in the review session, quoted:
 * "Authorised: VNest permits private local review (never committed, deployed or published) of the
 * four G2 photos: Bare Chic 1.55.png, Bare Hyphen a-16.jpg, Bare Đa Kao Bare ĐaKao_28 (6).jpg,
 * Pepper House 03.jpg. Granted by: [name, capacity], reference: [where recorded]."
 * The name, capacity and reference were left as placeholders in that message; they are recorded
 * as such and are to be completed by the owner. Covers these four files and this use only.
 */
export const G2_AUTHORISATION: Authorisation | null = {
  grantedBy: "VNest, as relayed by the project owner (name not given: \"[name, capacity]\" left blank)",
  capacity: "not stated",
  date: "2026-10-18",
  scope: "private-local-review",
  reference: "Owner's message in the 03.3-C1 review session, 18/10/2026 (\"[where recorded]\" left blank)",
  driveFileIds: ["1-LBqLAjsV3lNI5Y-FA1t8DIEYbG4hKKh", "10GZwC3dwPRjDFabf469USnJ_JZ4TXKI0", "1Jdnn7yNc5cJISHoZ3JOCt3OiV7A_d-4A", "1XRJfeb0xCDizmjOw5A_idKnhkDjepTJ1"],
};

export type ProposedImage = {
  role: "primary" | "alternate";
  folderId: string;
  folderTitle: string;
  /** Workbook cells whose hyperlink is this folder. */
  linkedFrom: readonly string[];
  file: string;
  driveFileId: string;
  bytes: number;
  mime: "image/png" | "image/jpeg";
  /** Last modified, UTC, as listed by Drive. */
  modified: string;
  /** Who distributed it, not who holds the rights. */
  driveOwner: string;
  rights: RightsStatus;
  /** Not stored per image: see `G2_AUTHORISATION` and its `driveFileIds`. */
  authorisation: null;
  note?: string;
};

const OWNER = "letsbare.today@gmail.com";
const RIGHTS: RightsStatus = "client-supplied-unconfirmed";

/** Proposed images per property id. Bare Hàn and The Nắng Suites have none: their folders conflict. */
export const PROPOSED_IMAGES: Readonly<Record<string, readonly ProposedImage[]>> = {
  "bare-chic": [
    { role: "primary", folderId: "1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4", folderTitle: "Bare Chic One", linkedFrom: ["D4"], file: "1.55.png", driveFileId: "1-LBqLAjsV3lNI5Y-FA1t8DIEYbG4hKKh", bytes: 3635039, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
    { role: "alternate", folderId: "1-LJx_HPTYOn3GqOEXa8CDX5Rtg512e3L", folderTitle: "Bare Chic Two", linkedFrom: ["D5"], file: "2.3.png", driveFileId: "1N_0CxERGAIcDBC7BQkkXXCa-0UvXLsPB", bytes: 3431825, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
  ],
  "bare-hyphen": [
    {
      role: "primary",
      folderId: "1WbvKxpl5G8VAsuTsS9Qrf0YHehU1nIsc",
      folderTitle: "Bare Hyphen One",
      linkedFrom: ["D8"],
      file: "a-16.jpg",
      driveFileId: "10GZwC3dwPRjDFabf469USnJ_JZ4TXKI0",
      bytes: 1921051,
      mime: "image/jpeg",
      modified: "2026-10-13",
      driveOwner: OWNER,
      rights: RIGHTS,
      authorisation: null,
      note: "A file of the same name and byte size is in Bare Hyphen Three (1BqFN2J56qvm_XecltM-XFA_AmaXKWNm_): the room is uncertain, the property is not",
    },
    { role: "alternate", folderId: "1Jk6WG-M5Ld6tsUiMYXx2cHdKig-0OLA5", folderTitle: "Bare Hyphen Two", linkedFrom: ["D9"], file: "a-74.jpg", driveFileId: "1jqWs_7AAuJ89jVHMMw3UzRWL4ngWizaK", bytes: 1740838, mime: "image/jpeg", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
  ],
  "bare-da-kao": [
    { role: "primary", folderId: "1TZJ8RysVLkRy3SxikbyiGlK1fq1Xl2Ii", folderTitle: "Bare Đa Kao One", linkedFrom: ["D12"], file: "Bare ĐaKao_28 (6).jpg", driveFileId: "1Jdnn7yNc5cJISHoZ3JOCt3OiV7A_d-4A", bytes: 2262885, mime: "image/jpeg", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
    { role: "alternate", folderId: "1G5U-P00SFqMk6n7QNz66SD3HXNhfkxrh", folderTitle: "Bare Đa Kao Four", linkedFrom: ["D15"], file: "Bare ĐaKao_31 (1).jpg", driveFileId: "1vJuJJv8Sr11jjLZWhFisUdsDYqYA6iVz", bytes: 2243207, mime: "image/jpeg", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
  ],
  "pepper-house": [
    { role: "primary", folderId: "1lk7TQU8WNX5y1YfUroMX37TCmv957tI7", folderTitle: "Pepper house 3rd-floor", linkedFrom: ["D24"], file: "03.jpg", driveFileId: "1XRJfeb0xCDizmjOw5A_idKnhkDjepTJ1", bytes: 1796229, mime: "image/jpeg", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
    { role: "alternate", folderId: "1lk7TQU8WNX5y1YfUroMX37TCmv957tI7", folderTitle: "Pepper house 3rd-floor", linkedFrom: ["D24"], file: "01.jpg", driveFileId: "1LoD0sZwW7DlnRJ6CByf_SNv4-aU5AQoT", bytes: 2040778, mime: "image/jpeg", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS, authorisation: null },
  ],
};

/**
 * G3 (section 05.2, Bare Chic property detail): five more Bare Chic photographs, so each room has
 * its own picture and the opening has two supporting frames. Chosen from the folder thumbnails of
 * 15/10/2026; provenance as listed by Drive then. Each is captioned with its room wherever shown.
 */
export type G3Image = {
  key: string;
  property: "bare-chic";
  /** The workbook room (row C) the folder belongs to. */
  room: "Bare Chic One" | "Bare Chic Two" | "Bare Chic Three" | "Bare Indochine";
  use: "room" | "supporting-frame" | "room-gallery";
  folderId: string;
  folderTitle: string;
  linkedFrom: readonly string[];
  file: string;
  driveFileId: string;
  bytes: number;
  mime: "image/png";
  modified: string;
  driveOwner: string;
  rights: RightsStatus;
};

export const G3_IMAGES: readonly G3Image[] = [
  { key: "bare-chic-two-2-3", property: "bare-chic", room: "Bare Chic Two", use: "room", folderId: "1-LJx_HPTYOn3GqOEXa8CDX5Rtg512e3L", folderTitle: "Bare Chic Two", linkedFrom: ["D5"], file: "2.3.png", driveFileId: "1N_0CxERGAIcDBC7BQkkXXCa-0UvXLsPB", bytes: 3431825, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS },
  { key: "bare-chic-three-1-29", property: "bare-chic", room: "Bare Chic Three", use: "room", folderId: "1w_pMRvlJe_y1Fl0bQ9NGVLiFuU9M16fi", folderTitle: "Bare Chic Three", linkedFrom: ["D6"], file: "1.29.png", driveFileId: "1LHikT4DdHTiT8Qz7pSoKV2G8H1fPImWy", bytes: 3193072, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS },
  { key: "bare-indochine-53", property: "bare-chic", room: "Bare Indochine", use: "room", folderId: "1zzTq0l1QIhwPkUayZDvQKrUw2f4jETHk", folderTitle: "Bare Indochine", linkedFrom: ["D7"], file: "53.png", driveFileId: "16wjWHq1rooWa2IHOPy_g2jwas84uLIsu", bytes: 3101575, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS },
  { key: "bare-indochine-54", property: "bare-chic", room: "Bare Indochine", use: "supporting-frame", folderId: "1zzTq0l1QIhwPkUayZDvQKrUw2f4jETHk", folderTitle: "Bare Indochine", linkedFrom: ["D7"], file: "54.png", driveFileId: "1mnYZqOunQI2EpvDD2mH1r96ZxxrTQU4E", bytes: 3470033, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS },
  { key: "bare-chic-one-1-47", property: "bare-chic", room: "Bare Chic One", use: "supporting-frame", folderId: "1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4", folderTitle: "Bare Chic One", linkedFrom: ["D4"], file: "1.47.png", driveFileId: "1ihDJCDmPd7_910xp0qM92p1b35QWfe86", bytes: 3843562, mime: "image/png", modified: "2026-10-13", driveOwner: OWNER, rights: RIGHTS },
];

/**
 * GRANTED 19/10/2026 by the project owner in the review session, quoted: "Approved: the 05.2 plan,
 * D1 (client-draft source, not-connected rooms), D2 (draft-only rights value), D3 (one private Giá
 * tham khảo near the CTA), D4 (G3: the five Bare Chic files, private local review only). Start
 * checkpoint 1." Covers these five files and this use only.
 */
export const G3_AUTHORISATION: Authorisation = {
  grantedBy: "Project owner, in the 05.2 review session",
  capacity: "Project owner (VNest's permission as relayed for G2; not restated)",
  date: "2026-10-19",
  scope: "private-local-review",
  reference: "Owner's message approving the 05.2 plan and D4, 19/10/2026",
  driveFileIds: G3_IMAGES.map((image) => image.driveFileId),
};

/**
 * G4 (section 05.2 refinement, Bare Chic room galleries): the remaining Bare Chic files listed in
 * the four room folders on 15/10/2026, except 1.56.png and 1.59.png, which are in both Bare Chic
 * One's and Three's folders (audit Q6) and stay out until VNest says which room they show.
 * Provenance as listed by Drive on 15/10 (docs/content/vnest-client-data.draft.json, mediaFolders).
 */
const g4 = (room: G3Image["room"], folderId: string, linkedFrom: string, file: string, driveFileId: string, bytes: number): G3Image => ({
  key: `${room.toLowerCase().replace(/ /g, "-")}-${file.replace(/\.png$/, "").replace(/\./g, "-")}`,
  property: "bare-chic",
  room,
  use: "room-gallery",
  folderId,
  folderTitle: room,
  linkedFrom: [linkedFrom],
  file,
  driveFileId,
  bytes,
  mime: "image/png",
  modified: "2026-10-13",
  driveOwner: OWNER,
  rights: RIGHTS,
});
const ONE = "1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4";
const TWO = "1-LJx_HPTYOn3GqOEXa8CDX5Rtg512e3L";
const THREE = "1w_pMRvlJe_y1Fl0bQ9NGVLiFuU9M16fi";
const INDOCHINE = "1zzTq0l1QIhwPkUayZDvQKrUw2f4jETHk";

export const G4_IMAGES: readonly G3Image[] = [
  g4("Bare Chic One", ONE, "D4", "1.11.png", "1wz8Pj30YbIFXTxmCf4d7OQWfuYAZduMy", 3375315),
  g4("Bare Chic One", ONE, "D4", "1.42.png", "1BqgXASJvC6KHCL01_BN_3kPUTHCZPve5", 3248158),
  g4("Bare Chic Two", TWO, "D5", "2.4.png", "16r0hN3IUE4ttTG-l6xfNWqjJKUTuvt8X", 3605527),
  g4("Bare Chic Two", TWO, "D5", "2.5.png", "1qOSRDvBjDmMiAssqtnyQ-taaWnIiZW6V", 2521394),
  g4("Bare Chic Two", TWO, "D5", "2.9.png", "17tDGeCQWC93406lzdUOm7I5N-g1RMThZ", 3991898),
  g4("Bare Chic Two", TWO, "D5", "2.10.png", "1ayKHoOO5MOT8UVYaRkrTewM2fjTSkH1w", 3175527),
  g4("Bare Chic Two", TWO, "D5", "2.32.png", "1F8898suE4nMMFs75dl8--b5dOL597Mae", 4189122),
  g4("Bare Chic Three", THREE, "D6", "1.18.png", "1weZPQ2CZkcMy9IZIxdi33oM63cDWyn6g", 3788660),
  g4("Bare Chic Three", THREE, "D6", "1.27.png", "1x2EH7xM6PKq30E8tr1veXO3-Pq2HpVba", 3965957),
  g4("Bare Chic Three", THREE, "D6", "1.57.png", "15IBLnzUoJR06884tw39UYiHJ4vuwFVxr", 3306609),
  g4("Bare Indochine", INDOCHINE, "D7", "50.png", "1282suPtzqCjQ6fpKpRektdX08bok8gUB", 2253920),
  g4("Bare Indochine", INDOCHINE, "D7", "51.png", "1MZ49jyPV-hjCry16Xd8NdwLCy_LOjRY8", 2863923),
  g4("Bare Indochine", INDOCHINE, "D7", "52.png", "1dq9FlCP-GPNIUWesD64EpnFCX6phzLXf", 2734786),
];

/**
 * GRANTED 20/10/2026 by the project owner in the 05.2 review session, quoted: "Authorised: G4, the
 * 13 Bare Chic files listed in docs/qa/05.2/v2-refine/RESULTS.md, for private local review only
 * (never committed, deployed or published). Fetch, verify and add them to the room galleries."
 * Covers these thirteen files and this use only.
 */
export const G4_AUTHORISATION: Authorisation = {
  grantedBy: "Project owner, in the 05.2 review session",
  capacity: "Project owner (VNest's permission as relayed for G2; not restated)",
  date: "2026-10-20",
  scope: "private-local-review",
  reference: "Owner's message authorising G4, 20/10/2026",
  driveFileIds: G4_IMAGES.map((image) => image.driveFileId),
};

/** The four primaries, the only files G2 may fetch (Bare Hàn and The Nắng Suites have none). */
export const PRIMARY_IMAGES = Object.entries(PROPOSED_IMAGES).map(([property, images]) => ({ property, image: images.find((image) => image.role === "primary")! }));

/** Whether a property's primary image is covered by a recorded authorisation. */
export const isAuthorised = (driveFileId: string, record: Authorisation | null = G2_AUTHORISATION) => record !== null && record.scope === "private-local-review" && record.driveFileIds.includes(driveFileId);

/** True once an authorisation is recorded. Until then no client photograph may be fetched or shown. */
export const PHOTOGRAPHY_AUTHORISED: boolean = G2_AUTHORISATION !== null;

/** What the placeholder says, by reason. Vietnamese, as the page. */
export const PLACEHOLDER_REASON = {
  "rights-pending": "Ảnh chờ cấp quyền sử dụng",
  "folder-conflict": "Chờ VNest xác nhận thư mục ảnh",
} as const;

export type PlaceholderReason = keyof typeof PLACEHOLDER_REASON;

/**
 * Everything the photo pipeline may fetch, each item with the authorisation that covers it.
 * G2 items keep the property id as their key (the Brand Collection reads them by property).
 */
/**
 * PUBLIC-RELEASE HOLDS (owner's G4 decision, 20/10/2026): photographs that may be shown in the
 * private local review but must stay out of any public-release image set until the hold is lifted
 * in writing. Each is identified by Drive file id and the sha256 of the original. Every client
 * photograph is also rights-pending (Q15) and so not releasable at all yet; these holds are an
 * additional, specific condition that survives a general rights approval.
 */
export type ReleaseHold = { key: string; file: string; folderTitle: string; driveFileId: string; sha256: string; reason: "person-visible"; question: "Q15"; authorisation: "not-granted" | "granted" };

export const RELEASE_HOLDS: readonly ReleaseHold[] = [
  { key: "bare-chic-one-1-11", file: "1.11.png", folderTitle: "Bare Chic One", driveFileId: "1wz8Pj30YbIFXTxmCf4d7OQWfuYAZduMy", sha256: "a929f2da97f90f4202e1404744a80b63e2201363ab8840d7061e388e2eee8cbf", reason: "person-visible", question: "Q15", authorisation: "not-granted" },
  { key: "bare-chic-two-2-32", file: "2.32.png", folderTitle: "Bare Chic Two", driveFileId: "1F8898suE4nMMFs75dl8--b5dOL597Mae", sha256: "73e431898b908f3c4c66b90280114e63266a5e30bfeac6e54b4cf66b8bf16a6c", reason: "person-visible", question: "Q15", authorisation: "not-granted" },
  { key: "bare-chic-three-1-18", file: "1.18.png", folderTitle: "Bare Chic Three", driveFileId: "1weZPQ2CZkcMy9IZIxdi33oM63cDWyn6g", sha256: "c3b76d798c3c1f2259e2d798bdaab97e46b213bf9f8c1c40b97017e175bd9592", reason: "person-visible", question: "Q15", authorisation: "not-granted" },
];

/**
 * The photographs a public-release set may include, from a list of candidate keys. Today: none,
 * because no client photograph has public rights (Q15). Once rights are granted, held photographs
 * are still removed until their own hold is lifted.
 */
export function publicReleaseCandidates(keys: readonly string[], rightsGranted: ReadonlySet<string> = new Set()): string[] {
  return keys.filter((key) => rightsGranted.has(key) && !RELEASE_HOLDS.some((hold) => hold.key === key && hold.authorisation !== "granted"));
}

export const FETCH_PLAN = [
  ...PRIMARY_IMAGES.map(({ property, image }) => ({ key: property, property, file: image.file, folderId: image.folderId, folderTitle: image.folderTitle, driveFileId: image.driveFileId, bytes: image.bytes, mime: image.mime, rights: image.rights, set: "G2" as const, authorisation: G2_AUTHORISATION })),
  ...G3_IMAGES.map((image) => ({ key: image.key, property: image.property, file: image.file, folderId: image.folderId, folderTitle: image.folderTitle, driveFileId: image.driveFileId, bytes: image.bytes, mime: image.mime, rights: image.rights, set: "G3" as const, authorisation: G3_AUTHORISATION })),
  ...G4_IMAGES.map((image) => ({ key: image.key, property: image.property, file: image.file, folderId: image.folderId, folderTitle: image.folderTitle, driveFileId: image.driveFileId, bytes: image.bytes, mime: image.mime, rights: image.rights, set: "G4" as const, authorisation: G4_AUTHORISATION })),
];
