import { useEffect, useRef, useState } from 'react';
import type { CounterGuaranteeData } from '../../../types';
import { useSaveDocument } from './useSaveDocument';

export type AutosaveState = 'saving' | 'saved' | 'unsaved';

function serializeDocument(document?: CounterGuaranteeData) {
  return document ? JSON.stringify(document) : '';
}

export function useAutosaveDocument(enabled: boolean, draft?: CounterGuaranteeData) {
  const saveMutation = useSaveDocument();
  const [state, setState] = useState<AutosaveState>('saved');
  const lastSavedValue = useRef('');
  const queuedDraft = useRef<CounterGuaranteeData | undefined>(undefined);
  const savingRef = useRef(false);

  const flush = async (document: CounterGuaranteeData) => {
    queuedDraft.current = document;
    if (savingRef.current) {
      return document.id;
    }

    savingRef.current = true;
    setState('saving');

    try {
      let current = queuedDraft.current;

      while (current) {
        queuedDraft.current = undefined;
        const id = await saveMutation.mutateAsync({ document: current, snapshotReason: null });
        const savedDocument = current.id ? current : { ...current, id };
        lastSavedValue.current = serializeDocument(savedDocument);
        current = queuedDraft.current;
      }

      setState('saved');
      return document.id;
    } finally {
      savingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled || !draft) {
      return;
    }

    const serializedDraft = serializeDocument(draft);
    if (!lastSavedValue.current) {
      lastSavedValue.current = serializedDraft;
      return;
    }

    if (serializedDraft === lastSavedValue.current) {
      setState('saved');
      return;
    }

    setState('unsaved');
    const timeoutId = window.setTimeout(() => {
      void flush(draft);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [draft, enabled]);

  return {
    autosaveState: state,
    saveMutation,
    flush,
    markSaved(document: CounterGuaranteeData) {
      lastSavedValue.current = serializeDocument(document);
      setState('saved');
    },
    markUnsaved() {
      setState('unsaved');
    },
  };
}
