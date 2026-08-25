import crypto from "node:crypto";
import { cloudStore } from "./store.server";
import type { DatabaseSchema, TableName } from "./types";

export interface QueryFilter {
  field: string;
  operator: "eq" | "neq" | "in" | "gt" | "gte" | "lt" | "lte";
  value: unknown;
}

export interface QueryOrder {
  field: string;
  ascending: boolean;
}

export class ServerQueryBuilder<T extends TableName, R = DatabaseSchema[T]> {
  private filters: QueryFilter[] = [];
  private orderFields: QueryOrder[] = [];
  private limitCount?: number;
  private selectFields?: string;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(
    private table: T,
    private mutation?: {
      type: "insert" | "update" | "delete" | "upsert";
      payload?: unknown;
    },
  ) {}

  select(fields = "*"): this {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: unknown): this {
    this.filters.push({ field, operator: "eq", value });
    return this;
  }

  neq(field: string, value: unknown): this {
    this.filters.push({ field, operator: "neq", value });
    return this;
  }

  in(field: string, values: unknown[]): this {
    this.filters.push({ field, operator: "in", value: values });
    return this;
  }

  gt(field: string, value: unknown): this {
    this.filters.push({ field, operator: "gt", value });
    return this;
  }

  gte(field: string, value: unknown): this {
    this.filters.push({ field, operator: "gte", value });
    return this;
  }

  lt(field: string, value: unknown): this {
    this.filters.push({ field, operator: "lt", value });
    return this;
  }

  lte(field: string, value: unknown): this {
    this.filters.push({ field, operator: "lte", value });
    return this;
  }

  order(field: string, opts: { ascending?: boolean } = { ascending: true }): this {
    this.orderFields.push({ field, ascending: opts.ascending ?? true });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): Promise<{ data: R | null; error: Error | null }> {
    this.isSingle = true;
    return this.execute() as Promise<{ data: R | null; error: Error | null }>;
  }

  maybeSingle(): Promise<{ data: R | null; error: Error | null }> {
    this.isMaybeSingle = true;
    return this.execute() as Promise<{ data: R | null; error: Error | null }>;
  }

  // Thenable execution for direct await
  then<TResult1 = { data: R[] | R | null; error: Error | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: R[] | R | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected);
  }

  private applyFilters(items: any[]): any[] {
    return items.filter((item) => {
      for (const f of this.filters) {
        const itemVal = item[f.field];
        if (f.operator === "eq" && itemVal !== f.value) return false;
        if (f.operator === "neq" && itemVal === f.value) return false;
        if (f.operator === "in" && Array.isArray(f.value) && !f.value.includes(itemVal))
          return false;
        if (f.operator === "gt" && !(itemVal > (f.value as any))) return false;
        if (f.operator === "gte" && !(itemVal >= (f.value as any))) return false;
        if (f.operator === "lt" && !(itemVal < (f.value as any))) return false;
        if (f.operator === "lte" && !(itemVal <= (f.value as any))) return false;
      }
      return true;
    });
  }

  private applyJoins(items: any[]): any[] {
    if (!this.selectFields) return items;

    // Expand joins if select includes relations like products(*) or personas(*)
    if (this.selectFields.includes("products(")) {
      const allProducts = cloudStore.getCollection("products");
      items = items.map((item) => {
        const product = allProducts.find((p) => p.id === item.product_id) || null;
        return { ...item, products: product };
      });
    }
    if (this.selectFields.includes("personas(")) {
      const allPersonas = cloudStore.getCollection("personas");
      items = items.map((item) => {
        const persona = allPersonas.find((p) => p.id === item.persona_id) || null;
        return { ...item, personas: persona };
      });
    }
    return items;
  }

  private async execute(): Promise<{ data: any; error: Error | null }> {
    try {
      let items = [...cloudStore.getCollection(this.table)];

      // 1. Mutation: INSERT
      if (this.mutation?.type === "insert") {
        const payload = Array.isArray(this.mutation.payload)
          ? this.mutation.payload
          : [this.mutation.payload];

        const insertedItems: any[] = [];
        for (const raw of payload) {
          const item = {
            id: raw.id || crypto.randomUUID(),
            created_at: raw.created_at || new Date().toISOString(),
            updated_at: raw.updated_at || new Date().toISOString(),
            ...raw,
          };
          items.push(item);
          insertedItems.push(item);
        }
        cloudStore.setCollection(this.table, items);

        if (this.isSingle || this.isMaybeSingle) {
          return { data: insertedItems[0] || null, error: null };
        }
        return {
          data: Array.isArray(this.mutation.payload) ? insertedItems : insertedItems[0],
          error: null,
        };
      }

      // 2. Mutation: UPDATE
      if (this.mutation?.type === "update") {
        const updateData = (this.mutation.payload || {}) as Record<string, unknown>;
        let updatedCount = 0;
        const updatedList: any[] = [];

        items = items.map((item) => {
          let match = true;
          for (const f of this.filters) {
            if (f.operator === "eq" && item[f.field] !== f.value) match = false;
          }
          if (match) {
            updatedCount++;
            const updated = { ...item, ...updateData, updated_at: new Date().toISOString() };
            updatedList.push(updated);
            return updated;
          }
          return item;
        });

        cloudStore.setCollection(this.table, items);
        if (this.isSingle || this.isMaybeSingle) {
          return { data: updatedList[0] || null, error: null };
        }
        return { data: updatedList, error: null };
      }

      // 3. Mutation: DELETE
      if (this.mutation?.type === "delete") {
        const beforeLen = items.length;
        items = items.filter((item) => {
          for (const f of this.filters) {
            if (f.operator === "eq" && item[f.field] === f.value) return false;
          }
          return true;
        });
        cloudStore.setCollection(this.table, items);
        return { data: { count: beforeLen - items.length }, error: null };
      }

      // 4. Mutation: UPSERT
      if (this.mutation?.type === "upsert") {
        const rawPayload = Array.isArray(this.mutation.payload)
          ? this.mutation.payload
          : [this.mutation.payload];

        for (const raw of rawPayload) {
          const idx = items.findIndex(
            (i) => (raw.id && i.id === raw.id) || (raw.user_id && i.user_id === raw.user_id),
          );
          if (idx >= 0) {
            items[idx] = { ...items[idx], ...raw, updated_at: new Date().toISOString() };
          } else {
            items.push({
              id: raw.id || crypto.randomUUID(),
              created_at: raw.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...raw,
            });
          }
        }
        cloudStore.setCollection(this.table, items);
        return { data: this.mutation.payload, error: null };
      }

      // 5. Query: SELECT
      let filtered = this.applyFilters(items);

      for (const ord of this.orderFields) {
        filtered.sort((a, b) => {
          const va = a[ord.field];
          const vb = b[ord.field];
          if (va < vb) return ord.ascending ? -1 : 1;
          if (va > vb) return ord.ascending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount) {
        filtered = filtered.slice(0, this.limitCount);
      }

      filtered = this.applyJoins(filtered);

      if (this.isSingle) {
        return {
          data: filtered[0] || null,
          error: filtered[0] ? null : new Error("Record not found"),
        };
      }
      if (this.isMaybeSingle) {
        return { data: filtered[0] || null, error: null };
      }

      return { data: filtered, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
}

export class GoogleCloudAdminClient {
  from<T extends TableName>(table: T) {
    return {
      select: (fields?: string) => new ServerQueryBuilder<T>(table).select(fields),
      insert: (payload: unknown) => new ServerQueryBuilder<T>(table, { type: "insert", payload }),
      update: (payload: unknown) => new ServerQueryBuilder<T>(table, { type: "update", payload }),
      delete: () => new ServerQueryBuilder<T>(table, { type: "delete" }),
      upsert: (payload: unknown) => new ServerQueryBuilder<T>(table, { type: "upsert", payload }),
    };
  }

  async rpc(
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<{ data: any; error: Error | null }> {
    try {
      const result = await cloudStore.executeRpc(name, args);
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  get storage() {
    return {
      from: (bucket: string) => ({
        upload: async (
          filePath: string,
          fileBody: ArrayBuffer | Buffer | string,
          options?: { contentType?: string },
        ) => {
          try {
            const dataUrl =
              typeof fileBody === "string" && fileBody.startsWith("data:")
                ? fileBody
                : `data:${options?.contentType || "application/octet-stream"};base64,${Buffer.from(fileBody as any).toString("base64")}`;
            cloudStore.putStorage(bucket, filePath, {
              name: filePath.split("/").pop() || "file",
              bucket,
              storagePath: filePath,
              dataUrl,
              contentType: options?.contentType || "application/octet-stream",
              size: dataUrl.length,
              created_at: new Date().toISOString(),
            });
            return { data: { path: filePath }, error: null };
          } catch (err) {
            return { data: null, error: err as Error };
          }
        },
        createSignedUrl: async (filePath: string, _expiresInSeconds = 3600) => {
          const file = cloudStore.getStorage(bucket, filePath);
          const url = file?.dataUrl || `/api/cloud/storage/${bucket}/${filePath}`;
          return { data: { signedUrl: url }, error: null };
        },
        getPublicUrl: (filePath: string) => {
          const file = cloudStore.getStorage(bucket, filePath);
          return {
            data: { publicUrl: file?.dataUrl || `/api/cloud/storage/${bucket}/${filePath}` },
          };
        },
        remove: async (paths: string[]) => {
          for (const p of paths) {
            cloudStore.deleteStorage(bucket, p);
          }
          return { data: { paths }, error: null };
        },
      }),
    };
  }
}

export const cloudAdmin = new GoogleCloudAdminClient();
// Backward-compatible alias for any legacy imports during migration
export const supabaseAdmin = cloudAdmin;
