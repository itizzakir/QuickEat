#!/usr/bin/env node
/**
 * Generates the initials avatars referenced by the seeded demo accounts into
 * public/images/avatars/. Seed data must not point at an external host, so the profile and
 * header UI are backed by local files rather than a hotlinked avatar service.
 *
 * Run:  node scripts/generate-avatars.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "avatars");

const AVATARS = [
  { slug: "admin",    initials: "AU", from: "#312e81", to: "#6366f1" },
  { slug: "customer", initials: "JD", from: "#065f46", to: "#10b981" },
  { slug: "owner",    initials: "RO", from: "#9a3412", to: "#f97316" },
  { slug: "delivery", initials: "DG", from: "#155e75", to: "#06b6d4" },
];

const S = 128;

const avatar = ({ slug, initials, from, to }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${initials}">
  <defs>
    <linearGradient id="a-${slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" rx="64" fill="url(#a-${slug})"/>
  <text x="${S / 2}" y="${S / 2 + 17}" text-anchor="middle"
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="48" font-weight="600" fill="#ffffff" letter-spacing="1">${initials}</text>
</svg>
`;

await mkdir(OUT_DIR, { recursive: true });
for (const a of AVATARS) {
  const file = join(OUT_DIR, `${a.slug}.svg`);
  await writeFile(file, avatar(a), "utf8");
  console.log("wrote", file);
}
console.log(`\n${AVATARS.length} avatars written to ${OUT_DIR}`);
