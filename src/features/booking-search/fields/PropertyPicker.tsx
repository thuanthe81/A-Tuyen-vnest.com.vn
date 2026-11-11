"use client";

import { useId, useRef } from "react";
import { useLocale } from "@/features/locale/LocaleProvider";
import { searchCopyFor } from "../copy";
import type { PropertyOption } from "../search-form";

/**
 * Choosing where to stay: every VNest property, or one of them.
 *
 * "All properties" is the first option and the default, so the field is never empty and
 * never an error. Built on native radio buttons: arrow keys, screen-reader "1 of 4" and
 * form semantics come from the browser. Values are property ids; names are only labels.
 */
export function PropertyPicker({
  properties,
  value,
  onChange,
  onDone,
}: {
  properties: readonly PropertyOption[];
  /** Selected property id, or null for all properties. */
  value: string | null;
  onChange: (propertyId: string | null) => void;
  /** Called when the guest commits a choice with a tap, click or Enter (not while arrowing through). */
  onDone?: () => void;
}) {
  const locale = useLocale();
  const searchCopy = searchCopyFor(locale);
  const name = useId();
  const arrowKeyRef = useRef(false);
  const options: { id: string | null; label: string; detail: string }[] = [
    { id: null, label: searchCopy.allProperties, detail: searchCopy.allPropertiesHint },
    ...properties.map((property) => ({ id: property.id, label: property.name, detail: property.area })),
  ];

  return (
    <fieldset
      onKeyDown={(event) => {
        arrowKeyRef.current = event.key.startsWith("Arrow");
      }}
    >
      <legend className="sr-only">{searchCopy.property}</legend>
      <ul className="flex flex-col gap-1">
        {options.map((option) => (
          <li key={option.id ?? "all"}>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-(--bk-r-row) px-4 py-2 transition-colors duration-(--vn-duration-fast) hover:bg-capsule-field has-checked:bg-capsule-field has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--vn-focus)">
              <input
                type="radio"
                name={name}
                value={option.id ?? ""}
                checked={value === option.id}
                // The list appears on the guest's own action, and focus lands on the current choice so arrows continue from it.
                autoFocus={value === option.id}
                onChange={() => onChange(option.id)}
                // Arrow keys move the selection and fire a click; only a real tap or click (including WebKit label-forwarded clicks where detail === 0) commits.
                onClick={() => {
                  if (!arrowKeyRef.current) onDone?.();
                  arrowKeyRef.current = false;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  // Enter confirms the choice; it must not submit the search.
                  event.preventDefault();
                  onDone?.();
                }}
                className="peer sr-only"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-medium text-ink">{option.label}</span>
                <span className="block truncate text-sm text-ink-muted">{option.detail}</span>
              </span>
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full border border-ink-muted transition-colors duration-(--vn-duration-fast) peer-checked:border-ink peer-checked:bg-ink"
              >
                <span className="size-2 rounded-full bg-surface-raised" />
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
