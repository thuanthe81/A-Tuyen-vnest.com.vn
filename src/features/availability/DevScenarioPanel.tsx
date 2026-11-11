"use client";

import Link from "next/link";
import { resultsCopy } from "./copy";
import { withMockScenario } from "./routing";
import { useMockScenario } from "./useMockScenario";

/**
 * DEVELOPMENT ONLY. Lets a reviewer step through every simulated state of the results page.
 * The page renders it only when the mock booking provider is configured, which also means
 * the build can never be indexed.
 */
export function DevScenarioPanel({
  scenarios,
  fromUrl,
  configured,
  baseHref,
}: {
  scenarios: readonly string[];
  fromUrl: string | undefined;
  configured: string;
  /** The page's own address with its search, without a scenario. */
  baseHref: string;
}) {
  const active = useMockScenario(fromUrl, true) ?? configured;
  const hrefFor = (scenario: string) => withMockScenario(baseHref, scenario);
  return (
    <aside aria-label={resultsCopy.devPanelTitle} className="border-t border-line bg-surface-muted">
      <div className="mx-auto max-w-site px-(--vn-gutter) py-(--vn-space-8)">
        <h2 className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">{resultsCopy.devPanelTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{resultsCopy.devPanelHint}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <li key={scenario}>
              <Link
                href={hrefFor(scenario)}
                aria-current={scenario === active ? "true" : undefined}
                className="flex h-11 items-center rounded-(--bk-r-field) border border-line bg-surface-raised px-4 font-mono text-[0.8125rem] text-ink aria-[current]:border-ink aria-[current]:bg-ink aria-[current]:text-surface-raised"
              >
                {scenario}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
