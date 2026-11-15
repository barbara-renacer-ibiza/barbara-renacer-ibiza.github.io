import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { products, type InsertProduct, type Product } from "../drizzle/schema";
import { getSupabaseConfig, supabaseFetch } from "./_core/supabase";

export type ProductInput = Omit<InsertProduct, "id" | "slug" | "createdAt" | "updatedAt">;

function makeSlug(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "prodotto";
  return `${base}-${nanoid(6).toLowerCase()}`;
}

function supabaseEnabled() {
  return Boolean(getSupabaseConfig());
}

async function supabaseProducts(query: string) {
  const response = await supabaseFetch(`/rest/v1/products?select=*${query}`);
  if (!response.ok) throw new Error(`Supabase products request failed (${response.status})`);
  return await response.json() as Product[];
}

export async function listPublishedProducts() {
  if (supabaseEnabled()) return supabaseProducts("&isPublished=eq.1&order=createdAt.desc");
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isPublished, 1)).orderBy(desc(products.createdAt));
}

export async function listAllProducts() {
  if (supabaseEnabled()) return supabaseProducts("&order=createdAt.desc");
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function createProduct(input: ProductInput) {
  const slug = makeSlug(input.nameIt || input.nameEn || input.nameEs || "prodotto");
  if (supabaseEnabled()) {
    const response = await supabaseFetch("/rest/v1/products", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...input, slug }),
    });
    if (!response.ok) throw new Error(`Supabase product creation failed (${response.status})`);
    const created = await response.json() as Product[];
    return created[0];
  }
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(products).values({ ...input, slug });
  const created = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return created[0];
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  if (supabaseEnabled()) {
    const response = await supabaseFetch(`/rest/v1/products?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`Supabase product update failed (${response.status})`);
    const updated = await response.json() as Product[];
    return updated[0];
  }
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(products).set(input).where(eq(products.id, id));
  const updated = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return updated[0];
}

export async function deleteProduct(id: number) {
  if (supabaseEnabled()) {
    const response = await supabaseFetch(`/rest/v1/products?id=eq.${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Supabase product deletion failed (${response.status})`);
    return { success: true as const };
  }
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(products).where(eq(products.id, id));
  return { success: true as const };
}

export async function setProductPublished(id: number, isPublished: boolean) {
  return updateProduct(id, { isPublished: isPublished ? 1 : 0 });
}
