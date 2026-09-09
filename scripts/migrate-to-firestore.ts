// scripts/migrate-to-firestore.ts
// One-time migration: reads .cloud_db_store.json and writes all records to Firestore
// Run ONCE before deploying. Requires GOOGLE_APPLICATION_CREDENTIALS or gcloud auth

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

if (getApps().length === 0) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    "echo-your-influence15";
  initializeApp({ projectId });
}

const db = getFirestore();
const STORE_PATH = path.join(process.cwd(), ".cloud_db_store.json");

async function migrate() {
  if (!fs.existsSync(STORE_PATH)) {
    console.log("No .cloud_db_store.json found — nothing to migrate.");
    return;
  }
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  const store = JSON.parse(raw) as {
    collections: Record<string, Array<Record<string, unknown>>>;
    storage: Record<string, unknown>;
  };
  const BATCH_SIZE = 400;

  // Migrate collections
  for (const [tableName, records] of Object.entries(store.collections)) {
    if (!Array.isArray(records) || records.length === 0) continue;
    console.log(`Migrating ${tableName}: ${records.length} records...`);
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = db.batch();
      records.slice(i, i + BATCH_SIZE).forEach((record) => {
        const id = (record.id as string) || `migrated_${Date.now()}`;
        batch.set(db.collection(tableName).doc(id), { ...record, id });
      });
      await batch.commit();
    }
    console.log(` ✓ ${tableName} done`);
  }

  // Migrate storage metadata
  const storageEntries = Object.entries(store.storage);
  if (storageEntries.length > 0) {
    console.log(`Migrating storage: ${storageEntries.length} files...`);
    for (let i = 0; i < storageEntries.length; i += BATCH_SIZE) {
      const batch = db.batch();
      storageEntries.slice(i, i + BATCH_SIZE).forEach(([key, file]) => {
        const safeKey = key.replace(/\//g, "__");
        batch.set(db.collection("_storage").doc(safeKey), file as Record<string, unknown>);
      });
      await batch.commit();
    }
    console.log(" ✓ storage done");
  }

  console.log("\n✅ Migration complete. You can now deploy to Cloud Run.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
