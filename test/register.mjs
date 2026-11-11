/**
 * Lets `node --test` resolve imports the way Next.js and TypeScript already do: the "@/..."
 * alias (tsconfig "paths") and relative imports written without a file extension.
 * Node runs the TypeScript sources directly, so tests need no build step and no framework.
 */
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = new URL("../src/", import.meta.url);

function firstFile(base) {
  return [`${base}.ts`, `${base}/index.ts`, base].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fromSource = context.parentURL?.startsWith(src.href);
    const base = specifier.startsWith("@/")
      ? fileURLToPath(new URL(specifier.slice(2), src))
      : specifier.startsWith(".") && fromSource
        ? fileURLToPath(new URL(specifier, context.parentURL))
        : undefined;
    const file = base ? firstFile(base) : undefined;
    return file ? nextResolve(pathToFileURL(file).href, context) : nextResolve(specifier, context);
  },
});
