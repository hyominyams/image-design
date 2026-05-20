import { generationConfig } from "@/lib/config";

export type GeneratedImageHistoryItem = {
  id: string;
  createdAt: string;
  styleId: string;
  studentDescription: string;
  imageUrl: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
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

export function getGeneratedImageHistory(): GeneratedImageHistoryItem[] {
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

export function addGeneratedImageHistory(item: GeneratedImageHistoryItem) {
  if (!canUseStorage()) {
    return [];
  }

  const nextHistory = [item, ...getGeneratedImageHistory()].slice(
    0,
    generationConfig.maxHistoryCount,
  );

  try {
    window.localStorage.setItem(
      generationConfig.storageKeys.history,
      JSON.stringify(nextHistory),
    );

    return nextHistory;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      const fallbackHistory = [item];
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
