"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  createActiveDataset,
  isDatasetStore,
  type ActiveDataset,
  type DatasetSource,
  type DatasetStore,
} from "@/lib/active-dataset";
import type { AnalyzedDatasetPayload } from "@/lib/types";
import {
  EMPTY_DATASET_STORE,
  clearActiveDataset,
  deleteDatasetFromHistory,
  loadDatasetFromHistory,
  renameDatasetInHistory,
  saveDatasetToHistory,
} from "@/lib/dataset-store";

const STORAGE_KEY = "ai-finops-copilot.dataset-store.v2";
const DATASET_EVENT = "ai-finops-dataset-store-change";

interface ActiveDatasetContextValue {
  activeDataset: ActiveDataset | null;
  history: ActiveDataset[];
  ready: boolean;
  activateDataset: (input: {
    name: string;
    source: DatasetSource;
    payload: AnalyzedDatasetPayload;
  }) => ActiveDataset;
  loadDataset: (id: string) => boolean;
  renameDataset: (id: string, name: string) => void;
  deleteDataset: (id: string) => void;
  clearDataset: () => void;
}

const ActiveDatasetContext = createContext<ActiveDatasetContextValue | null>(null);

function subscribeDataset(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DATASET_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DATASET_EVENT, callback);
  };
}

function getDatasetSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerDatasetSnapshot() {
  return null;
}

function subscribeClient() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerClientSnapshot() {
  return false;
}

function parseStore(serialized: string | null): DatasetStore {
  if (!serialized) return EMPTY_DATASET_STORE;
  try {
    const value: unknown = JSON.parse(serialized);
    return isDatasetStore(value) ? value : EMPTY_DATASET_STORE;
  } catch {
    return EMPTY_DATASET_STORE;
  }
}

function readStore() {
  return parseStore(window.localStorage.getItem(STORAGE_KEY));
}

function writeStore(store: DatasetStore) {
  let nextStore = store;
  while (true) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
      window.dispatchEvent(new Event(DATASET_EVENT));
      return;
    } catch {
      if (nextStore.history.length <= 1) {
        throw new Error(
          "This dataset is too large for browser history. Reduce the upload size and try again.",
        );
      }
      nextStore = { ...nextStore, history: nextStore.history.slice(0, -1) };
    }
  }
}

export function ActiveDatasetProvider({ children }: { children: React.ReactNode }) {
  const serialized = useSyncExternalStore(
    subscribeDataset,
    getDatasetSnapshot,
    getServerDatasetSnapshot,
  );
  const ready = useSyncExternalStore(
    subscribeClient,
    getClientSnapshot,
    getServerClientSnapshot,
  );
  const store = parseStore(serialized);
  const activeDataset =
    store.history.find((dataset) => dataset.id === store.activeId) ?? null;

  function activateDataset(input: {
    name: string;
    source: DatasetSource;
    payload: AnalyzedDatasetPayload;
  }) {
    const dataset = createActiveDataset(input);
    const current = readStore();
    writeStore(saveDatasetToHistory(current, dataset));
    return dataset;
  }

  function loadDataset(id: string) {
    const current = readStore();
    const result = loadDatasetFromHistory(current, id);
    if (!result.loaded) return false;
    writeStore(result.store);
    return true;
  }

  function renameDataset(id: string, name: string) {
    const current = readStore();
    writeStore(renameDatasetInHistory(current, id, name));
  }

  function deleteDataset(id: string) {
    const current = readStore();
    writeStore(deleteDatasetFromHistory(current, id));
  }

  function clearDataset() {
    const current = readStore();
    writeStore(clearActiveDataset(current));
  }

  return (
    <ActiveDatasetContext.Provider
      value={{
        activeDataset,
        history: store.history,
        ready,
        activateDataset,
        loadDataset,
        renameDataset,
        deleteDataset,
        clearDataset,
      }}
    >
      {children}
    </ActiveDatasetContext.Provider>
  );
}

export function useActiveDataset() {
  const context = useContext(ActiveDatasetContext);
  if (!context) throw new Error("useActiveDataset must be used inside ActiveDatasetProvider.");
  return context;
}
