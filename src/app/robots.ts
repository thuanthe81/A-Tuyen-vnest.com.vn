import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { buildRobots } from "@/seo/robots";
import { absoluteUrl } from "@/seo/urls";

// Answered per request from the running deployment's settings, never prerendered: a build
// promoted from one environment to another must not carry the first one's answer with it.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(env, absoluteUrl);
}
