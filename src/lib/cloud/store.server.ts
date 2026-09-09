// src/lib/cloud/store.server.ts
// Firestore-backed replacement for the local JSON store.
// Public API is identical to the original CloudStoreManager.

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, type Firestore, FieldValue } from "firebase-admin/firestore";
import crypto from "node:crypto";
import type { DatabaseSchema, TableName } from "./types";

// ─── Firebase Initialization ─────────────────────────────────────────────────
// On Cloud Run, initializeApp() with no arguments uses Application Default
// Credentials automatically. No service account key file is needed. [2]
if (getApps().length === 0) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    "echo-your-influence15";
  initializeApp({
    projectId,
  });
}

const db: Firestore = getFirestore();
export const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "echo-your-influence15";

// ─── Storage File Interface ──────────────────────────────────────────────────
export interface StorageFile {
  name: string;
  bucket: string;
  storagePath: string;
  dataUrl: string;
  contentType: string;
  size: number;
  created_at: string;
}

// ─── Collection Path Helper ──────────────────────────────────────────────────
// Each TableName maps to a top-level Firestore collection.
// Documents use the record's `id` field as the Firestore document ID.
function col(table: TableName) {
  return db.collection(table);
}

// ─── CloudStoreManager ───────────────────────────────────────────────────────
class CloudStoreManager {
  // ── Seed default documents on first run ──────────────────────────────────
  async initDefaults(): Promise<void> {
    const defaultOrgId = "org_customer_zero_main";
    const defaultOwnerId = "demo-user-id";

    const orgRef = col("organizations").doc(defaultOrgId);
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) {
      await orgRef.set({
        id: defaultOrgId,
        name: "Customer Zero Workspace",
        owner_id: defaultOwnerId,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const memRef = col("organization_members").doc("mem_owner_main");
    const memSnap = await memRef.get();
    if (!memSnap.exists) {
      await memRef.set({
        id: "mem_owner_main",
        org_id: defaultOrgId,
        user_id: defaultOwnerId,
        role: "owner",
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const profileRef = col("profiles").doc(defaultOwnerId);
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
      await profileRef.set({
        id: defaultOwnerId,
        email: "demo@echoyourinfluence.com",
        referral_code: "ECHOVIP",
        referred_by: null,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const subRef = col("subscriptions").doc("sub_demo_active");
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      await subRef.set({
        id: "sub_demo_active",
        user_id: defaultOwnerId,
        tier: "pro",
        status: "active",
        stripe_customer_id: "cus_demo_zero",
        stripe_subscription_id: "sub_demo_zero",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // ── Read all documents in a collection ───────────────────────────────────
  async getCollection<T extends TableName>(table: T): Promise<Array<DatabaseSchema[T]>> {
    const snap = await col(table).get();
    return snap.docs.map((d) => d.data() as DatabaseSchema[T]);
  }

  // ── Overwrite an entire collection (used by the query builder) ────────────
  async setCollection<T extends TableName>(
    table: T,
    items: Array<DatabaseSchema[T]>,
  ): Promise<void> {
    // Firestore batch writes are limited to 500 operations per batch.
    const BATCH_SIZE = 400;
    const existingSnap = await col(table).get();

    // Delete all existing documents first
    for (let i = 0; i < existingSnap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      existingSnap.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Write new documents
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = db.batch();
      items.slice(i, i + BATCH_SIZE).forEach((item) => {
        const record = item as Record<string, unknown>;
        const docId = (record.id as string) || crypto.randomUUID();
        batch.set(col(table).doc(docId), { ...record, id: docId });
      });
      await batch.commit();
    }
  }

  // ── Upsert a single document by ID (more efficient than setCollection) ────
  async upsertDoc<T extends TableName>(
    table: T,
    id: string,
    data: Partial<DatabaseSchema[T]>,
  ): Promise<void> {
    await col(table)
      .doc(id)
      .set({ ...data, id, updated_at: new Date().toISOString() }, { merge: true });
  }

  // ── Delete a single document ──────────────────────────────────────────────
  async deleteDoc(table: TableName, id: string): Promise<void> {
    await col(table).doc(id).delete();
  }

  // ── Storage: store file metadata in a dedicated collection ───────────────
  async putStorage(bucket: string, storagePath: string, file: StorageFile): Promise<void> {
    const key = `${bucket}__${storagePath.replace(/\//g, "__")}`;
    await db.collection("_storage").doc(key).set(file);
  }

  async getStorage(bucket: string, storagePath: string): Promise<StorageFile | null> {
    const key = `${bucket}__${storagePath.replace(/\//g, "__")}`;
    const snap = await db.collection("_storage").doc(key).get();
    return snap.exists ? (snap.data() as StorageFile) : null;
  }

  async deleteStorage(bucket: string, storagePath: string): Promise<void> {
    const key = `${bucket}__${storagePath.replace(/\//g, "__")}`;
    await db.collection("_storage").doc(key).delete();
  }

  // ── RPC procedures ────────────────────────────────────────────────────────
  async executeRpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const userId = (args._user_id || args.userId || "demo-user-id") as string;

    switch (name) {
      case "provision_personal_org": {
        const membersSnap = await col("organization_members")
          .where("user_id", "==", userId)
          .limit(1)
          .get();
        if (!membersSnap.empty) return membersSnap.docs[0].data().org_id;

        const newOrgId = `org_${crypto.randomUUID()}`;
        const orgName = (args._name as string) || "My Workspace";
        const batch = db.batch();
        batch.set(col("organizations").doc(newOrgId), {
          id: newOrgId,
          name: orgName,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const memId = `mem_${crypto.randomUUID()}`;
        batch.set(col("organization_members").doc(memId), {
          id: memId,
          org_id: newOrgId,
          user_id: userId,
          role: "owner",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await batch.commit();
        return newOrgId;
      }

      case "consume_video_quota":
        return this._incrementQuota(userId, "videos_generated", 1, 100);

      case "consume_image_quota": {
        const count = typeof args._count === "number" ? args._count : 1;
        return this._incrementQuota(userId, "images_generated", count, 200);
      }

      case "consume_broll_quota":
        return this._incrementQuota(userId, "broll_generated", 1, 50);

      case "release_image_quota": {
        const count = typeof args._count === "number" ? args._count : 1;
        return this._decrementQuota(userId, "images_generated", count);
      }

      case "release_broll_quota":
        return this._decrementQuota(userId, "broll_generated", 1);

      case "gen_referral_code":
        return `ECHO-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      case "resolve_affiliate_redirect": {
        const code = (args._code as string) || "";
        const linksSnap = await col("affiliate_links")
          .where("short_code", "==", code)
          .limit(1)
          .get();
        if (linksSnap.empty) return null;

        const linkDoc = linksSnap.docs[0];
        const link = linkDoc.data();
        await linkDoc.ref.update({
          total_clicks: FieldValue.increment(1),
          updated_at: new Date().toISOString(),
        });

        const clickId = `click_${crypto.randomUUID()}`;
        await col("link_clicks")
          .doc(clickId)
          .set({
            id: clickId,
            link_id: link.id,
            referer: (args._referer as string) || null,
            user_agent: (args._user_agent as string) || null,
            ip_hash: null,
            created_at: new Date().toISOString(),
          });
        return link.destination_url;
      }

      case "has_role": {
        const role = args._role as string;
        const orgId = args._org as string;
        const snap = await col("organization_members").where("user_id", "==", userId).get();
        return snap.docs.some((d) => {
          const m = d.data();
          return (m.role === role || m.role === "owner") && (!orgId || m.org_id === orgId);
        });
      }

      case "is_org_member": {
        const orgId = args._org as string;
        const snap = await col("organization_members")
          .where("user_id", "==", userId)
          .where("org_id", "==", orgId)
          .limit(1)
          .get();
        return !snap.empty;
      }

      case "is_org_admin": {
        const orgId = args._org as string;
        const snap = await col("organization_members")
          .where("user_id", "==", userId)
          .where("org_id", "==", orgId)
          .get();
        return snap.docs.some((d) => ["admin", "owner"].includes(d.data().role));
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

  // ── Quota helpers ─────────────────────────────────────────────────────────
  private async _incrementQuota(
    userId: string,
    field: string,
    delta: number,
    limit: number,
  ): Promise<unknown> {
    const month = new Date().toISOString().slice(0, 7);
    const snap = await col("usage_counters")
      .where("user_id", "==", userId)
      .where("month", "==", month)
      .limit(1)
      .get();

    if (snap.empty) {
      const id = `usage_${crypto.randomUUID()}`;
      await col("usage_counters")
        .doc(id)
        .set({
          id,
          user_id: userId,
          month,
          videos_generated: 0,
          images_generated: 0,
          broll_generated: 0,
          [field]: delta,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      return { ok: true, used: delta, limit };
    }

    const doc = snap.docs[0];
    await doc.ref.update({
      [field]: FieldValue.increment(delta),
      updated_at: new Date().toISOString(),
    });
    const updated = (await doc.ref.get()).data()!;
    return { ok: true, used: updated[field], limit };
  }

  private async _decrementQuota(userId: string, field: string, delta: number): Promise<unknown> {
    const month = new Date().toISOString().slice(0, 7);
    const snap = await col("usage_counters")
      .where("user_id", "==", userId)
      .where("month", "==", month)
      .limit(1)
      .get();

    if (!snap.empty) {
      await snap.docs[0].ref.update({
        [field]: FieldValue.increment(-delta),
        updated_at: new Date().toISOString(),
      });
    }
    return { ok: true };
  }
}

export const cloudStore = new CloudStoreManager();

// Seed default data on module load (runs once per cold start)
cloudStore.initDefaults().catch((e) => console.warn("[CloudStore] initDefaults failed:", e));
