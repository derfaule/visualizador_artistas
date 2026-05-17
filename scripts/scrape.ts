/**
 * Scraper pipeline for band/artist enrichment.
 *
 * Sources (in order of preference):
 *   1. MusicBrainz API  — free, no key, rate-limited to 1 req/s
 *   2. Wikipedia ES     — Spanish Wikipedia (better coverage of Colombian artists)
 *   3. Wikipedia EN     — English Wikipedia fallback
 *
 * Output: src/lib/scraped.json  (imported directly by the app)
 *
 * Usage:
 *   npm run scrape                          # all bands + members
 *   npm run scrape:bands                    # bands only (faster, ~1 min)
 *   npm run scrape -- --name="Jazz Nicolás" # single entry
 */

import fs from "fs";
import path from "path";
import { DATA, normalizeBandName } from "../src/lib/data";

// Output goes straight into the app's lib directory so it can be imported
const OUT = path.join(__dirname, "../src/lib/scraped.json");
const DELAY_MS = 1100; // MusicBrainz: max 1 req/s

const args = process.argv.slice(2);
const onlyBands = args.includes("--only-bands");
const _nameIdx = args.indexOf("--name");
const filterName = args.find((a) => a.startsWith("--name="))?.split("=")[1]
  ?? (_nameIdx !== -1 ? args[_nameIdx + 1] : undefined);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── MusicBrainz ────────────────────────────────────────────────────────────

async function mbSearch(query: string) {
  const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&limit=5&fmt=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "VisualizadorArtistas/1.0 (research project)" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function mbLookup(mbid: string) {
  const url = `https://musicbrainz.org/ws/2/artist/${mbid}?inc=tags+genres+aliases&fmt=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "VisualizadorArtistas/1.0 (research project)" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function enrichFromMusicBrainz(name: string) {
  // Search with "Colombia" qualifier to improve match quality
  const results = await mbSearch(`${name} Colombia`);
  await sleep(DELAY_MS);
  if (!results) return null;

  const artists: Record<string, unknown>[] = results.artists ?? [];
  if (!artists.length) return null;

  // Prefer an artist with a Colombian area tag; otherwise take the top hit
  const match =
    artists.find((a) =>
      (a["area"] as Record<string, string>)?.name?.toLowerCase().includes("colombia")
    ) ?? artists[0];

  const detail = await mbLookup(match.id as string);
  await sleep(DELAY_MS);
  if (!detail) return null;

  return {
    mbid: match.id as string,
    type: (detail.type as string) ?? null,
    country: (detail.country as string) ?? null,
    area: (detail.area as Record<string, string>)?.name ?? null,
    beginDate: (detail["life-span"] as Record<string, string>)?.begin ?? null,
    endDate: (detail["life-span"] as Record<string, string>)?.end ?? null,
    genres: ((detail.genres as Record<string, string>[]) ?? []).map((g) => g.name).slice(0, 6),
    tags: ((detail.tags as Record<string, unknown>[]) ?? [])
      .sort((a, b) => (b.count as number) - (a.count as number))
      .map((t) => t.name as string)
      .slice(0, 8),
    aliases: ((detail.aliases as Record<string, string>[]) ?? []).map((a) => a.name).slice(0, 4),
    disambiguation: (detail.disambiguation as string) ?? null,
  };
}

// ── Wikipedia ──────────────────────────────────────────────────────────────

async function fetchWikiSummary(query: string, lang: "es" | "en"): Promise<string | null> {
  const base = `https://${lang}.wikipedia.org/w/api.php`;
  const searchUrl = `${base}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
  const searchRes = await fetch(searchUrl);
  await sleep(300);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const pageTitle: string | undefined = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return null;

  const summaryUrl = `${base}?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
  const summaryRes = await fetch(summaryUrl);
  await sleep(300);
  if (!summaryRes.ok) return null;

  const summaryData = await summaryRes.json();
  const pages = summaryData?.query?.pages ?? {};
  const page = Object.values(pages)[0] as Record<string, string>;
  const extract: string = page?.extract ?? "";
  return extract.slice(0, 500).trim() || null;
}

async function enrichFromWikipedia(name: string, isBand: boolean): Promise<string | null> {
  // Spanish Wikipedia first — better coverage of Colombian music scene
  const esQuery = isBand ? `${name} orquesta Colombia música` : `${name} músico Colombia`;
  const es = await fetchWikiSummary(esQuery, "es");
  if (es) return es;

  // English fallback
  return fetchWikiSummary(name, "en");
}

// ── Main pipeline ──────────────────────────────────────────────────────────

async function main() {
  // Use canonical (normalized) band names — no formation variants
  const bands = [...new Set(DATA.map((d) => normalizeBandName(d.band).name))];
  const members = [...new Set(DATA.map((d) => d.member))];

  // Incremental: load existing results and skip cached entries
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

  console.log(`\nScraping ${targets.length} targets → ${OUT}\n`);

  for (const { name, kind } of targets) {
    const cached = results[name] as Record<string, unknown> | undefined;
    // Only skip if we previously found real data or hit a network error
    if (cached && (cached.musicbrainz || cached.wikipedia_summary || cached.error)) {
      console.log(`  ✓ skip   ${name} (cached)`);
      continue;
    }

    process.stdout.write(`  ↓ ${kind.padEnd(6)} ${name} … `);

    try {
      const mb = await enrichFromMusicBrainz(name);
      const wiki = await enrichFromWikipedia(name, kind === "band");

      results[name] = {
        kind,
        musicbrainz: mb,
        wikipedia_summary: wiki,
        scraped_at: new Date().toISOString(),
      };

      console.log(mb || wiki ? "✓ found" : "— not found");
    } catch (err) {
      console.log(`✗ error: ${(err as Error).message}`);
      results[name] = {
        kind,
        error: (err as Error).message,
        scraped_at: new Date().toISOString(),
      };
    }

    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  }

  console.log(`\nDone. ${Object.keys(results).length} entries in ${OUT}\n`);
}

main().catch(console.error);
