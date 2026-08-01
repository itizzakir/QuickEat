#!/usr/bin/env node
/**
 * Generates one 600x400 SVG tile per cuisine into public/images/food/.
 *
 * These are used as restaurant hero images for cuisines with no usable photograph in the
 * asset pool (sushi, ramen, Thai, Mexican, Middle Eastern). They are deliberate category
 * tiles — a warm two-stop gradient, a few geometric shapes and the cuisine name — not grey
 * "image missing" boxes. public/placeholder.svg remains the separate last-resort onError
 * fallback.
 *
 * Run:  node scripts/generate-food-placeholders.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "food");

/** Each cuisine gets its own warm gradient so the tiles stay distinguishable side by side. */
const CUISINES = [
  { slug: "biryani",        label: "Biryani",        from: "#b45309", to: "#f59e0b" },
  { slug: "north-indian",   label: "North Indian",   from: "#9a3412", to: "#f97316" },
  { slug: "south-indian",   label: "South Indian",   from: "#166534", to: "#65a30d" },
  { slug: "street-food",    label: "Street Food",    from: "#a16207", to: "#facc15" },
  { slug: "chinese",        label: "Chinese",        from: "#7f1d1d", to: "#ef4444" },
  { slug: "sushi",          label: "Sushi",          from: "#1e3a5f", to: "#38bdf8" },
  { slug: "japanese-ramen", label: "Ramen",          from: "#3f2a1d", to: "#d97706" },
  { slug: "thai",           label: "Thai",           from: "#134e4a", to: "#2dd4bf" },
  { slug: "mexican",        label: "Mexican",        from: "#7c2d12", to: "#fb923c" },
  { slug: "middle-eastern", label: "Middle Eastern", from: "#78350f", to: "#eab308" },
  { slug: "pizza",          label: "Pizza",          from: "#991b1b", to: "#f87171" },
  { slug: "burger",         label: "Burgers",        from: "#78350f", to: "#fbbf24" },
  { slug: "dessert",        label: "Desserts",       from: "#831843", to: "#f472b6" },
  { slug: "salad",          label: "Salads",         from: "#14532d", to: "#4ade80" },
];

const W = 600;
const H = 400;

const tile = ({ slug, label, from, to }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g-${slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g-${slug})"/>
  <g fill="#ffffff" opacity="0.13">
    <circle cx="86" cy="74" r="54"/>
    <circle cx="527" cy="337" r="76"/>
    <rect x="447" y="36" width="104" height="104" rx="22" transform="rotate(18 499 88)"/>
    <rect x="52" y="286" width="88" height="88" rx="20" transform="rotate(-14 96 330)"/>
  </g>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="3">
    <circle cx="300" cy="200" r="126"/>
    <circle cx="300" cy="200" r="96"/>
  </g>
  <text x="${W / 2}" y="${H / 2 + 12}" text-anchor="middle"
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="42" font-weight="700" fill="#ffffff" letter-spacing="1">${label}</text>
</svg>
`;

await mkdir(OUT_DIR, { recursive: true });
for (const cuisine of CUISINES) {
  const file = join(OUT_DIR, `tile-${cuisine.slug}.svg`);
  await writeFile(file, tile(cuisine), "utf8");
  console.log("wrote", file);
}
console.log(`\n${CUISINES.length} cuisine tiles written to ${OUT_DIR}`);
