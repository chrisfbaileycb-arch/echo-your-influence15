import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { DatabaseSchema, TableName, Json } from "./types";

interface StorageFile {
  name: string;
  bucket: string;
  storagePath: string;
  dataUrl: string;
  contentType: string;
  size: number;
  created_at: string;
}

const STORE_PATH = path.join(process.cwd(), ".cloud_db_store.json");

interface DBStore {
  collections: { [K in TableName]?: Array<DatabaseSchema[K]> };
  storage: Record<string, StorageFile>;
}

class CloudStoreManager {
  private store: DBStore = {
    collections: {},
    storage: {},
  };
  private isLoaded = false;

  private initDefaults() {
    const defaultOrgId = "org_customer_zero_main";
    const defaultOwnerId = "demo-user-id";

    if (!this.store.collections.organizations) {
      this.store.collections.organizations = [
        {
          id: defaultOrgId,
          name: "Customer Zero Workspace",
          owner_id: defaultOwnerId,
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (!this.store.collections.organization_members) {
      this.store.collections.organization_members = [
        {
          id: "mem_owner_main",
          org_id: defaultOrgId,
          user_id: defaultOwnerId,
          role: "owner",
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (!this.store.collections.profiles) {
      this.store.collections.profiles = [
        {
          id: defaultOwnerId,
          email: "demo@echoyourinfluence.com",
          referral_code: "ECHOVIP",
          referred_by: null,
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (!this.store.collections.subscriptions) {
      this.store.collections.subscriptions = [
        {
          id: "sub_demo_active",
          user_id: defaultOwnerId,
          tier: "pro",
          status: "active",
          stripe_customer_id: "cus_demo_zero",
          stripe_subscription_id: "sub_demo_zero",
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (!this.store.collections.usage_counters) {
      this.store.collections.usage_counters = [
        {
          id: "usage_demo_month",
          user_id: defaultOwnerId,
          month: new Date().toISOString().slice(0, 7),
          videos_generated: 4,
          images_generated: 8,
          broll_generated: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
  }

  private load() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        this.store = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[CloudStore] Failed to load disk snapshot, initializing memory store", e);
    }
    this.initDefaults();
    this.isLoaded = true;
  }

  private persist() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (e) {
      console.warn("[CloudStore] Failed to write disk snapshot", e);
    }
  }

  getCollection<T extends TableName>(table: T): Array<DatabaseSchema[T]> {
    this.load();
    if (!this.store.collections[table]) {
      this.store.collections[table] = [];
    }
    return (this.store.collections[table] as Array<DatabaseSchema[T]>) || [];
  }

  setCollection<T extends TableName>(table: T, items: Array<DatabaseSchema[T]>): void {
    this.load();
    this.store.collections[table] = items as unknown as Array<Record<string, unknown>>;
    this.persist();
  }

  // Storage Bucket management
  putStorage(bucket: string, storagePath: string, file: StorageFile): void {
    this.load();
    const key = `${bucket}/${storagePath}`;
    this.store.storage[key] = file;
    this.persist();
  }

  getStorage(bucket: string, storagePath: string): StorageFile | null {
    this.load();
    const key = `${bucket}/${storagePath}`;
    return this.store.storage[key] ?? null;
  }

  deleteStorage(bucket: string, storagePath: string): void {
    this.load();
    const key = `${bucket}/${storagePath}`;
    delete this.store.storage[key];
    this.persist();
  }

  // RPC procedures
  async executeRpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    this.load();
    const userId = (args._user_id || args.userId || "demo-user-id") as string;

    switch (name) {
      case "provision_personal_org": {
        const orgs = this.getCollection("organizations");
        const members = this.getCollection("organization_members");
        const existingMember = members.find((m) => m.user_id === userId);
        if (existingMember) return existingMember.org_id;

        const newOrgId = `org_${crypto.randomUUID()}`;
        const orgName = (args._name as string) || "My Workspace";
        orgs.push({
          id: newOrgId,
          name: orgName,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        members.push({
          id: `mem_${crypto.randomUUID()}`,
          org_id: newOrgId,
          user_id: userId,
          role: "owner",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        this.setCollection("organizations", orgs);
        this.setCollection("organization_members", members);
        return newOrgId;
      }

      case "consume_video_quota": {
        const counters = this.getCollection("usage_counters");
        const month = new Date().toISOString().slice(0, 7);
        let counter = counters.find((c) => c.user_id === userId && c.month === month);
        if (!counter) {
          counter = {
            id: `usage_${crypto.randomUUID()}`,
            user_id: userId,
            month,
            videos_generated: 0,
            images_generated: 0,
            broll_generated: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          counters.push(counter);
        }
        counter.videos_generated += 1;
        counter.updated_at = new Date().toISOString();
        this.setCollection("usage_counters", counters);
        return { ok: true, used: counter.videos_generated, limit: 100 };
      }

      case "consume_image_quota": {
        const count = typeof args._count === "number" ? args._count : 1;
        const counters = this.getCollection("usage_counters");
        const month = new Date().toISOString().slice(0, 7);
        let counter = counters.find((c) => c.user_id === userId && c.month === month);
        if (!counter) {
          counter = {
            id: `usage_${crypto.randomUUID()}`,
            user_id: userId,
            month,
            videos_generated: 0,
            images_generated: 0,
            broll_generated: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          counters.push(counter);
        }
        counter.images_generated += count;
        counter.updated_at = new Date().toISOString();
        this.setCollection("usage_counters", counters);
        return { ok: true, used: counter.images_generated, limit: 200 };
      }

      case "consume_broll_quota": {
        const counters = this.getCollection("usage_counters");
        const month = new Date().toISOString().slice(0, 7);
        let counter = counters.find((c) => c.user_id === userId && c.month === month);
        if (!counter) {
          counter = {
            id: `usage_${crypto.randomUUID()}`,
            user_id: userId,
            month,
            videos_generated: 0,
            images_generated: 0,
            broll_generated: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          counters.push(counter);
        }
        counter.broll_generated += 1;
        counter.updated_at = new Date().toISOString();
        this.setCollection("usage_counters", counters);
        return { ok: true, used: counter.broll_generated, limit: 50 };
      }

      case "release_image_quota": {
        const count = typeof args._count === "number" ? args._count : 1;
        const counters = this.getCollection("usage_counters");
        const month = new Date().toISOString().slice(0, 7);
        const counter = counters.find((c) => c.user_id === userId && c.month === month);
        if (counter && counter.images_generated >= count) {
          counter.images_generated -= count;
          counter.updated_at = new Date().toISOString();
          this.setCollection("usage_counters", counters);
        }
        return { ok: true };
      }

      case "release_broll_quota": {
        const counters = this.getCollection("usage_counters");
        const month = new Date().toISOString().slice(0, 7);
        const counter = counters.find((c) => c.user_id === userId && c.month === month);
        if (counter && counter.broll_generated >= 1) {
          counter.broll_generated -= 1;
          counter.updated_at = new Date().toISOString();
          this.setCollection("usage_counters", counters);
        }
        return { ok: true };
      }

      case "gen_referral_code": {
        return `ECHO-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      }

      case "resolve_affiliate_redirect": {
        const code = (args._code as string) || "";
        const links = this.getCollection("affiliate_links");
        const link = links.find((l) => l.short_code.toLowerCase() === code.toLowerCase());
        if (!link) return null;
        link.total_clicks = (link.total_clicks || 0) + 1;
        this.setCollection("affiliate_links", links);

        const clicks = this.getCollection("link_clicks");
        clicks.push({
          id: `click_${crypto.randomUUID()}`,
          link_id: link.id,
          referer: (args._referer as string) || null,
          user_agent: (args._user_agent as string) || null,
          ip_hash: null,
          created_at: new Date().toISOString(),
        });
        this.setCollection("link_clicks", clicks);
        return link.destination_url;
      }

      case "has_role": {
        const members = this.getCollection("organization_members");
        const role = args._role as string;
        const orgId = args._org as string;
        return members.some(
          (m) =>
            m.user_id === userId &&
            (m.role === role || m.role === "owner") &&
            (!orgId || m.org_id === orgId),
        );
      }

      case "is_org_member": {
        const members = this.getCollection("organization_members");
        const orgId = args._org as string;
        return members.some((m) => m.user_id === userId && m.org_id === orgId);
      }

      case "is_org_admin": {
        const members = this.getCollection("organization_members");
        const orgId = args._org as string;
        return members.some(
          (m) =>
            m.user_id === userId &&
            m.org_id === orgId &&
            (m.role === "admin" || m.role === "owner"),
        );
      }

      case "plan_limits": {
        const tier = (args._tier as string) || "starter";
        if (tier === "agency") return { videos: 100, images: 200, broll: 50 };
        if (tier === "pro") return { videos: 30, images: 60, broll: 15 };
        return { videos: 10, images: 20, broll: 5 };
      }

      default:
        return { ok: true };
    }
  }
}

export const cloudStore = new CloudStoreManager();
