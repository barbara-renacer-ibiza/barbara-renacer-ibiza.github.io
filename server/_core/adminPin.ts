import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";

export const ADMIN_PIN_COOKIE = "renacer_admin_session";
const SESSION_VALUE = "renacer-admin-v1";
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

function configuredPin() {
  return process.env.ADMIN_PIN?.trim() ?? "";
}

function sessionToken() {
  return crypto.createHmac("sha256", configuredPin()).update(SESSION_VALUE).digest("hex");
}

function cookieValue(req: Request) {
  const raw = req.headers.cookie ?? "";
  const entry = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_PIN_COOKIE}=`));
  return entry?.slice(ADMIN_PIN_COOKIE.length + 1) ?? "";
}

export function isAdminPinSession(req: Request) {
  const current = cookieValue(req);
  const expected = sessionToken();
  if (!configuredPin() || current.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(current), Buffer.from(expected));
}

export function isValidAdminPin(pin: unknown) {
  if (typeof pin !== "string" || !configuredPin()) return false;
  const current = Buffer.from(pin.trim());
  const expected = Buffer.from(configuredPin());
  return current.length === expected.length && crypto.timingSafeEqual(current, expected);
}

export function setAdminPinSession(res: Response, req: Request) {
  const isPublicHttps = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim() === "https";
  const cookieOptions = isPublicHttps ? getSessionCookieOptions(req) : { httpOnly: true, path: "/", sameSite: "lax" as const, secure: false };
  res.cookie(ADMIN_PIN_COOKIE, sessionToken(), { ...cookieOptions, maxAge: SESSION_MAX_AGE });
}

export function clearAdminPinSession(res: Response, req: Request) {
  const isPublicHttps = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim() === "https";
  const cookieOptions = isPublicHttps ? getSessionCookieOptions(req) : { httpOnly: true, path: "/", sameSite: "lax" as const, secure: false };
  res.clearCookie(ADMIN_PIN_COOKIE, cookieOptions);
}
