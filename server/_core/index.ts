import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { randomUUID } from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { invokeLLM } from "./llm";
import { clearAdminPinSession, isAdminPinSession, isValidAdminPin, setAdminPinSession } from "./adminPin";
import { checkSupabaseConnection } from "./supabase";
import { storagePut } from "../storage";
import { decodeProductImageDataUrl, ProductImageUploadError } from "./productImage";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/supabase/health", async (_req, res) => res.json(await checkSupabaseConnection()));
  app.get("/api/admin/session", (req, res) => res.json({ unlocked: isAdminPinSession(req) }));
  app.post("/api/admin/unlock", (req, res) => {
    if (!isValidAdminPin(req.body?.pin)) return res.status(401).json({ error: "PIN non valido." });
    setAdminPinSession(res, req);
    return res.json({ unlocked: true });
  });
  app.post("/api/admin/lock", (req, res) => {
    clearAdminPinSession(res, req);
    return res.json({ unlocked: false });
  });
  app.post("/api/admin/upload-image", async (req, res) => {
    if (!isAdminPinSession(req)) return res.status(401).json({ error: "Sessione amministrativa non valida." });

    let image: ReturnType<typeof decodeProductImageDataUrl>;
    try {
      image = decodeProductImageDataUrl(req.body?.dataUrl);
    } catch (error) {
      if (error instanceof ProductImageUploadError) return res.status(error.status).json({ error: error.message });
      return res.status(400).json({ error: "Formato immagine non supportato." });
    }

    try {
      const uploaded = await storagePut(`products/${randomUUID()}.${image.extension}`, image.bytes, image.contentType);
      return res.json({ url: uploaded.url });
    } catch (error) {
      console.error("[Admin image upload] Failed:", error);
      return res.status(502).json({ error: "Caricamento immagine non riuscito. Riprova." });
    }
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  app.get("/api/locale", async (req, res) => {
    const forwarded = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    const proxyCountry = String(req.headers["cf-ipcountry"] ?? req.headers["x-country-code"] ?? "").toUpperCase();
    const ip = forwarded || req.socket.remoteAddress || "";
    const isPrivateIp = ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.") || ip === "::1" || ip.startsWith("::ffff:127.");
    const countryLanguage: Record<string, "it" | "en" | "es"> = { IT: "it", ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", US: "en", GB: "en", IE: "en", AU: "en", CA: "en" };
    if (proxyCountry && proxyCountry !== "XX") return res.json({ country: proxyCountry, language: countryLanguage[proxyCountry] ?? null });
    try {
      const geoResponse = await fetch(isPrivateIp ? "https://ipapi.co/json/" : `https://ipapi.co/${ip}/json/`);
      const geo = await geoResponse.json() as { country_code?: string };
      const country = geo.country_code?.toUpperCase() ?? "";
      return res.json({ country, language: countryLanguage[country] ?? null });
    } catch {
      return res.json({ country: null, language: null });
    }
  });
  app.post("/api/translate", async (req, res) => {
    if (!isAdminPinSession(req)) return res.status(401).json({ error: "Sessione amministrativa non valida." });
    const sourceLanguage = ["it", "en", "es"].includes(req.body?.sourceLanguage) ? req.body.sourceLanguage : "it";
    const sourceName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const sourceDescription = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    if (!sourceName || !sourceDescription || sourceName.length > 180 || sourceDescription.length > 10000) {
      return res.status(400).json({ error: "Inserisci nome e descrizione validi." });
    }

    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        maxTokens: 1200,
        messages: [
          {
            role: "system",
            content: "You are a careful product copy translator for a small botanical artisan project. Translate the provided product name and description from the source language into Italian, English and Spanish. Preserve meaning, ingredients, quantities, cautions and paragraph breaks. Do not invent benefits, medical claims, ingredients or marketing promises. Keep the source language text unchanged. Return only valid JSON with exactly three fields: it, en and es; each field has name and description strings.",
          },
          { role: "user", content: JSON.stringify({ sourceLanguage, name: sourceName, description: sourceDescription }) },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "product_translations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                it: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"], additionalProperties: false },
                en: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"], additionalProperties: false },
                es: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"], additionalProperties: false },
              },
              required: ["it", "en", "es"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = result.choices?.[0]?.message?.content;
      const raw = Array.isArray(content) ? content.map(part => part.type === "text" ? part.text : "").join("") : content;
      if (!raw) throw new Error("Empty translation response");
      const parsed = JSON.parse(raw);
      if (!parsed.it?.name || !parsed.en?.name || !parsed.es?.name) throw new Error("Invalid translation response");
      return res.json(parsed);
    } catch (error) {
      console.error("[Translation] Failed:", error);
      return res.status(502).json({ error: "La traduzione automatica non è disponibile in questo momento." });
    }
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
