"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  datasetSourceLabel,
  isActiveDataset,
  type ActiveDataset,
  type DatasetSource,
} from "@/lib/active-dataset";
import type { AnalysisResult } from "@/lib/types";

const STORAGE_KEY = "ai-finops-copilot.active-dataset.v1";
const DATASET_EVENT = "ai-finops-active-dataset-change";

interface ActiveDatasetContextValue {
  activeDataset: ActiveDataset | null;
  ready: boolean;
  activateDataset: (source: DatasetSource, analysis: AnalysisResult) => void;
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

function parseDataset(serialized: string | null) {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    return isActiveDataset(value) ? value : null;
  } catch {
    return null;
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
  const activeDataset = parseDataset(serialized);

  function activateDataset(source: DatasetSource, analysis: AnalysisResult) {
    const dataset: ActiveDataset = {
      version: 1,
      source,
      label: datasetSourceLabel(source),
      loadedAt: new Date().toISOString(),
      analysis,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    window.dispatchEvent(new Event(DATASET_EVENT));
  }

  function clearDataset() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(DATASET_EVENT));
  }

  return (
    <ActiveDatasetContext.Provider
      value={{ activeDataset, ready, activateDataset, clearDataset }}
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
