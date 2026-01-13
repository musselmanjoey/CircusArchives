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

// Common US first names for performer detection
// This list helps filter capitalized word pairs to find likely names
const COMMON_FIRST_NAMES = new Set([
  // Female names
  'abby', 'abigail', 'ada', 'addison', 'adriana', 'adrienne', 'agnes', 'aileen', 'aimee', 'alana',
  'alberta', 'alexa', 'alexandra', 'alexis', 'alice', 'alicia', 'alina', 'alison', 'allison', 'alyssa',
  'amanda', 'amber', 'amelia', 'amy', 'ana', 'andrea', 'angela', 'angelica', 'angelina', 'angie',
  'anita', 'ann', 'anna', 'annabelle', 'anne', 'annette', 'annie', 'april', 'ariana', 'ariel',
  'arlene', 'ashley', 'audrey', 'autumn', 'ava', 'bailey', 'barbara', 'beatrice', 'becky', 'belinda',
  'bella', 'bernadette', 'bernice', 'beth', 'bethany', 'betty', 'beverly', 'bianca', 'bonnie', 'brandi',
  'brandy', 'brenda', 'briana', 'brianna', 'bridget', 'brittany', 'brittney', 'brooke', 'caitlin', 'caitlyn',
  'camille', 'candace', 'candice', 'cara', 'carly', 'carmen', 'carol', 'caroline', 'carolyn', 'carrie',
  'casey', 'cassandra', 'cassidy', 'cassie', 'catherine', 'cathy', 'cecilia', 'celeste', 'celia', 'charlene',
  'charlotte', 'chelsea', 'cheryl', 'chloe', 'christa', 'christina', 'christine', 'christy', 'cindy', 'claire',
  'clara', 'claudia', 'colleen', 'connie', 'constance', 'cora', 'corinne', 'courtney', 'crystal', 'cynthia',
  'daisy', 'dana', 'daniela', 'danielle', 'daphne', 'darlene', 'dawn', 'deanna', 'debbie', 'deborah',
  'debra', 'delaney', 'delia', 'denise', 'desiree', 'destiny', 'diana', 'diane', 'dianna', 'dianne',
  'dolores', 'dominique', 'donna', 'dora', 'doreen', 'doris', 'dorothy', 'edith', 'edna', 'eileen',
  'elaine', 'eleanor', 'elena', 'elisa', 'elisabeth', 'elise', 'eliza', 'elizabeth', 'ella', 'ellen',
  'ellie', 'eloise', 'elsie', 'emilia', 'emily', 'emma', 'erica', 'erika', 'erin', 'esther',
  'ethel', 'eva', 'evelyn', 'faith', 'faye', 'felicia', 'fiona', 'florence', 'frances', 'francesca',
  'gail', 'gemma', 'genevieve', 'georgia', 'geraldine', 'gertrude', 'gina', 'ginger', 'gladys', 'glenda',
  'gloria', 'grace', 'gracie', 'gretchen', 'gwendolyn', 'hailey', 'haley', 'hannah', 'harriet', 'haylee',
  'hayley', 'hazel', 'heather', 'heidi', 'helen', 'henrietta', 'hillary', 'holly', 'hope', 'ida',
  'imogene', 'inez', 'ingrid', 'irene', 'iris', 'irma', 'isabel', 'isabella', 'isabelle', 'ivy',
  'jackie', 'jaclyn', 'jacqueline', 'jade', 'jaime', 'jamie', 'jan', 'jane', 'janelle', 'janet',
  'janice', 'janie', 'janine', 'jasmine', 'jean', 'jeanette', 'jeanne', 'jeannie', 'jenna', 'jennie',
  'jennifer', 'jenny', 'jessica', 'jessie', 'jill', 'jillian', 'joan', 'joann', 'joanna', 'joanne',
  'jocelyn', 'jodi', 'jodie', 'jody', 'johanna', 'jolene', 'jordan', 'josephine', 'joy', 'joyce',
  'juanita', 'judith', 'judy', 'julia', 'juliana', 'julianne', 'julie', 'juliet', 'june', 'justine',
  'kaitlin', 'kaitlyn', 'kara', 'karen', 'kari', 'karin', 'karla', 'kate', 'katelyn', 'katherine',
  'kathleen', 'kathryn', 'kathy', 'katie', 'katrina', 'kay', 'kayla', 'kaylee', 'keisha', 'kelley',
  'kelli', 'kellie', 'kelly', 'kelsey', 'kendra', 'kennedy', 'kerry', 'kim', 'kimberly', 'kirsten',
  'krista', 'kristen', 'kristi', 'kristie', 'kristin', 'kristina', 'kristine', 'kristy', 'krystal', 'lacey',
  'lana', 'laura', 'lauren', 'laurie', 'laverne', 'lea', 'leah', 'leigh', 'lena', 'leona',
  'leslie', 'lila', 'lillian', 'lillie', 'lily', 'linda', 'lindsay', 'lindsey', 'lisa', 'liz',
  'liza', 'logan', 'lois', 'loretta', 'lori', 'lorraine', 'louise', 'lucia', 'lucille', 'lucy',
  'lydia', 'lynn', 'mabel', 'mackenzie', 'macy', 'maddison', 'madeline', 'madison', 'mae', 'maggie',
  'mallory', 'mandy', 'marcella', 'marcia', 'margaret', 'margarita', 'marguerite', 'maria', 'marian', 'marianne',
  'marie', 'marilyn', 'marina', 'marisa', 'marissa', 'marjorie', 'marlene', 'marsha', 'martha', 'mary',
  'maryann', 'matilda', 'maureen', 'maxine', 'maya', 'mckenzie', 'meagan', 'megan', 'meghan', 'melanie',
  'melinda', 'melissa', 'melody', 'mercedes', 'meredith', 'mia', 'michaela', 'michele', 'michelle', 'mikayla',
  'mildred', 'millie', 'mindy', 'minnie', 'miranda', 'miriam', 'misty', 'molly', 'mona', 'monica',
  'monique', 'morgan', 'muriel', 'myra', 'myrtle', 'nadine', 'nancy', 'naomi', 'natalie', 'natasha',
  'nellie', 'nettie', 'nichole', 'nicole', 'nina', 'nora', 'norma', 'olga', 'olive', 'olivia',
  'opal', 'paige', 'pam', 'pamela', 'pat', 'patricia', 'patsy', 'patti', 'patty', 'paula',
  'pauline', 'pearl', 'peggy', 'penny', 'phyllis', 'polly', 'priscilla', 'rachael', 'rachel', 'ramona',
  'randi', 'rebecca', 'regina', 'renee', 'rhonda', 'rita', 'roberta', 'robin', 'robyn', 'rochelle',
  'rosa', 'rosalie', 'rose', 'rosemarie', 'rosemary', 'rosie', 'roxanne', 'ruby', 'ruth', 'sabrina',
  'sadie', 'sally', 'samantha', 'sandra', 'sandy', 'sara', 'sarah', 'savannah', 'selena', 'serena',
  'shana', 'shannon', 'shari', 'sharon', 'shauna', 'shawn', 'shawna', 'sheila', 'shelby', 'shelia',
  'shelley', 'shelly', 'sheri', 'sherri', 'sherrie', 'sherry', 'sheryl', 'shirley', 'sierra', 'simone',
  'sonia', 'sonja', 'sonya', 'sophia', 'sophie', 'stacey', 'staci', 'stacie', 'stacy', 'stefanie',
  'stella', 'stephanie', 'sue', 'summer', 'susan', 'susanne', 'susie', 'suzanne', 'sylvia', 'tabitha',
  'tamara', 'tami', 'tamika', 'tammie', 'tammy', 'tanya', 'tara', 'taylor', 'teresa', 'teri',
  'terri', 'terry', 'thelma', 'theresa', 'therese', 'tiffany', 'tina', 'toni', 'tonya', 'tracey',
  'traci', 'tracie', 'tracy', 'tricia', 'trina', 'trisha', 'trudy', 'valerie', 'vanessa', 'velma',
  'vera', 'verna', 'veronica', 'vicki', 'vickie', 'vicky', 'victoria', 'viola', 'violet', 'virginia',
  'vivian', 'wanda', 'wendy', 'whitney', 'wilma', 'winifred', 'yolanda', 'yvette', 'yvonne', 'zoe',
  // Male names
  'aaron', 'adam', 'adrian', 'aiden', 'alan', 'albert', 'alec', 'alejandro', 'alex', 'alexander',
  'alfred', 'allen', 'alvin', 'andre', 'andrew', 'andy', 'angel', 'anthony', 'antonio', 'archie',
  'arnold', 'arthur', 'austin', 'barry', 'ben', 'benjamin', 'bernard', 'bill', 'billy', 'blake',
  'bob', 'bobby', 'brad', 'bradley', 'brandon', 'brendan', 'brent', 'brett', 'brian', 'bruce',
  'bryan', 'bryce', 'byron', 'caleb', 'calvin', 'cameron', 'carl', 'carlos', 'carter', 'casey',
  'cecil', 'chad', 'charles', 'charlie', 'chase', 'chester', 'chris', 'christian', 'christopher', 'clarence',
  'clark', 'claude', 'clayton', 'clifford', 'clifton', 'clint', 'clinton', 'clyde', 'cody', 'colby',
  'cole', 'colin', 'collin', 'colton', 'connor', 'corey', 'cornelius', 'cory', 'craig', 'curtis',
  'dale', 'dallas', 'dalton', 'damian', 'damon', 'dan', 'dana', 'daniel', 'danny', 'darrell',
  'darren', 'darryl', 'darwin', 'dave', 'david', 'dean', 'dennis', 'derek', 'derrick', 'devin',
  'devon', 'dewayne', 'dewey', 'dexter', 'diego', 'dillon', 'dominic', 'dominick', 'don', 'donald',
  'donnie', 'dorian', 'doug', 'douglas', 'drew', 'duane', 'dustin', 'dwayne', 'dwight', 'dylan',
  'earl', 'ed', 'eddie', 'edgar', 'edmond', 'edmund', 'eduardo', 'edward', 'edwin', 'eli',
  'elijah', 'elliot', 'elliott', 'ellis', 'elmer', 'emanuel', 'emilio', 'emmanuel', 'emmett', 'enrique',
  'eric', 'erik', 'ernest', 'ernie', 'ethan', 'eugene', 'evan', 'everett', 'felix', 'fernando',
  'floyd', 'forrest', 'francis', 'francisco', 'frank', 'franklin', 'fred', 'freddie', 'frederick', 'gabriel',
  'garrett', 'gary', 'gavin', 'gene', 'geoffrey', 'george', 'gerald', 'geraldo', 'gerard', 'gilbert',
  'glen', 'glenn', 'gordon', 'grady', 'graham', 'grant', 'greg', 'gregg', 'gregory', 'guy',
  'harold', 'harry', 'harvey', 'hector', 'henry', 'herbert', 'herman', 'homer', 'horace', 'howard',
  'hubert', 'hugh', 'hugo', 'hunter', 'ian', 'irvin', 'irving', 'isaac', 'isaiah', 'ismael',
  'ivan', 'jack', 'jackson', 'jacob', 'jake', 'james', 'jamie', 'jared', 'jason', 'jasper',
  'javier', 'jay', 'jayden', 'jeff', 'jeffery', 'jeffrey', 'jeremiah', 'jeremy', 'jermaine', 'jerome',
  'jerry', 'jesse', 'jessie', 'jesus', 'jim', 'jimmie', 'jimmy', 'joe', 'joel', 'joey',
  'john', 'johnathan', 'johnnie', 'johnny', 'jon', 'jonah', 'jonas', 'jonathan', 'jonathon', 'jordan',
  'jorge', 'jose', 'joseph', 'josh', 'joshua', 'juan', 'julian', 'julio', 'julius', 'justin',
  'karl', 'keith', 'ken', 'kendall', 'kenneth', 'kenny', 'kent', 'kevin', 'kirk', 'kurt',
  'kyle', 'lance', 'landon', 'larry', 'laurence', 'lawrence', 'lee', 'leo', 'leon', 'leonard',
  'leroy', 'leslie', 'lester', 'levi', 'lewis', 'liam', 'lloyd', 'logan', 'lonnie', 'lorenzo',
  'louis', 'lowell', 'lucas', 'luis', 'luke', 'luther', 'lyle', 'lynn', 'mack', 'malcolm',
  'manuel', 'marc', 'marcus', 'mario', 'marion', 'mark', 'marlon', 'marshall', 'martin', 'marvin',
  'mason', 'mathew', 'matt', 'matthew', 'maurice', 'max', 'maxwell', 'melvin', 'michael', 'micheal',
  'miguel', 'mike', 'miles', 'milo', 'milton', 'mitchell', 'morris', 'moses', 'myron', 'nathan',
  'nathaniel', 'neal', 'ned', 'neil', 'nelson', 'nicholas', 'nick', 'nicolas', 'noah', 'noel',
  'norman', 'oliver', 'omar', 'orlando', 'oscar', 'otis', 'otto', 'owen', 'pablo', 'parker',
  'pat', 'patrick', 'paul', 'pedro', 'percy', 'perry', 'pete', 'peter', 'phil', 'philip',
  'phillip', 'pierce', 'preston', 'quentin', 'quincy', 'rafael', 'ralph', 'ramon', 'randall', 'randy',
  'raul', 'ray', 'raymond', 'reginald', 'rene', 'rex', 'ricardo', 'richard', 'rick', 'ricky',
  'riley', 'rob', 'robbie', 'robert', 'roberto', 'roderick', 'rodney', 'roger', 'roland', 'roman',
  'ron', 'ronald', 'ronnie', 'ross', 'roy', 'ruben', 'rudolph', 'rudy', 'rufus', 'russell',
  'ryan', 'salvador', 'sam', 'sammy', 'samuel', 'santiago', 'scott', 'sean', 'sebastian', 'sergio',
  'seth', 'shane', 'shannon', 'shaun', 'shawn', 'sheldon', 'sherman', 'sidney', 'simon', 'spencer',
  'stanley', 'stephen', 'steve', 'steven', 'stewart', 'stuart', 'sylvester', 'taylor', 'ted', 'terrance',
  'terrell', 'terrence', 'terry', 'theodore', 'thomas', 'tim', 'timothy', 'tobias', 'toby', 'todd',
  'tom', 'tommy', 'tony', 'travis', 'trent', 'trevor', 'troy', 'tyler', 'tyrone', 'vernon',
  'victor', 'vincent', 'virgil', 'wade', 'wallace', 'walter', 'warren', 'wayne', 'wendell', 'wesley',
  'wilbert', 'wilbur', 'will', 'willard', 'william', 'willie', 'willis', 'wilson', 'winston', 'wyatt',
  'xavier', 'zachary', 'zane',
]);

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

  // Extract potential performer names using capitalized word pairs
  const inferredPerformers = extractPerformerNames(description, channelName);

  return {
    inferredYear,
    inferredShowType,
    inferredActNames,
    inferredPerformers,
  };
}

/**
 * Extract performer names from text using capitalized word pairs
 * Looks for "FirstName LastName" patterns where FirstName is a known first name
 */
function extractPerformerNames(description: string, channelName: string): string[] {
  const names: string[] = [];
  const combined = `${description} ${channelName}`;

  // Find all capitalized word pairs (e.g., "Haylee Swick", "Lindsay Whitwam")
  // Pattern: Capital letter + lowercase letters, space, Capital letter + lowercase letters
  const wordPairPattern = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;

  let match;
  while ((match = wordPairPattern.exec(combined)) !== null) {
    const firstName = match[1];
    const lastName = match[2];
    const fullName = `${firstName} ${lastName}`;

    // Check if first name is in our known names list
    if (!COMMON_FIRST_NAMES.has(firstName.toLowerCase())) {
      continue;
    }

    // Filter out common false positives (circus-related phrases)
    if (isCommonPhrase(fullName)) {
      continue;
    }

    // Avoid duplicates
    if (!names.includes(fullName)) {
      names.push(fullName);
      console.log(`    Detected performer name: ${fullName}`);
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
