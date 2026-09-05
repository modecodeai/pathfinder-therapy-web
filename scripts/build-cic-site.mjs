import { cp, rm, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optimiseStaticSite } from "./optimise-static-site.mjs";

const output = fileURLToPath(new URL("../cic-out/", import.meta.url));
await rm(output, { recursive: true, force: true });
await cp(fileURLToPath(new URL("../cic-site/", import.meta.url)), output, { recursive: true });
await optimiseStaticSite(output, { cic: true });
const headersFile = path.join(output, "_headers");
const sha = process.env.PATHFINDER_BUILD_SHA || process.env.GITHUB_SHA || "local";
const headers = await readFile(headersFile, "utf8");
await writeFile(headersFile, headers.replace(/X-Pathfinder-Build: .*/, `X-Pathfinder-Build: ${sha}`));
