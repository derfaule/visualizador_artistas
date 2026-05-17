import scrapedJson from "./scraped.json";

export interface MusicBrainzData {
  mbid: string;
  type: string | null;
  country: string | null;
  area: string | null;
  beginDate: string | null;
  endDate: string | null;
  genres: string[];
  tags: string[];
  aliases: string[];
  disambiguation: string | null;
}

export interface EnrichedEntry {
  kind: "band" | "member";
  musicbrainz: MusicBrainzData | null;
  wikipedia_summary: string | null;
  scraped_at: string;
  error?: string;
}

export const ENRICHED = scrapedJson as Record<string, EnrichedEntry>;

export function getEnriched(name: string): EnrichedEntry | null {
  return ENRICHED[name] ?? null;
}
