import { EventWithTickets } from '@/types/event';

// Common/generic words that should have lower weight in scoring
// These words appear in many titles but don't indicate strong relevance
const COMMON_WORDS = new Set([
  'night',
  'day',
  'evening',
  'morning',
  'afternoon',
  'show',
  'event',
  'experience',
  'tour',
  'class',
  'session',
  'workshop',
  'party',
  'celebration',
  'new',
  'special',
  'great',
  'best',
  'top',
  'annual',
  'monthly',
  'weekly',
  'daily',
]);

// Synonym map for keyword expansion - matches production
export const SYNONYM_MAP: Record<string, string[]> = {
  'music': ['concert', 'live', 'band', 'performance', 'show', 'gig', 'festival', 'acoustic', 'jazz', 'rock', 'classical', 'electronic', 'dj', 'singer', 'musician', 'orchestra'],
  'yoga': ['pilates', 'meditation', 'mindfulness', 'wellness', 'stretching', 'zen', 'breathwork'],
  'games': ['gaming', 'quiz', 'trivia', 'board', 'cards', 'tournament', 'competition', 'play', 'e-sports', 'esports', 'video games', 'videogames', 'video-games', 'boardgame', 'board-game'],
  'food': ['dining', 'restaurant', 'cuisine', 'meal', 'tasting', 'cooking', 'culinary', 'brunch', 'dinner', 'lunch', 'wine', 'beer', 'drinks'],
  'fitness': ['workout', 'gym', 'exercise', 'training', 'crossfit', 'bootcamp', 'sports', 'running', 'cycling'],
  'art': ['exhibition', 'gallery', 'museum', 'painting', 'sculpture', 'photography', 'creative', 'craft'],
  'theater': ['theatre', 'play', 'drama', 'performance', 'stage', 'acting', 'show'],
  'dance': ['dancing', 'ballet', 'salsa', 'tango', 'hip-hop', 'contemporary'],
  'comedy': ['standup', 'humor', 'funny', 'comedian', 'laugh', 'improv'],
  'party': ['nightlife', 'club', 'bar', 'dancing', 'celebration', 'social'],
  'culture': ['cultural', 'art', 'museum', 'exhibition', 'theater', 'opera', 'ballet'],
  'workshop': ['class', 'course', 'lesson', 'training', 'seminar', 'tutorial'],
  'networking': ['meetup', 'social', 'connect', 'business', 'professional'],
  'outdoor': ['nature', 'park', 'beach', 'hiking', 'outside', 'fresh air'],
  'kids': ['children', 'family', 'youth', 'young'],
  'sport': ['sports', 'athletic', 'game', 'match', 'competition'],
  'cheap': ['affordable', 'budget', 'inexpensive', 'low-cost', 'free'],
  'expensive': ['premium', 'luxury', 'high-end', 'exclusive'],
  'tonight': ['today', 'this evening', 'now'],
  'weekend': ['saturday', 'sunday'],
};

// Venue entity map for precise venue matching - matches production
export const VENUE_ENTITIES: Record<string, { canonical: string; aliases: string[]; weight: number }> = {
  'tivoli': { canonical: 'Tivoli Gardens', aliases: ['tivoli', 'tivoli gardens', 'tivoli copenhagen'], weight: 100 },
  'vega': { canonical: 'Vega', aliases: ['vega', 'vega copenhagen', 'store vega', 'lille vega'], weight: 90 },
  'kb hallen': { canonical: 'KB Hallen', aliases: ['kb hallen', 'kb-hallen', 'kb hall'], weight: 85 },
  'parken': { canonical: 'Parken Stadium', aliases: ['parken', 'parken stadium', 'telia parken'], weight: 95 },
  'royal danish': { canonical: 'Royal Danish Theatre', aliases: ['royal danish theatre', 'royal theatre', 'det kongelige teater'], weight: 90 },
  'opera': { canonical: 'Copenhagen Opera House', aliases: ['opera house', 'operaen', 'copenhagen opera'], weight: 95 },
  'rust': { canonical: 'Rust', aliases: ['rust', 'rust copenhagen'], weight: 80 },
  'pumpehuset': { canonical: 'Pumpehuset', aliases: ['pumpehuset', 'pumpe'], weight: 75 },
  'loppen': { canonical: 'Loppen', aliases: ['loppen', 'loppen christiania'], weight: 70 },
  'reffen': { canonical: 'Reffen', aliases: ['reffen', 'reffen street food'], weight: 85 },
};

/**
 * Expands keywords using the synonym map
 */
export function expandKeywords(keywords: string[]): string[] {
  const expanded = new Set<string>();

  keywords.forEach(keyword => {
    const lower = keyword.toLowerCase();
    expanded.add(lower);

    // Check synonym map
    Object.entries(SYNONYM_MAP).forEach(([key, synonyms]) => {
      if (lower === key || synonyms.includes(lower)) {
        expanded.add(key);
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });

  return Array.from(expanded);
}

/**
 * Calculate venue match score
 */
function calculateVenueScore(event: EventWithTickets, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerVenue = event.venue.toLowerCase();

  // Check for exact venue entity match
  for (const [key, entity] of Object.entries(VENUE_ENTITIES)) {
    const queryIncludesVenue = entity.aliases.some(alias => lowerQuery.includes(alias));
    const eventAtThisVenue = entity.aliases.some(alias => lowerVenue.includes(alias));

    if (queryIncludesVenue && eventAtThisVenue) {
      return entity.weight;
    }
  }

  // Check for partial venue match (for non-entity venues)
  if (lowerQuery.includes(lowerVenue) && lowerVenue.length > 3) {
    return 50;
  }

  return 0;
}

/**
 * Calculate relevance score for an event based on keywords
 * This matches the production scoring algorithm
 */
export function calculateRelevanceScore(
  event: EventWithTickets,
  originalKeywords: string[],
  expandedKeywords: string[],
  query: string
): { score: number; matched: number; direct: number; synonym: number } {
  let score = 0;
  let directMatches = 0;
  let synonymMatches = 0;

  const lowerTitle = event.title.toLowerCase();
  const lowerDescription = event.description.toLowerCase();
  const lowerCategory = event.category.toLowerCase();

  // Title matches (highest weight)
  originalKeywords.forEach(keyword => {
    const lower = keyword.toLowerCase();
    if (lowerTitle.includes(lower)) {
      // Apply reduced weight to common/generic words
      const weight = COMMON_WORDS.has(lower) ? 15 : 50; // 0.3x multiplier for common words
      score += weight;
      directMatches++;
    }
  });

  // Expanded keyword title matches
  expandedKeywords.forEach(keyword => {
    if (!originalKeywords.includes(keyword)) {
      if (lowerTitle.includes(keyword)) {
        // Apply reduced weight to common/generic words
        const weight = COMMON_WORDS.has(keyword) ? 5 : 15; // ~0.33x multiplier for common words
        score += weight;
        synonymMatches++;
      }
    }
  });

  // Venue matching (very high weight)
  const venueScore = calculateVenueScore(event, query);
  score += venueScore;
  if (venueScore > 0) directMatches++;

  // Category matches
  originalKeywords.forEach(keyword => {
    const lower = keyword.toLowerCase();
    if (lowerCategory === lower || lowerCategory.includes(lower)) {
      // Apply reduced weight to common/generic words
      const weight = COMMON_WORDS.has(lower) ? 10 : 30; // ~0.33x multiplier for common words
      score += weight;
      directMatches++;
    }
  });

  // Expanded keyword category matches
  expandedKeywords.forEach(keyword => {
    if (!originalKeywords.includes(keyword)) {
      if (lowerCategory === keyword || lowerCategory.includes(keyword)) {
        // Apply reduced weight to common/generic words
        const weight = COMMON_WORDS.has(keyword) ? 4 : 12; // ~0.33x multiplier for common words
        score += weight;
        synonymMatches++;
      }
    }
  });

  // Description matches
  originalKeywords.forEach(keyword => {
    const lower = keyword.toLowerCase();
    if (lowerDescription.includes(lower)) {
      // Apply reduced weight to common/generic words
      const weight = COMMON_WORDS.has(lower) ? 6 : 20; // 0.3x multiplier for common words
      score += weight;
      directMatches++;
    }
  });

  // Expanded keyword description matches
  expandedKeywords.forEach(keyword => {
    if (!originalKeywords.includes(keyword)) {
      if (lowerDescription.includes(keyword)) {
        // Apply reduced weight to common/generic words
        const weight = COMMON_WORDS.has(keyword) ? 3 : 8; // ~0.375x multiplier for common words
        score += weight;
        synonymMatches++;
      }
    }
  });

  // Source diversity bonus (prefer native events slightly)
  if (event.source_type === 'native') {
    score += 2;
  }

  // Availability bonus (events with more tickets)
  const ticketsLeft = event.event_tickets?.[0]?.tickets_left || 0;
  if (ticketsLeft > 0) {
    score += Math.min(ticketsLeft / 10, 5); // Max 5 points
  }

  // Recent/soon events get a small boost
  const eventDate = new Date(event.event_date);
  const daysUntil = Math.floor((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil >= 0 && daysUntil <= 7) {
    score += 10; // Boost events in the next week
  } else if (daysUntil > 7 && daysUntil <= 14) {
    score += 5;
  }

  return {
    score,
    matched: directMatches + synonymMatches,
    direct: directMatches,
    synonym: synonymMatches,
  };
}

/**
 * Parse time preference from query
 */
export function parseTimePreference(query: string): { start?: Date; end?: Date } | null {
  const lower = query.toLowerCase();
  const now = new Date();

  // Tonight
  if (lower.includes('tonight') || lower.includes('today')) {
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return { start: now, end: endOfDay };
  }

  // Tomorrow
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    return { start: tomorrow, end: endOfTomorrow };
  }

  // This weekend
  if (lower.includes('weekend') || lower.includes('saturday') || lower.includes('sunday')) {
    const day = now.getDay();
    const daysUntilSaturday = day === 0 ? 6 : 6 - day;
    const saturday = new Date(now);
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);
    return { start: saturday, end: sunday };
  }

  // This week
  if (lower.includes('this week') || lower.includes('week')) {
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    return { start: now, end: endOfWeek };
  }

  return null;
}

/**
 * Parse price preference from query
 */
export function parsePricePreference(query: string): { min?: number; max?: number } | null {
  const lower = query.toLowerCase();

  if (lower.includes('free')) {
    return { min: 0, max: 0 };
  }

  if (lower.includes('cheap') || lower.includes('affordable') || lower.includes('budget')) {
    return { min: 0, max: 200 };
  }

  if (lower.includes('expensive') || lower.includes('premium') || lower.includes('luxury')) {
    return { min: 300, max: 10000 };
  }

  return null;
}

/**
 * Parse negative keywords from query using natural language patterns
 */
function parseNegativeKeywords(query: string): { positiveKeywords: string[]; negativeKeywords: string[] } {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/);
  const negativeKeywords: string[] = [];
  const positiveKeywords: string[] = [];

  // Negative keyword patterns
  const negativePatterns = [
    'not',
    'without',
    'excluding',
    'except',
    'exclude',
    'minus',
    'no'
  ];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if this word is a negative keyword indicator
    if (negativePatterns.includes(word) && i + 1 < words.length) {
      // Next word is the negative keyword
      const negKeyword = words[i + 1];
      if (negKeyword.length > 2) {
        negativeKeywords.push(negKeyword);
        i++; // Skip the next word since we've processed it
        continue;
      }
    }

    // Regular positive keyword
    if (word.length > 2 && !negativePatterns.includes(word)) {
      positiveKeywords.push(word);
    }
  }

  return { positiveKeywords, negativeKeywords };
}

/**
 * Main search function - matches production logic
 */
export function searchEvents(
  events: EventWithTickets[],
  query: string,
  options?: {
    categories?: string[];
    priceRange?: { min: number; max: number };
    timeFilter?: { start?: Date; end?: Date };
  }
): EventWithTickets[] {
  // Parse keywords and negative keywords from query
  const { positiveKeywords, negativeKeywords } = parseNegativeKeywords(query);
  const keywords = positiveKeywords;

  // Expand keywords using synonyms
  const expandedKeywords = expandKeywords(keywords);

  // Auto-detect time and price preferences if not provided
  const timeFilter = options?.timeFilter || parseTimePreference(query);
  const priceFilter = options?.priceRange || parsePricePreference(query);

  console.log('🔍 Search params:', {
    query,
    keywords,
    negativeKeywords,
    expandedCount: expandedKeywords.length,
    timeFilter,
    priceFilter,
  });

  // Filter events by time
  let filtered = events;
  if (timeFilter) {
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.event_date);
      if (timeFilter.start && eventDate < timeFilter.start) return false;
      if (timeFilter.end && eventDate > timeFilter.end) return false;
      return true;
    });
  }

  // Filter by price
  if (priceFilter) {
    filtered = filtered.filter(event => {
      if (priceFilter.min !== undefined && event.price < priceFilter.min) return false;
      if (priceFilter.max !== undefined && event.price > priceFilter.max) return false;
      return true;
    });
  }

  // Filter by categories
  if (options?.categories && options.categories.length > 0) {
    filtered = filtered.filter(event => options.categories!.includes(event.category));
  }

  // Filter out events matching negative keywords
  if (negativeKeywords.length > 0) {
    filtered = filtered.filter(event => {
      const lowerTitle = event.title.toLowerCase();
      const lowerDescription = event.description.toLowerCase();
      const lowerCategory = event.category.toLowerCase();

      // Exclude event if ANY negative keyword matches
      return !negativeKeywords.some(negKeyword => {
        return lowerTitle.includes(negKeyword) || 
               lowerDescription.includes(negKeyword) || 
               lowerCategory.includes(negKeyword);
      });
    });
  }

  // Calculate relevance scores
  const scored = filtered.map(event => {
    const relevance = calculateRelevanceScore(event, keywords, expandedKeywords, query);
    return {
      ...event,
      _relevanceScore: relevance.score,
      _matched: relevance.matched,
      _direct: relevance.direct,
      _synonym: relevance.synonym,
    };
  });

  // Sort by relevance score
  scored.sort((a, b) => {
    // Primary sort: relevance score
    if (b._relevanceScore !== a._relevanceScore) {
      return b._relevanceScore - a._relevanceScore;
    }
    // Secondary sort: event date (sooner first)
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });

  // Filter out noise (very low scores)
  const MIN_SCORE = 10;
  const finalResults = scored.filter(e => e._relevanceScore >= MIN_SCORE);

  // Dynamic tiering: find the largest gap in scores to split tiers
  if (finalResults.length > 0) {
    const MIN_TIER1_SCORE = 40;
    const topScore = finalResults[0]._relevanceScore;
    let maxGap = 0;
    let gapIndex = -1;

    // If the top result is below threshold, everything goes to Tier 2
    if (topScore < MIN_TIER1_SCORE) {
      finalResults.forEach(event => {
        (event as any)._tier = 2; // All results are "Possibly Relevant"
      });
    } else {
      // Look for the largest score gap in the results
      for (let i = 0; i < Math.min(finalResults.length - 1, 20); i++) {
        const gap = finalResults[i]._relevanceScore - finalResults[i + 1]._relevanceScore;
        const percentDrop = gap / finalResults[i]._relevanceScore;

        // Significant gap: >35% drop OR >50 absolute points
        if ((percentDrop > 0.35 || gap > 50) && gap > maxGap) {
          maxGap = gap;
          gapIndex = i;
        }
      }

      // Assign tiers based on the gap
      finalResults.forEach((event, index) => {
        if (gapIndex === -1 || index <= gapIndex) {
          (event as any)._tier = 1; // Highly Relevant
        } else {
          (event as any)._tier = 2; // Possibly Relevant
        }
      });
    }

    console.log('📊 Tiering:', {
      tier1Count: finalResults.filter(e => (e as any)._tier === 1).length,
      tier2Count: finalResults.filter(e => (e as any)._tier === 2).length,
      gapAt: gapIndex >= 0 ? `${finalResults[gapIndex]._relevanceScore} → ${finalResults[gapIndex + 1]._relevanceScore}` : 'none',
      maxGap,
    });
  }

  // Log top results for debugging
  console.log(
    '🎯 Top 5 results:',
    finalResults.slice(0, 5).map(e => ({
      title: e.title,
      score: e._relevanceScore,
      tier: (e as any)._tier,
      matched: e._matched,
      direct: e._direct,
      synonym: e._synonym,
    }))
  );

  return finalResults;
}
