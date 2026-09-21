export interface SyncedSnapshot<T> {
  value: T;
  ready: boolean;
}

export interface SyncedResource<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => SyncedSnapshot<T>;
  getServerSnapshot: () => SyncedSnapshot<T>;
  setValue: (next: T) => void;
  ensureLoaded: () => Promise<void>;
  readonly value: T;
  readonly ready: boolean;
}

/**
 * In-memory value shared by every hook instance, loaded once from storage.
 * Optimistic writes win over a late first-read so a toggle cannot be clobbered.
 */
export function createSyncedResource<T>(initial: T, load: () => Promise<T>): SyncedResource<T> {
  let value = initial;
  let ready = false;
  let snapshot: SyncedSnapshot<T> = { value, ready };
  let loadPromise: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    snapshot = { value, ready };
    for (const listener of listeners) {
      listener();
    }
  };

  const ensureLoaded = () => {
    if (loadPromise != null) {
      return loadPromise;
    }

    loadPromise = load()
      .then((loaded) => {
        if (!ready) {
          value = loaded;
          ready = true;
          emit();
        }
      })
      .catch(() => {
        if (!ready) {
          ready = true;
          emit();
        }
      });

    return loadPromise;
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      void ensureLoaded();
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    getServerSnapshot() {
      return snapshot;
    },
    setValue(next: T) {
      if (Object.is(next, value) && ready) {
        return;
      }
      value = next;
      ready = true;
      emit();
    },
    ensureLoaded,
    get value() {
      return value;
    },
    get ready() {
      return ready;
    },
  };
}
