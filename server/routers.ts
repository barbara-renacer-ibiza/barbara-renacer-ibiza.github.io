import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createProduct, deleteProduct, listAllProducts, listPublishedProducts, setProductPublished, updateProduct } from "./products";

const productFields = {
  sourceLanguage: z.enum(["it", "en", "es"]),
  nameIt: z.string().trim().min(1).max(180),
  descriptionIt: z.string().trim().min(1).max(10000),
  nameEn: z.string().trim().max(180).nullable().optional(),
  descriptionEn: z.string().trim().max(10000).nullable().optional(),
  nameEs: z.string().trim().max(180).nullable().optional(),
  descriptionEs: z.string().trim().max(10000).nullable().optional(),
  priceCents: z.number().int().min(0).max(10000000),
  currency: z.string().trim().length(3).default("EUR"),
  imageUrl: z.string().trim().url().max(512).nullable().optional(),
  whatsappMessage: z.string().trim().max(1000).nullable().optional(),
  isPublished: z.number().int().min(0).max(1).default(1),
};

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  products: router({
    list: publicProcedure.query(() => listPublishedProducts()),
    admin: router({
      list: adminProcedure.query(() => listAllProducts()),
      create: adminProcedure.input(z.object(productFields)).mutation(({ input }) => createProduct(input)),
      update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: z.object(productFields).partial() })).mutation(({ input }) => updateProduct(input.id, input.data)),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteProduct(input.id)),
      publish: adminProcedure.input(z.object({ id: z.number().int().positive(), isPublished: z.boolean() })).mutation(({ input }) => setProductPublished(input.id, input.isPublished)),
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
