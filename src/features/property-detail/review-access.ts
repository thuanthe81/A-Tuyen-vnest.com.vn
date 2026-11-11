/**
 * WHO MAY SEE THE BARE CHIC REVIEW PAGES (/dev/stays/bare-chic and its 20/10 comparison copy).
 *
 * These pages carry draft client content, a review notice, "Chờ VNest" notes and, in the private
 * preview, the workbook's unverified reference figures. None of that may reach a preview or
 * production deployment, so the routes answer 404 unless DEPLOY_ENV=development is DECLARED, as the
 * local launch configurations `vnest-v2-client-preview` and `vnest-v2-client-preview-dev` do.
 * A server that nobody identified is refused, although env.ts treats it as development for
 * indexing: an unidentified host could be public. (A plain `npm run dev` declares nothing either,
 * so it is refused too; use the client-preview configurations.)
 */
import type { Env } from "@/config/env";

export type ReviewAccess = { route: boolean; privatePreview: boolean };

export function reviewAccess(env: Pick<Env, "deployEnv" | "deployEnvSource" | "indexable">): ReviewAccess {
  const local = env.deployEnv === "development" && env.deployEnvSource === "declared";
  return { route: local, privatePreview: local && !env.indexable };
}
