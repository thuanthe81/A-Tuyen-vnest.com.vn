import os from "node:os";
import type { NextConfig } from "next";
import { env } from "./src/config/env.ts";

// Said once, where the build and the server both start. A warning, never a failure:
// what must stop a deployment already throws in src/config/env.ts.
for (const problem of env.diagnostics) console.warn(`[vnest config] ${problem}`);

const lanHosts = Object.values(os.networkInterfaces())
  .flatMap((entries) => entries ?? [])
  .filter((entry) => entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry.address);

const extraDevOrigins = (process.env.VNEST_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().toLowerCase())
  .filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: [
    ...new Set([
      "localhost",
      "127.0.0.1",
      ...(os.hostname() ? [os.hostname().toLowerCase()] : []),
      ...lanHosts,
      ...extraDevOrigins,
    ]),
  ],
  async headers() {
    // The build-time lock: a build that was not made indexable says so on every response,
    // including files that carry no meta tag, wherever it is later started.
    // src/proxy.ts is the request-time lock for the opposite case. Both must agree.
    return env.indexable ? [] : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
