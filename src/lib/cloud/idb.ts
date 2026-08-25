/**
 * Client-Side IndexedDB / localStorage Failover Storage Engine
 * Keeps all influencer profiles, campaign queues, affiliate attribution,
 * and content drafts fully operational and responsive even when offline or previewing.
 */

const DB_NAME = "EchoCloudLocalStore";
const DB_VERSION = 1;
const STORE_NAMES = [
  "products",
  "personas",
  "campaigns",
  "campaign_workflows",
  "videos",
  "ad_images",
  "calendar_slots",
  "affiliate_programs",
  "affiliate_links",
  "subscriptions",
  "profiles",
  "organizations",
  "organization_members",
  "social_posts",
  "social_post_variants",
  "sync_queue",
] as const;

type StoreName = (typeof STORE_NAMES)[number];

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isBrowser = typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

  private getDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser) return Promise.resolve(null);
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = window.indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            for (const name of STORE_NAMES) {
              if (!db.objectStoreNames.contains(name)) {
                db.createObjectStore(name, { keyPath: "id" });
              }
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            console.warn("[LocalDatabase] IndexedDB unavailable, falling back to localStorage");
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  // Fallback to localStorage
  private getLocal<T>(storeName: string): T[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`echo_${storeName}`);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private setLocal<T>(storeName: string, items: T[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`echo_${storeName}`, JSON.stringify(items));
    } catch (e) {
      console.warn("[LocalDatabase] localStorage write failed", e);
    }
  }

  async getAll<T extends { id: string }>(storeName: StoreName | string): Promise<T[]> {
    const db = await this.getDB();
    if (!db) return this.getLocal<T>(storeName);

    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(this.getLocal<T>(storeName));
          return;
        }
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result as T[]) || [];
          if (results.length === 0) {
            resolve(this.getLocal<T>(storeName));
          } else {
            resolve(results);
          }
        };
        req.onerror = () => resolve(this.getLocal<T>(storeName));
      } catch {
        resolve(this.getLocal<T>(storeName));
      }
    });
  }

  async get<T extends { id: string }>(
    storeName: StoreName | string,
    id: string,
  ): Promise<T | null> {
    const db = await this.getDB();
    if (!db) {
      const items = this.getLocal<T>(storeName);
      return items.find((i) => i.id === id) ?? null;
    }

    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          const items = this.getLocal<T>(storeName);
          resolve(items.find((i) => i.id === id) ?? null);
          return;
        }
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result as T);
          } else {
            const items = this.getLocal<T>(storeName);
            resolve(items.find((i) => i.id === id) ?? null);
          }
        };
        req.onerror = () => {
          const items = this.getLocal<T>(storeName);
          resolve(items.find((i) => i.id === id) ?? null);
        };
      } catch {
        const items = this.getLocal<T>(storeName);
        resolve(items.find((i) => i.id === id) ?? null);
      }
    });
  }

  async put<T extends { id: string }>(storeName: StoreName | string, item: T): Promise<T> {
    // Write to localStorage for immediate resilience
    const localItems = this.getLocal<T>(storeName);
    const existingIndex = localItems.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      localItems[existingIndex] = { ...localItems[existingIndex], ...item };
    } else {
      localItems.unshift(item);
    }
    this.setLocal(storeName, localItems);

    const db = await this.getDB();
    if (!db) return item;

    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(item);
          return;
        }
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => resolve(item);
      } catch {
        resolve(item);
      }
    });
  }

  async delete(storeName: StoreName | string, id: string): Promise<boolean> {
    const localItems = this.getLocal<{ id: string }>(storeName);
    this.setLocal(
      storeName,
      localItems.filter((i) => i.id !== id),
    );

    const db = await this.getDB();
    if (!db) return true;

    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(true);
          return;
        }
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(true);
      } catch {
        resolve(true);
      }
    });
  }

  async bulkPut<T extends { id: string }>(
    storeName: StoreName | string,
    items: T[],
  ): Promise<void> {
    for (const item of items) {
      await this.put(storeName, item);
    }
  }
}

export const localDB = new LocalDatabase();
