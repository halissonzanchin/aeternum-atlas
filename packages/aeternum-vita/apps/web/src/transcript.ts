export type TranscriptEntry = {
  id: string;
  speaker: 'agent' | 'user';
  text: string;
};

export type TranscriptSnapshot = {
  sourceEntries: TranscriptEntry[];
  stableEntries: TranscriptEntry[];
};

const words = (text: string): string[] => {
  return text.trim().split(/\s+/).filter(Boolean);
};

const normalizeWord = (word: string): string => {
  return word.toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]/gu, '');
};

const startsWithWords = (value: string[], prefix: string[]): boolean => {
  return prefix.every((word, index) => normalizeWord(word) === normalizeWord(value[index] ?? ''));
};

export const mergeUserText = (
  previousText: string,
  nextText: string,
  appendWhenDistinct: boolean,
): string => {
  const previous = words(previousText);
  const next = words(nextText);

  if (previous.length === 0) {
    return nextText.trim();
  }

  if (next.length === 0) {
    return previousText.trim();
  }

  if (previous.length <= next.length && startsWithWords(next, previous)) {
    return nextText.trim();
  }

  if (next.length <= previous.length && startsWithWords(previous, next)) {
    return previousText.trim();
  }

  const maximumOverlap = Math.min(previous.length, next.length);
  for (let length = maximumOverlap; length >= 2; length -= 1) {
    const previousSuffix = previous.slice(-length).map(normalizeWord);
    const nextPrefix = next.slice(0, length).map(normalizeWord);
    if (previousSuffix.every((word, index) => word === nextPrefix[index])) {
      return [...previous, ...next.slice(length)].join(' ');
    }
  }

  return appendWhenDistinct ? `${previousText.trim()} ${nextText.trim()}` : nextText.trim();
};

const transcriptEntriesEqual = (
  previousEntries: TranscriptEntry[],
  nextEntries: TranscriptEntry[],
): boolean => {
  if (previousEntries === nextEntries) {
    return true;
  }

  if (previousEntries.length !== nextEntries.length) {
    return false;
  }

  return previousEntries.every((entry, index) => {
    const nextEntry = nextEntries[index];
    return (
      nextEntry !== undefined &&
      entry.id === nextEntry.id &&
      entry.speaker === nextEntry.speaker &&
      entry.text === nextEntry.text
    );
  });
};

const stabilizeUserRevisions = (
  previousSource: TranscriptEntry[],
  previousStable: TranscriptEntry[],
  nextSource: TranscriptEntry[],
): TranscriptEntry[] => {
  const previousIndexById = new Map(previousSource.map((entry, index) => [entry.id, index]));
  const nextIds = new Set(nextSource.map((entry) => entry.id));

  return nextSource.map((entry, index) => {
    if (entry.speaker !== 'user') {
      return entry;
    }

    const matchingIndex = previousIndexById.get(entry.id);
    const matchingStable = matchingIndex === undefined ? undefined : previousStable[matchingIndex];
    if (matchingStable?.speaker === 'user') {
      return {
        ...entry,
        id: matchingStable.id,
        text: mergeUserText(matchingStable.text, entry.text, false),
      };
    }

    const replacedSource = previousSource[index];
    const replacedStable = previousStable[index];
    if (
      replacedSource?.speaker === 'user' &&
      replacedStable?.speaker === 'user' &&
      !nextIds.has(replacedSource.id)
    ) {
      return {
        ...entry,
        id: replacedStable.id,
        text: mergeUserText(replacedStable.text, entry.text, false),
      };
    }

    return entry;
  });
};

export const createTranscriptSnapshot = (
  previousSnapshot: TranscriptSnapshot,
  nextSource: TranscriptEntry[],
): TranscriptSnapshot => {
  if (transcriptEntriesEqual(previousSnapshot.sourceEntries, nextSource)) {
    return previousSnapshot;
  }

  return {
    sourceEntries: nextSource,
    stableEntries: stabilizeUserRevisions(
      previousSnapshot.sourceEntries,
      previousSnapshot.stableEntries,
      nextSource,
    ),
  };
};

export const combineUserSegments = (entries: TranscriptEntry[]): TranscriptEntry[] => {
  return entries.reduce<TranscriptEntry[]>((combined, entry) => {
    const previous = combined.at(-1);
    if (entry.speaker === 'user' && previous?.speaker === 'user') {
      combined[combined.length - 1] = {
        ...previous,
        text: mergeUserText(previous.text, entry.text, true),
      };
    } else {
      combined.push(entry);
    }

    return combined;
  }, []);
};
