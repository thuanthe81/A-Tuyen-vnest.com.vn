/**
 * VNEST WORKBOOK RECORDS: the verbatim workbook snapshot in, one traced record per property out.
 * Shared by the client-content previews (Brand Collection `b-client`, property detail 05.2).
 *
 * Each value is a `Sourced` value: the raw cell text, what may be shown, the cells, a status, the
 * rule applied and the open question. Contradictions are detected from the data itself (a
 * description repeated from another property, a map cell whose text and link differ, a photo
 * folder linked from two properties), never typed in by hand. Location adds independent evidence
 * (location-evidence.ts) for what the workbook does not say.
 *
 * Static content only: no price, rate or availability (prices are in pricing.ts, apart; live
 * availability belongs to the PMS). No area vocabulary is derived for filtering.
 */
import type { BrandId, CityId } from "./ids";
import { PROPOSED_IMAGES, type PlaceholderReason, type ProposedImage } from "./media";
import { LOCATION_EVIDENCE } from "./location-evidence";
import type { CellRef, QuestionId, Sourced } from "./sourced";
import { ROWS, WORKBOOK, type WorkbookRow } from "./workbook";

const at = (cell: string): CellRef => ({ sheet: WORKBOOK.sheet, cell });

/** The three brands of the brief of 15/10/2026, by the exact name the workbook writes. */
export const BRANDS_BY_NAME: Readonly<Record<string, BrandId>> = { "Bare Boutique Stays": "bare", "The Nắng Suites": "the-nang", "Pepper House": "pepper-house" };

/** The last part of an address, as the workbook writes it, to a city. */
const CITIES_BY_NAME: Readonly<Record<string, CityId>> = { "Hồ Chí Minh": "ho-chi-minh", "TP HCM": "ho-chi-minh", "Đà Nẵng": "da-nang" };

export const RULES = {
  shortName: "Suffix \" - <brand>\" removed when it is the property's brand; the brand is shown separately",
  ownBrand: "No brand suffix: the property is its own brand (brief 15/10/2026)",
  brandFromSuffix: "Brand read from the suffix \" - <brand>\" of the official name",
  city: "City read from the last comma-separated part of the address (column I)",
  trimmed: "Surrounding whitespace removed",
  repeatedDescription: "Same text as an earlier property's description, apart from surrounding quotation marks and whitespace",
  mapMismatch: "The cell text and a hyperlink record over the cell are different links",
  sharedFolder: "A photo folder of this property is also linked from another property's rows",
  formerDistrict: "Former district named for this property by an independent source (location-evidence.ts); never inferred from the current ward",
  street: "Part of the address before its first comma",
  ward: "Part of the address after its first comma, as supplied",
  mapResolves: "The link resolves, by redirect, to the Google place named for this property",
} as const;

export type PictureDecision = {
  /** Always a placeholder here; photos.ts replaces it with an authorised local photograph (G2). */
  kind: "placeholder";
  reason: PlaceholderReason;
  /** Ids of the properties whose rows link to one of this property's folders. */
  sharesFoldersWith: readonly string[];
  /** The mapping kept ready for the photography checkpoint. */
  proposed: readonly ProposedImage[];
};

export type ClientProperty = {
  id: string;
  /** Workbook rows (rooms) of this property. */
  rows: readonly number[];
  officialName: Sourced<string>;
  /** The name on the card. */
  name: Sourced<string>;
  brand: Sourced<BrandId>;
  city: Sourced<CityId>;
  address: Sourced<string>;
  description: Sourced<string>;
  map: Sourced<string>;
  photoFolders: Sourced<readonly string[]>;
  picture: PictureDecision;
  location: ClientLocation;
};

/**
 * Where a property is, for the card's location label and panel (G2.1). Built from the workbook's
 * address (I) and map link (J), and from independent sources (location-evidence.ts) for what the
 * workbook does not say: the former district a visitor recognises.
 */
export type ClientLocation = {
  city: Sourced<CityId>;
  /** Former district for orientation ("Quận 1"), only when a source names it for this property. */
  area: Sourced<string>;
  /** The address before its first comma: number and street. */
  street: Sourced<string>;
  /** The address after its first comma: the current ward and city, as supplied. */
  ward: Sourced<string>;
  address: Sourced<string>;
  /** The Google Maps link the panel may offer. */
  mapUrl: Sourced<string>;
  /** One short line for the panel: what is still pending. Null when nothing is. */
  note: string | null;
};

/** A stable id from the card name, matching the mock's ids: "Bare Đa Kao" → "bare-da-kao". */
export function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The open question for a known contradiction, by property (sourced.ts; source diff of 20/10/2026). */
const MAP_QUESTIONS: Readonly<Record<string, QuestionId>> = { "bare-hyphen": "Q4", "bare-da-kao": "Q22" };
/** Descriptions whose wording VNest is asked to approve or explain (Q26, Q27). */
const DESCRIPTION_QUESTIONS: Readonly<Record<string, QuestionId>> = { "bare-han": "Q27", "the-nang-suites": "Q27", "pepper-house": "Q26" };

const folderId = (link: string) => /folders\/([\w-]+)/.exec(link)?.[1] ?? link;
const unquote = (text: string) => text.trim().replace(/^["“]|["”]$/g, "").trim();

/** Groups rows by property: a row with an official name (B) starts one; rows without B belong to it. */
function groups(rows: readonly WorkbookRow[]): WorkbookRow[][] {
  const out: WorkbookRow[][] = [];
  for (const row of rows) {
    if (row.B !== undefined) out.push([row]);
    else if (out.length) out[out.length - 1]!.push(row);
    else throw new Error(`Row ${row.row} has no property above it`);
  }
  return out;
}

function nameAndBrand(first: WorkbookRow): { officialName: Sourced<string>; name: Sourced<string>; brand: Sourced<BrandId> } {
  const raw = first.B!;
  const source = [at(`B${first.row}`)];
  const official = raw.trim();
  const officialName: Sourced<string> = { raw, display: official, source, status: official === raw ? "client-supplied" : "normalized", ...(official === raw ? {} : { rule: RULES.trimmed }) };
  const cut = official.lastIndexOf(" - ");
  const suffix = cut > 0 ? official.slice(cut + 3) : null;
  if (suffix && BRANDS_BY_NAME[suffix]) {
    return {
      officialName,
      name: { raw, display: official.slice(0, cut), source, status: "normalized", rule: RULES.shortName, clarification: "Q13" },
      brand: { raw, display: BRANDS_BY_NAME[suffix], source, status: "derived", rule: RULES.brandFromSuffix },
    };
  }
  const own = BRANDS_BY_NAME[official];
  if (!own) throw new Error(`Row ${first.row}: "${official}" names no known brand`);
  return {
    officialName,
    name: { raw, display: official, source, status: officialName.status, ...(officialName.rule ? { rule: officialName.rule } : {}) },
    brand: { raw, display: own, source, status: "derived", rule: RULES.ownBrand },
  };
}

function cityAndAddress(first: WorkbookRow): { address: Sourced<string>; city: Sourced<CityId> } {
  const source = [at(`I${first.row}`)];
  if (first.I === undefined) return { address: { raw: null, display: null, source, status: "missing" }, city: { raw: null, display: null, source, status: "missing" } };
  const trimmed = first.I.trim();
  const last = trimmed.slice(trimmed.lastIndexOf(",") + 1).trim();
  const city = CITIES_BY_NAME[last] ?? null;
  const clarification = city === "da-nang" ? ({ clarification: "Q14" } as const) : {};
  return {
    address: { raw: first.I, display: trimmed, source, status: trimmed === first.I ? "client-supplied" : "normalized", ...(trimmed === first.I ? {} : { rule: RULES.trimmed }), ...clarification },
    city: city ? { raw: first.I, display: city, source, status: "derived", rule: RULES.city } : { raw: first.I, display: null, source, status: "missing", rule: RULES.city },
  };
}

/**
 * The map link. Every hyperlink record over the cell must agree with the cell text: v2 writes a
 * record for the cell and another for its merged range, and when they differ nobody can say which
 * one VNest meant, so nothing is shown (no record is preferred, nothing is substituted).
 */
function map(first: WorkbookRow, id: string): Sourced<string> {
  const source = [at(`J${first.row}`)];
  if (!first.J && !first.JLink) return { raw: null, display: null, source, status: "missing" };
  const text = first.J?.trim() ?? null;
  const targets = first.JLinkRecords?.map((record) => record.target) ?? (first.JLink ? [first.JLink] : []);
  if (text && targets.some((target) => target !== text)) {
    const question = MAP_QUESTIONS[id];
    return { raw: `${first.J} → ${targets.join(" | ")}`, display: null, source, status: "conflict", rule: RULES.mapMismatch, ...(question ? { clarification: question } : {}) };
  }
  const link = first.JLink ?? text!;
  return { raw: first.J ?? link, display: link, source, status: "client-supplied" };
}

function location(id: string, city: Sourced<CityId>, address: Sourced<string>, mapLink: Sourced<string>): ClientLocation {
  const evidence = LOCATION_EVIDENCE[id];
  if (!evidence) throw new Error(`${id}: no location evidence record`);
  const trimmed = address.display ?? "";
  const cut = trimmed.indexOf(",");
  const streetText = cut > 0 ? trimmed.slice(0, cut).trim() : null;
  const wardText = cut > 0 ? trimmed.slice(cut + 1).trim() : null;
  const daNang = city.display === "da-nang";
  const pending = (question: QuestionId | undefined) => (question ? { clarification: question } : {});
  const area: Sourced<string> = evidence.area
    ? { raw: null, display: evidence.area, source: address.source, status: "corroborated", rule: RULES.formerDistrict, evidence: evidence.areaEvidence }
    : { raw: null, display: null, source: address.source, status: "missing", rule: RULES.formerDistrict, ...pending(evidence.questions.includes("Q20") ? "Q20" : undefined) };
  const street: Sourced<string> =
    evidence.addressCheck === "conflicts"
      ? { raw: address.raw, display: null, source: address.source, status: "conflict", rule: RULES.street, clarification: "Q19", evidence: evidence.addressEvidence }
      : { raw: address.raw, display: streetText, source: address.source, status: evidence.addressCheck === "matches" ? "corroborated" : "client-supplied", rule: RULES.street, ...(evidence.addressEvidence.length ? { evidence: evidence.addressEvidence } : {}) };
  const ward: Sourced<string> = { raw: address.raw, display: wardText, source: address.source, status: "normalized", rule: RULES.ward, ...pending(daNang ? "Q14" : undefined) };
  const mapUrl: Sourced<string> =
    mapLink.status === "conflict" || !mapLink.display
      ? { raw: mapLink.raw, display: null, source: mapLink.source, status: mapLink.status === "conflict" ? "conflict" : "missing", ...pending(mapLink.clarification) }
      : {
          raw: mapLink.raw,
          display: mapLink.display,
          source: mapLink.source,
          status: "corroborated",
          rule: RULES.mapResolves,
          evidence: [{ url: mapLink.display, says: `Redirects to Google place ${evidence.mapResolvesTo.kgmid}, "${evidence.mapResolvesTo.name}"`, checked: evidence.mapResolvesTo.checked }],
        };
  const notes = [
    street.status === "conflict" ? "Số nhà đang chờ VNest xác nhận" : null,
    street.status === "client-supplied" ? "Địa chỉ theo VNest, chưa đối chiếu được" : null,
    daNang ? "Phường hiện hành chờ VNest xác nhận" : null,
    mapUrl.status === "conflict" ? "Đường dẫn bản đồ chờ VNest xác nhận" : null,
  ].filter(Boolean);
  return { city, area, street, ward, address, mapUrl, note: notes.length ? `${notes.join(" · ")}.` : null };
}

/** One traced record per property, in workbook order. */
export function readClientProperties(rows: readonly WorkbookRow[] = ROWS): ClientProperty[] {
  const grouped = groups(rows);
  const folderOwners = new Map<string, Set<number>>();
  grouped.forEach((group, index) => group.forEach((row) => folderOwners.set(folderId(row.DLink), (folderOwners.get(folderId(row.DLink)) ?? new Set()).add(index))));
  const ids = grouped.map((group) => slug(nameAndBrand(group[0]!).name.display!));
  const descriptions: string[] = [];

  return grouped.map((group, index) => {
    const first = group[0]!;
    const id = ids[index]!;
    const descriptionSource = [at(`E${first.row}`)];
    const text = first.E === undefined ? null : unquote(first.E);
    const repeated = text !== null && descriptions.includes(text);
    if (text !== null) descriptions.push(text);
    const description: Sourced<string> =
      first.E === undefined
        ? { raw: null, display: null, source: descriptionSource, status: "missing" }
        : repeated
          ? { raw: first.E, display: null, source: descriptionSource, status: "conflict", rule: RULES.repeatedDescription, clarification: "Q2" }
          : { raw: first.E, display: first.E.trim(), source: descriptionSource, status: "client-supplied", ...(DESCRIPTION_QUESTIONS[id] ? { clarification: DESCRIPTION_QUESTIONS[id] } : {}) };

    const folders = group.map((row) => folderId(row.DLink));
    const shared = [...new Set(folders.flatMap((folder) => [...folderOwners.get(folder)!].filter((owner) => owner !== index)))].map((owner) => ids[owner]!);
    const reason: PlaceholderReason = shared.length ? "folder-conflict" : "rights-pending";

    const place = cityAndAddress(first);
    const mapLink = map(first, id);
    return {
      id,
      rows: group.map((row) => row.row),
      ...nameAndBrand(first),
      ...place,
      description,
      map: mapLink,
      location: location(id, place.city, place.address, mapLink),
      photoFolders: {
        raw: group.map((row) => row.DLink).join("\n"),
        display: null,
        source: group.map((row) => at(`D${row.row}`)),
        status: shared.length ? "conflict" : "client-supplied",
        ...(shared.length ? { rule: RULES.sharedFolder, clarification: "Q1" as const } : {}),
      },
      picture: { kind: "placeholder", reason, sharesFoldersWith: shared, proposed: shared.length ? [] : (PROPOSED_IMAGES[id] ?? []) },
    };
  });
}
