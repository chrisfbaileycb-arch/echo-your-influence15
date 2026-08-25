import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/lib/cloud/auth-middleware";
import { newShortCode } from "./short-code";

const ProgramInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  network: z.string().min(1).max(80),
  tracking_id: z.string().min(1).max(120),
  link_template: z.string().min(4).max(1000),
  notes: z.string().max(2000).optional(),
});

export const listPrograms = createServerFn({ method: "GET" })
  .middleware([requireCloudAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.cloud
      .from("affiliate_programs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProgram = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) => ProgramInput.parse(d))
  .handler(async ({ data, context }) => {
    const { cloud, userId } = context;
    if (data.id) {
      const { data: row, error } = await cloud
        .from("affiliate_programs")
        .update({ ...data, user_id: userId })
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await cloud
      .from("affiliate_programs")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProgram = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.cloud.from("affiliate_programs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Build the destination URL by applying a template.
// Supported placeholders: {url}, {tracking_id}
function applyTemplate(template: string, productUrl: string, trackingId: string): string {
  return template
    .replace(/\{url\}/g, encodeURIComponent(productUrl))
    .replace(/\{tracking_id\}/g, trackingId);
}

export const createShortLink = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        product_id: z.string().uuid(),
        affiliate_program_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { cloud, userId } = context;
    const { data: product, error: pe } = await cloud
      .from("products")
      .select("source_url")
      .eq("id", data.product_id)
      .maybeSingle();
    if (pe || !product) throw new Error("Product not found");

    let destination = product.source_url;
    if (data.affiliate_program_id) {
      const { data: prog } = await cloud
        .from("affiliate_programs")
        .select("link_template, tracking_id")
        .eq("id", data.affiliate_program_id)
        .maybeSingle();
      if (prog)
        destination = applyTemplate(prog.link_template, product.source_url, prog.tracking_id);
    }

    const short_code = newShortCode();
    const { data: row, error } = await cloud
      .from("affiliate_links")
      .insert({
        user_id: userId,
        product_id: data.product_id,
        affiliate_program_id: data.affiliate_program_id ?? null,
        short_code,
        destination_url: destination,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listLinksForProduct = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.cloud
      .from("affiliate_links")
      .select("*")
      .eq("product_id", data.product_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
