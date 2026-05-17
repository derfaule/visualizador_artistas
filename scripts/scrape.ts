/**
 * Scraper pipeline for band/artist enrichment.
 *
 * Sources (in order of preference):
 *   1. MusicBrainz API  — free, no key, rate-limited to 1 req/s
 *   2. Wikipedia API    — free, no key, used as fallback for description
 *
 * Output: scripts/scraped.json
 *
 * Usage:
 *   npx tsx scripts/scrape.ts
 *   npx tsx scripts/scrape.ts --only-bands        # skip individual members
 *   npx tsx scripts/scrape.ts --name "Jazz Nicolás"
 */

import fs from "fs";
import path from "path";
import { DATA } from "../src/lib/data";

const OUT = path.join(__dirname, "scraped.json");
const DELAY_MS = 1100; // MusicBrainz rate limit: 1 req/s

const args = process.argv.slice(2);
const onlyBands = args.includes("--only-bands");
const filterName = args.find((a) => a.startsWith("--name="))?.split("=")[1];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── MusicBrainz ────────────────────────────────────────────────────────────

async function mbSearch(query: string, type: "artist" | "release-group") {
  const url = `https://musicbrainz.org/ws/2/${type}?query=${encodeURIComponent(query)}&limit=3&fmt=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "VisualizadorArtistas/1.0 (research project)" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function mbLookup(mbid: string, type: "artist" | "release-group") {
  const inc = type === "artist" ? "?inc=tags+genres+aliases&fmt=json" : "?inc=tags&fmt=json";
  const url = `https://musicbrainz.org/ws/2/${type}/${mbid}${inc}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "VisualizadorArtistas/1.0 (research project)" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function enrichFromMusicBrainz(name: string, isBand: boolean) {
  const results = await mbSearch(name, "artist");
  await sleep(DELAY_MS);
  if (!results) return null;

  const artists: Record<string, unknown>[] = results.artists ?? [];
  // Prefer Colombian artists
  const match =
    artists.find((a) =>
      (a["area"] as Record<string, string>)?.name?.toLowerCase().includes("colombia")
    ) ?? artists[0];

  if (!match) return null;

  const detail = await mbLookup(match.id as string, "artist");
  await sleep(DELAY_MS);
  if (!detail) return null;

  return {
    mbid: match.id,
    type: detail.type ?? null,
    country: detail.country ?? null,
    area: (detail.area as Record<string, string>)?.name ?? null,
    beginDate: (detail["life-span"] as Record<string, string>)?.begin ?? null,
    endDate: (detail["life-span"] as Record<string, string>)?.end ?? null,
    genres: ((detail.genres as Record<string, string>[]) ?? []).map((g) => g.name).slice(0, 5),
    tags: ((detail.tags as Record<string, unknown>[]) ?? [])
      .sort((a, b) => (b.count as number) - (a.count as number))
      .map((t) => t.name)
      .slice(0, 8),
    aliases: ((detail.aliases as Record<string, string>[]) ?? []).map((a) => a.name).slice(0, 4),
    disambiguation: detail.disambiguation ?? null,
  };
}

// ── Wikipedia ──────────────────────────────────────────────────────────────

async function enrichFromWikipedia(name: string): Promise<string | null> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=1`;
  const searchRes = await fetch(searchUrl);
  await sleep(300);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const pageTitle: string = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return null;

  const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
  const summaryRes = await fetch(summaryUrl);
  await sleep(300);
  if (!summaryRes.ok) return null;

  const summaryData = await summaryRes.json();
  const pages = summaryData?.query?.pages ?? {};
  const page = Object.values(pages)[0] as Record<string, string>;
  const extract: string = page?.extract ?? "";
  // Return first 400 chars as a summary
  return extract.slice(0, 400).trim() || null;
}

// ── Main pipeline ──────────────────────────────────────────────────────────

async function main() {
  const bands = [...new Set(DATA.map((d) => d.band))];
  const members = [...new Set(DATA.map((d) => d.member))];

  // Load existing results to allow incremental runs
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(OUT)) {
    existing = JSON.parse(fs.readFileSync(OUT, "utf-8"));
  }

  const results: Record<string, unknown> = { ...existing };

  const targets: { name: string; kind: "band" | "member" }[] = [
    ...bands
      .filter((b) => !filterName || b === filterName)
      .map((b) => ({ name: b, kind: "band" as const })),
    ...(onlyBands
      ? []
      : members
          .filter((m) => !filterName || m === filterName)
          .map((m) => ({ name: m, kind: "member" as const }))),
  ];

  console.log(`\nScraping ${targets.length} targets…\n`);

  for (const { name, kind } of targets) {
    if (results[name]) {
      console.log(`  ✓ skip  ${name} (cached)`);
      continue;
    }

    process.stdout.write(`  ↓ ${kind.padEnd(6)} ${name} … `);

    try {
      const mb = await enrichFromMusicBrainz(name, kind === "band");
      const wiki = await enrichFromWikipedia(name);

      results[name] = {
        kind,
        musicbrainz: mb,
        wikipedia_summary: wiki,
        scraped_at: new Date().toISOString(),
      };

      const found = mb || wiki ? "✓ found" : "— not found";
      console.log(found);
    } catch (err) {
      console.log(`✗ error: ${(err as Error).message}`);
      results[name] = { kind, error: (err as Error).message, scraped_at: new Date().toISOString() };
    }

    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  }

  console.log(`\nDone. Results saved to ${OUT}\n`);
}

main().catch(console.error);
