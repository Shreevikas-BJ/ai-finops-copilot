import type { ActiveDataset, DatasetStore } from "@/lib/active-dataset";

export const EMPTY_DATASET_STORE: DatasetStore = {
  version: 2,
  activeId: null,
  history: [],
};

export function saveDatasetToHistory(
  store: DatasetStore,
  dataset: ActiveDataset,
): DatasetStore {
  return {
    version: 2,
    activeId: dataset.id,
    history: [dataset, ...store.history.filter((item) => item.id !== dataset.id)].slice(0, 3),
  };
}

export function loadDatasetFromHistory(
  store: DatasetStore,
  id: string,
): { store: DatasetStore; loaded: boolean } {
  if (!store.history.some((dataset) => dataset.id === id)) {
    return { store, loaded: false };
  }
  return { store: { ...store, activeId: id }, loaded: true };
}

export function renameDatasetInHistory(
  store: DatasetStore,
  id: string,
  name: string,
): DatasetStore {
  const trimmed = name.trim();
  if (!trimmed) return store;
  return {
    ...store,
    history: store.history.map((dataset) =>
      dataset.id === id ? { ...dataset, name: trimmed } : dataset,
    ),
  };
}

export function deleteDatasetFromHistory(store: DatasetStore, id: string): DatasetStore {
  return {
    ...store,
    activeId: store.activeId === id ? null : store.activeId,
    history: store.history.filter((dataset) => dataset.id !== id),
  };
}

export function clearActiveDataset(store: DatasetStore): DatasetStore {
  return { ...store, activeId: null };
}
