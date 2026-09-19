import { appCopy } from "@/lib/appContent";
import { defaultImageSize, generationConfig, imageSizeOptions } from "@/lib/config";
import { getLibraryPreset } from "@/lib/referenceLibrary";
import type { DraftState, HistoryItem, ReferenceItem } from "@/lib/types";

/**
 * Local persistence.
 *
 * Everything here holds base64 images, which blow past the localStorage quota
 * almost immediately, so IndexedDB is the only store. Every call degrades to a
 * no-op when IndexedDB is unavailable (private windows, blocked site data) —
 * losing a draft is acceptable, crashing the app is not.
 */

const dbConfig = {
  name: "design_model_db",
  version: 1,
  historyStore: "history",
  draftStore: "draft",
  draftKey: "current",
} as const;

function openDatabase() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest;

    try {
      request = window.indexedDB.open(dbConfig.name, dbConfig.version);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(dbConfig.historyStore)) {
        db.createObjectStore(dbConfig.historyStore, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(dbConfig.draftStore)) {
        db.createObjectStore(dbConfig.draftStore, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return openDatabase().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(storeName, mode);
          const request = action(transaction.objectStore(storeName));

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
          transaction.oncomplete = () => db.close();
        } catch {
          resolve(null);
        }
      }),
  );
}

function isImageSize(value: unknown): value is DraftState["imageSize"] {
  return imageSizeOptions.some((option) => option.value === value);
}

function normalizeUpload(value: unknown): ReferenceItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<ReferenceItem> & { kind?: string };

  // Library picks used to live in this list; they are a design choice now.
  if (item.kind === "library" || typeof item.src !== "string" || !item.src) {
    return null;
  }

  return {
    id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
    src: item.src,
    label:
      typeof item.label === "string" ? item.label : appCopy.references.fallbackLabel,
    note: typeof item.note === "string" ? item.note : "",
  };
}

/**
 * Drafts saved before designs were split out kept library picks inside
 * `references`. Carry the first valid one over as the chosen design.
 */
function migrateDesignId(draft: Record<string, unknown>) {
  if (typeof draft.designId === "string" && getLibraryPreset(draft.designId)) {
    return draft.designId;
  }

  const legacy = Array.isArray(draft.references) ? draft.references : [];

  for (const item of legacy) {
    const legacyItem = (item ?? {}) as { kind?: string; presetId?: unknown };

    if (
      legacyItem.kind === "library" &&
      typeof legacyItem.presetId === "string" &&
      getLibraryPreset(legacyItem.presetId)
    ) {
      return legacyItem.presetId;
    }
  }

  return null;
}

export async function loadDraft(): Promise<DraftState | null> {
  const record = await runTransaction<unknown>(
    dbConfig.draftStore,
    "readonly",
    (store) => store.get(dbConfig.draftKey),
  );

  if (!record || typeof record !== "object") {
    return null;
  }

  const draft = record as Record<string, unknown>;

  return {
    prompt: typeof draft.prompt === "string" ? draft.prompt : "",
    imageSize: isImageSize(draft.imageSize) ? draft.imageSize : defaultImageSize,
    references: Array.isArray(draft.references)
      ? draft.references
          .map(normalizeUpload)
          .filter((item): item is ReferenceItem => item !== null)
      : [],
    designId: migrateDesignId(draft),
  };
}

export async function saveDraft(draft: DraftState) {
  await runTransaction(dbConfig.draftStore, "readwrite", (store) =>
    store.put({ id: dbConfig.draftKey, ...draft }),
  );
}

export async function clearDraft() {
  await runTransaction(dbConfig.draftStore, "readwrite", (store) =>
    store.delete(dbConfig.draftKey),
  );
}

export async function loadHistory(): Promise<HistoryItem[]> {
  const records = await runTransaction<unknown[]>(
    dbConfig.historyStore,
    "readonly",
    (store) => store.getAll(),
  );

  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter((record): record is HistoryItem => {
      if (!record || typeof record !== "object") return false;
      const item = record as Partial<HistoryItem>;
      return typeof item.id === "string" && typeof item.imageUrl === "string";
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, generationConfig.maxHistoryCount);
}

export async function addHistory(item: HistoryItem): Promise<HistoryItem[]> {
  await runTransaction(dbConfig.historyStore, "readwrite", (store) =>
    store.put(item),
  );

  const history = await loadHistory();
  const overflow = history.slice(generationConfig.maxHistoryCount);

  await Promise.all(overflow.map((entry) => removeHistory(entry.id)));

  return history.slice(0, generationConfig.maxHistoryCount);
}

export async function removeHistory(id: string): Promise<HistoryItem[]> {
  await runTransaction(dbConfig.historyStore, "readwrite", (store) =>
    store.delete(id),
  );

  return loadHistory();
}

export async function clearHistory(): Promise<HistoryItem[]> {
  await runTransaction(dbConfig.historyStore, "readwrite", (store) =>
    store.clear(),
  );

  return [];
}
