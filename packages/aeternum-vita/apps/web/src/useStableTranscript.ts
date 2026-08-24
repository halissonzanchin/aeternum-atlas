import { useLayoutEffect, useMemo, useReducer } from 'react';
import {
  combineUserSegments,
  createTranscriptSnapshot,
  type TranscriptEntry,
  type TranscriptSnapshot,
} from './transcript.ts';

const EMPTY_TRANSCRIPT: TranscriptSnapshot = {
  sourceEntries: [],
  stableEntries: [],
};

export const useStableTranscript = (entries: TranscriptEntry[]): TranscriptEntry[] => {
  const [snapshot, synchronizeSnapshot] = useReducer(
    createTranscriptSnapshot,
    entries,
    (initialEntries): TranscriptSnapshot =>
      createTranscriptSnapshot(EMPTY_TRANSCRIPT, initialEntries),
  );

  useLayoutEffect(() => {
    synchronizeSnapshot(entries);
  }, [entries]);

  return useMemo(() => combineUserSegments(snapshot.stableEntries), [snapshot]);
};
