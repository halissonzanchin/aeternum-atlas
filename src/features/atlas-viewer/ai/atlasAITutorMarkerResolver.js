/**
 * atlasAITutorMarkerResolver.js
 * Utilitário seguro para normalizar e buscar marcadores anatômicos por nome ou sinônimo.
 */

// Normalizes strings by removing accents and making lower case
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Searches for a marker in the available context markers.
 * @param {string} query User's search string
 * @param {Array} markers Array of available marker objects
 * @returns {Object} { match: object|null, confidence: 'high'|'medium'|'low', alternatives: Array }
 */
export function resolveMarker(query, markers) {
  if (!query || !markers || !markers.length) {
    return { match: null, confidence: 'low', alternatives: [] };
  }

  const normalizedQuery = normalizeString(query);
  
  // Clean up common fluff words in the query
  const searchTerms = normalizedQuery
    .replace(/mostre o |mostre a |onde fica o |onde fica a |focar |focar no |focar na |explique o |explique a |quero revisar o |quero revisar a /g, '')
    .split(' ')
    .filter(w => w.length > 2); // Ignore small words like 'do', 'da', 'de'

  let bestMatch = null;
  let highestScore = 0;
  const alternatives = [];

  for (const marker of markers) {
    const title = normalizeString(marker.title || marker.name || '');
    const latin = normalizeString(marker.latinName || '');
    const desc = normalizeString(marker.description || '');
    
    let score = 0;

    // Exact Match
    if (title === normalizedQuery || latin === normalizedQuery) {
      score = 100;
    } else {
      // Partial Match
      searchTerms.forEach(term => {
        if (title.includes(term)) score += 30;
        if (latin.includes(term)) score += 20;
        if (desc.includes(term)) score += 5;
      });
    }

    if (score > highestScore) {
      if (bestMatch && highestScore >= 30) {
        alternatives.push(bestMatch);
      }
      highestScore = score;
      bestMatch = marker;
    } else if (score >= 30) {
      alternatives.push(marker);
    }
  }

  let confidence = 'low';
  if (highestScore >= 100) confidence = 'high';
  else if (highestScore >= 30) confidence = 'medium';

  return {
    match: highestScore >= 30 ? bestMatch : null,
    confidence,
    alternatives: alternatives.slice(0, 3) // Return top 3 alternatives
  };
}
