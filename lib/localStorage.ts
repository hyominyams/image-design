import {
  defaultImageSize,
  generationConfig,
  imageSizeOptions,
  type ImageSize,
} from "@/lib/config";

export type GeneratedImageHistoryItem = {
  id: string;
  createdAt: string;
  styleId: string;
  studentDescription: string;
  imageUrl: string;
};

export type AppDraftState = {
  uploadedImage: {
    dataUrl: string;
    name: string;
  } | null;
  studentDescription: string;
  selectedImageSize: ImageSize;
  selectedStyleId: string;
  generatedImageUrl: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && Boolean(window.indexedDB);
}

const imageDbConfig = {
  name: "general_ai_image_db",
  historyStoreName: "generated_images",
  draftStoreName: "app_drafts",
  draftId: "current",
  version: 2,
} as const;

type IndexedDbDraftRecord = AppDraftState & {
  id: string;
};

function isImageSize(value: unknown): value is ImageSize {
  return imageSizeOptions.some((option) => option.value === value);
}

function normalizeDraftState(value: unknown): AppDraftState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Partial<AppDraftState>;
  const uploadedImage =
    draft.uploadedImage &&
    typeof draft.uploadedImage === "object" &&
    typeof draft.uploadedImage.dataUrl === "string" &&
    typeof draft.uploadedImage.name === "string"
      ? {
          dataUrl: draft.uploadedImage.dataUrl,
          name: draft.uploadedImage.name,
        }
      : null;

  return {
    uploadedImage,
    studentDescription:
      typeof draft.studentDescription === "string" ? draft.studentDescription : "",
    selectedImageSize: isImageSize(draft.selectedImageSize)
      ? draft.selectedImageSize
      : defaultImageSize,
    selectedStyleId: typeof draft.selectedStyleId === "string" ? draft.selectedStyleId : "",
    generatedImageUrl:
      typeof draft.generatedImageUrl === "string" ? draft.generatedImageUrl : "",
  };
}

function openImageDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = window.indexedDB.open(
      imageDbConfig.name,
      imageDbConfig.version,
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(imageDbConfig.historyStoreName)) {
        db.createObjectStore(imageDbConfig.historyStoreName, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(imageDbConfig.draftStoreName)) {
        db.createObjectStore(imageDbConfig.draftStoreName, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function runImageDbTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
) {
  return new Promise<T | undefined>((resolve, reject) => {
    void openImageDb()
      .then((db) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);
        let result: T | undefined;

        if (request) {
          request.onsuccess = () => {
            result = request.result;
          };
          request.onerror = () => reject(request.error);
        }

        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error);
        };
      })
      .catch(reject);
  });
}

function runImageHistoryTransaction<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
) {
  return runImageDbTransaction(imageDbConfig.historyStoreName, mode, callback);
}

function runDraftTransaction<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
) {
  return runImageDbTransaction(imageDbConfig.draftStoreName, mode, callback);
}

function sortHistory(history: GeneratedImageHistoryItem[]) {
  return [...history].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function getLocalStorageHistory(): GeneratedImageHistoryItem[] {
  if (!canUseStorage()) {
    return [];
  }

  const savedHistory = window.localStorage.getItem(generationConfig.storageKeys.history);

  if (!savedHistory) {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(savedHistory);
    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    return [];
  }
}

function setLocalStorageHistory(history: GeneratedImageHistoryItem[]) {
  if (!canUseStorage()) {
    return history;
  }

  const nextHistory = history.slice(0, generationConfig.maxHistoryCount);

  try {
    window.localStorage.setItem(
      generationConfig.storageKeys.history,
      JSON.stringify(nextHistory),
    );

    return nextHistory;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      const fallbackHistory = nextHistory.slice(0, 1);
      window.localStorage.removeItem(generationConfig.storageKeys.history);

      try {
        window.localStorage.setItem(
          generationConfig.storageKeys.history,
          JSON.stringify(fallbackHistory),
        );

        return fallbackHistory;
      } catch {
        window.localStorage.removeItem(generationConfig.storageKeys.history);
        return [];
      }
    }

    throw error;
  }
}

function getLocalStorageDraftState() {
  if (!canUseStorage()) {
    return null;
  }

  const savedDraft = window.localStorage.getItem(generationConfig.storageKeys.draft);

  if (!savedDraft) {
    return null;
  }

  try {
    return normalizeDraftState(JSON.parse(savedDraft));
  } catch {
    return null;
  }
}

function setLocalStorageDraftState(draft: AppDraftState) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      generationConfig.storageKeys.draft,
      JSON.stringify(draft),
    );
  } catch {
    window.localStorage.removeItem(generationConfig.storageKeys.draft);
  }
}

function clearLocalStorageDraftState() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(generationConfig.storageKeys.draft);
}

async function pruneIndexedDbHistory(history: GeneratedImageHistoryItem[]) {
  const itemsToDelete = history.slice(generationConfig.maxHistoryCount);

  if (itemsToDelete.length === 0) {
    return;
  }

  await runImageHistoryTransaction("readwrite", (store) => {
    itemsToDelete.forEach((item) => store.delete(item.id));
  });
}

async function migrateLocalStorageHistoryToIndexedDb() {
  const localHistory = getLocalStorageHistory();

  if (localHistory.length === 0 || !canUseIndexedDb()) {
    return;
  }

  const existingHistory = await getIndexedDbHistory();

  if (existingHistory.length > 0) {
    return;
  }

  await runImageHistoryTransaction("readwrite", (store) => {
    localHistory
      .slice(0, generationConfig.maxHistoryCount)
      .forEach((item) => store.put(item));
  });
}

async function getAllIndexedDbHistory() {
  const history = await runImageHistoryTransaction<GeneratedImageHistoryItem[]>(
    "readonly",
    (store) => store.getAll(),
  );

  return sortHistory(history ?? []);
}

async function getIndexedDbHistory() {
  const history = await getAllIndexedDbHistory();

  return history.slice(0, generationConfig.maxHistoryCount);
}

async function addIndexedDbHistoryItem(item: GeneratedImageHistoryItem) {
  await runImageHistoryTransaction("readwrite", (store) => {
    store.put(item);
  });

  const nextHistory = await getAllIndexedDbHistory();
  await pruneIndexedDbHistory(nextHistory);

  return nextHistory.slice(0, generationConfig.maxHistoryCount);
}

async function getIndexedDbDraftState() {
  const draft = await runDraftTransaction<IndexedDbDraftRecord>(
    "readonly",
    (store) => store.get(imageDbConfig.draftId),
  );

  return normalizeDraftState(draft ?? null);
}

async function setIndexedDbDraftState(draft: AppDraftState) {
  await runDraftTransaction("readwrite", (store) => {
    store.put({
      id: imageDbConfig.draftId,
      ...draft,
    });
  });
}

export function getGenerationCount() {
  if (!canUseStorage()) {
    return 0;
  }

  const savedCount = window.localStorage.getItem(generationConfig.storageKeys.count);
  const parsedCount = Number(savedCount);

  return Number.isFinite(parsedCount) ? parsedCount : 0;
}

export function setGenerationCount(count: number) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(generationConfig.storageKeys.count, String(count));
}

export async function getGeneratedImageHistory() {
  try {
    await migrateLocalStorageHistoryToIndexedDb();
    return await getIndexedDbHistory();
  } catch {
    return sortHistory(getLocalStorageHistory()).slice(
      0,
      generationConfig.maxHistoryCount,
    );
  }
}

export async function addGeneratedImageHistory(item: GeneratedImageHistoryItem) {
  try {
    return await addIndexedDbHistoryItem(item);
  } catch {
    return setLocalStorageHistory(sortHistory([item, ...getLocalStorageHistory()]));
  }
}

export async function getAppDraftState() {
  try {
    return (await getIndexedDbDraftState()) ?? getLocalStorageDraftState();
  } catch {
    return getLocalStorageDraftState();
  }
}

export async function saveAppDraftState(draft: AppDraftState) {
  try {
    await setIndexedDbDraftState(draft);
    clearLocalStorageDraftState();
  } catch {
    setLocalStorageDraftState(draft);
  }
}
