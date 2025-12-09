/**
 * YouTube Video Discovery Tool
 *
 * Searches YouTube for FSU Flying High Circus videos and saves them
 * to the local DiscoveredVideo table for review.
 *
 * Usage:
 *   npx tsx tools/discovery/discover.ts                    # Default search
 *   npx tsx tools/discovery/discover.ts "custom search"    # Custom search query
 *   npx tsx tools/discovery/discover.ts --max 50           # Limit results
 *
 * The script uses web scraping (no API key required) to search YouTube.
 */

import { PrismaClient, DiscoveryStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_SEARCHES = [
  'FSU Flying High Circus',
  'Florida State Flying High Circus',
  'Flying High Circus Tallahassee',
  'FSU Circus Callaway Gardens',
  'Flying High Circus Home Show',
];

// Act name patterns for matching
const ACT_PATTERNS: { pattern: RegExp; actName: string }[] = [
  { pattern: /flying\s*trapeze/i, actName: 'Flying Trapeze' },
  { pattern: /triple\s*trapeze/i, actName: 'Triple Trapeze' },
  { pattern: /double\s*trapeze/i, actName: 'Double Trapeze' },
  { pattern: /swinging\s*trapeze/i, actName: 'Swinging Trapeze' },
  { pattern: /trapeze/i, actName: 'Flying Trapeze' }, // Default trapeze
  { pattern: /juggl/i, actName: 'Juggling' },
  { pattern: /russian\s*bar/i, actName: 'Russian Bar' },
  { pattern: /teeter\s*board/i, actName: 'Teeterboard' },
  { pattern: /teeterboard/i, actName: 'Teeterboard' },
  { pattern: /quartet|adagio/i, actName: 'Quartet Adagio' },
  { pattern: /skat(e|ing)/i, actName: 'Skating' },
  { pattern: /bike\s*(for)?\s*five/i, actName: 'Bike for Five' },
  { pattern: /clown/i, actName: 'Clowning' },
  { pattern: /jump\s*rope/i, actName: 'Jump Rope' },
  { pattern: /hand\s*balanc/i, actName: 'Hand Balancing' },
  { pattern: /rolla/i, actName: 'Rolla' },
  { pattern: /slack\s*(rope|wire)/i, actName: 'Slack Rope' },
  { pattern: /tight\s*wire/i, actName: 'Tight Wire' },
  { pattern: /high\s*wire/i, actName: 'Tight Wire' },
  { pattern: /low\s*cast/i, actName: 'Low Casting' },
  { pattern: /cloud\s*swing/i, actName: 'Cloud Swing' },
  { pattern: /chinese\s*pole/i, actName: 'Chinese Pole' },
  { pattern: /web/i, actName: 'Web' },
  { pattern: /cradle/i, actName: 'Cradle' },
  { pattern: /sky\s*pole/i, actName: 'Sky Pole' },
  { pattern: /unicycle/i, actName: 'Unicycle' },
  { pattern: /trampoline/i, actName: 'Trampoline' },
];

// Show type patterns
const SHOW_TYPE_PATTERNS = {
  CALLAWAY: [/callaway/i, /pine\s*mountain/i, /georgia/i],
  HOME: [/home\s*show/i, /tallahassee/i, /fsu\s*campus/i],
};

// Year extraction pattern (1950-2030)
const YEAR_PATTERN = /\b(19[5-9]\d|20[0-3]\d)\b/g;

// ============================================================================
// YouTube Scraping
// ============================================================================

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  thumbnailUrl: string;
  publishedText?: string;
}

/**
 * Fetch YouTube search results using web scraping
 */
async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  console.log(`Searching: ${query}`);
  console.log(`URL: ${searchUrl}`);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseYouTubeSearchResults(html);
  } catch (error) {
    console.error(`Search failed for "${query}":`, error);
    return [];
  }
}

/**
 * Parse YouTube search results from HTML
 * YouTube embeds data in a JavaScript variable: ytInitialData
 */
function parseYouTubeSearchResults(html: string): YouTubeSearchResult[] {
  const results: YouTubeSearchResult[] = [];

  // Find ytInitialData JSON - use RegExp constructor to avoid /s flag issues
  // The 's' flag makes . match newlines, we simulate with [\s\S]
  const dataMatch = html.match(/var ytInitialData = ({[\s\S]+?});<\/script>/);
  if (!dataMatch) {
    // Try alternate pattern
    const altMatch = html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);
    if (!altMatch) {
      console.warn('Could not find ytInitialData in response');
      return results;
    }
    return parseYtInitialData(altMatch[1]);
  }

  return parseYtInitialData(dataMatch[1]);
}

function parseYtInitialData(jsonStr: string): YouTubeSearchResult[] {
  const results: YouTubeSearchResult[] = [];

  try {
    const data = JSON.parse(jsonStr);

    // Navigate to video results
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    if (!contents) {
      console.warn('Unexpected YouTube data structure');
      return results;
    }

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        const videoRenderer = item?.videoRenderer;
        if (!videoRenderer) continue;

        const videoId = videoRenderer.videoId;
        if (!videoId) continue;

        // Extract title
        const title = videoRenderer.title?.runs?.[0]?.text || '';

        // Extract description snippet
        const descriptionSnippets = videoRenderer.detailedMetadataSnippets?.[0]?.snippetText?.runs || [];
        const description = descriptionSnippets.map((r: { text: string }) => r.text).join('');

        // Extract channel name
        const channelName = videoRenderer.ownerText?.runs?.[0]?.text || '';

        // Extract thumbnail
        const thumbnails = videoRenderer.thumbnail?.thumbnails || [];
        const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || '';

        // Extract published time
        const publishedText = videoRenderer.publishedTimeText?.simpleText || '';

        results.push({
          videoId,
          title,
          description,
          channelName,
          thumbnailUrl,
          publishedText,
        });
      }
    }
  } catch (error) {
    console.error('Failed to parse YouTube data:', error);
  }

  return results;
}

// ============================================================================
// Metadata Parsing
// ============================================================================

interface ParsedMetadata {
  inferredYear: number | null;
  inferredShowType: string | null;
  inferredActNames: string[];
  inferredPerformers: string[];
}

/**
 * Parse metadata from video title and description
 */
function parseMetadata(title: string, description: string, channelName: string): ParsedMetadata {
  const combined = `${title} ${description} ${channelName}`;

  // Extract year
  const years = combined.match(YEAR_PATTERN);
  const inferredYear = years ? parseInt(years[0], 10) : null;

  // Detect show type
  let inferredShowType: string | null = null;
  for (const pattern of SHOW_TYPE_PATTERNS.CALLAWAY) {
    if (pattern.test(combined)) {
      inferredShowType = 'CALLAWAY';
      break;
    }
  }
  if (!inferredShowType) {
    for (const pattern of SHOW_TYPE_PATTERNS.HOME) {
      if (pattern.test(combined)) {
        inferredShowType = 'HOME';
        break;
      }
    }
  }

  // Detect acts
  const inferredActNames: string[] = [];
  for (const { pattern, actName } of ACT_PATTERNS) {
    if (pattern.test(combined) && !inferredActNames.includes(actName)) {
      inferredActNames.push(actName);
    }
  }

  // Extract potential performer names
  // This is tricky - look for common name patterns in description
  const inferredPerformers = extractPerformerNames(description, channelName);

  return {
    inferredYear,
    inferredShowType,
    inferredActNames,
    inferredPerformers,
  };
}

/**
 * Attempt to extract performer names from text
 * Looks for patterns like "by John Smith" or "featuring Jane Doe"
 */
function extractPerformerNames(description: string, channelName: string): string[] {
  const names: string[] = [];

  // Common patterns for performer credits
  const patterns = [
    /(?:by|featuring|feat\.?|performed by|performers?:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:performs?|performing)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const name = match[1].trim();
      // Filter out common false positives
      if (!isCommonPhrase(name) && !names.includes(name)) {
        names.push(name);
      }
    }
  }

  // Channel name might be a person's name
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(channelName.trim())) {
    if (!isCommonPhrase(channelName) && !names.includes(channelName)) {
      names.push(channelName);
    }
  }

  return names;
}

/**
 * Check if a string is a common phrase (not a name)
 */
function isCommonPhrase(text: string): boolean {
  const commonPhrases = [
    'Flying High', 'Home Show', 'High Circus', 'Flying Trapeze',
    'Pine Mountain', 'Callaway Gardens', 'Florida State',
  ];
  return commonPhrases.some(phrase =>
    text.toLowerCase().includes(phrase.toLowerCase())
  );
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Check if a video already exists (local or prod)
 */
async function videoExists(youtubeId: string): Promise<{ local: boolean; prod: boolean }> {
  // Check local DiscoveredVideo
  const localExists = await prisma.discoveredVideo.findUnique({
    where: { youtubeId }
  });

  // Check local Video table (which would have been pushed from prod sync)
  const prodExists = await prisma.video.findFirst({
    where: { youtubeId }
  });

  return {
    local: !!localExists,
    prod: !!prodExists,
  };
}

/**
 * Save a discovered video to the database
 */
async function saveDiscoveredVideo(
  result: YouTubeSearchResult,
  metadata: ParsedMetadata
): Promise<boolean> {
  const { local, prod } = await videoExists(result.videoId);

  if (local) {
    console.log(`  SKIP (already discovered): ${result.title}`);
    return false;
  }

  if (prod) {
    console.log(`  SKIP (already in archive): ${result.title}`);
    return false;
  }

  await prisma.discoveredVideo.create({
    data: {
      youtubeId: result.videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
      rawTitle: result.title,
      rawDescription: result.description || null,
      channelName: result.channelName || null,
      thumbnailUrl: result.thumbnailUrl || null,
      inferredYear: metadata.inferredYear,
      inferredShowType: metadata.inferredShowType,
      inferredActNames: metadata.inferredActNames,
      inferredPerformers: metadata.inferredPerformers,
      status: DiscoveryStatus.PENDING,
    }
  });

  console.log(`  SAVED: ${result.title}`);
  return true;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('YouTube Video Discovery Tool');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);

  // Parse command line arguments
  const args = process.argv.slice(2);
  let maxResults = 100;
  let customSearches: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--max' && args[i + 1]) {
      maxResults = parseInt(args[i + 1], 10);
      i++;
    } else if (!args[i].startsWith('--')) {
      customSearches.push(args[i]);
    }
  }

  const searches = customSearches.length > 0 ? customSearches : DEFAULT_SEARCHES;

  console.log(`\nSearch queries: ${searches.length}`);
  console.log(`Max results per search: ${maxResults}`);

  let totalFound = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  for (const query of searches) {
    console.log(`\n${'─'.repeat(60)}`);

    const results = await searchYouTube(query);
    console.log(`Found ${results.length} videos\n`);

    for (const result of results.slice(0, maxResults)) {
      totalFound++;

      const metadata = parseMetadata(
        result.title,
        result.description,
        result.channelName
      );

      const saved = await saveDiscoveredVideo(result, metadata);
      if (saved) {
        totalSaved++;
      } else {
        totalSkipped++;
      }
    }

    // Small delay between searches to be nice to YouTube
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total videos found: ${totalFound}`);
  console.log(`New videos saved: ${totalSaved}`);
  console.log(`Skipped (duplicates): ${totalSkipped}`);
  console.log(`\nRun the review UI at: http://localhost:3000/admin/discovery`);
  console.log(`Completed at: ${new Date().toISOString()}`);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
