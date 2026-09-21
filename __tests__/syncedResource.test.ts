import { createSyncedResource } from "../lib/syncedResource";

describe("createSyncedResource", () => {
  it("loads once and shares the value with every subscriber", async () => {
    let loads = 0;
    const resource = createSyncedResource(0, async () => {
      loads += 1;
      return 12;
    });

    const seen: number[] = [];
    const unsubscribe = resource.subscribe(() => {
      seen.push(resource.value);
    });
    resource.subscribe(() => undefined);

    await resource.ensureLoaded();

    expect(loads).toBe(1);
    expect(resource.ready).toBe(true);
    expect(resource.value).toBe(12);
    expect(resource.getSnapshot()).toEqual({ value: 12, ready: true });
    expect(seen).toContain(12);
    unsubscribe();
  });

  it("does not let a late load clobber an optimistic write", async () => {
    let finishLoad: ((value: boolean) => void) | undefined;
    const resource = createSyncedResource(
      false,
      () =>
        new Promise<boolean>((resolve) => {
          finishLoad = resolve;
        })
    );

    void resource.ensureLoaded();
    resource.setValue(true);
    finishLoad?.(false);
    await resource.ensureLoaded();

    expect(resource.value).toBe(true);
    expect(resource.ready).toBe(true);
  });
});
