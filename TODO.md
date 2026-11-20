# Renacer — Barbara Claps Ibiza

## Brand and existing storefront outcomes
- [x] Use confirmed project identity: Renacer, Barbara/Bárbara Claps, Ibiza; retain the existing Italian, English and Spanish storefront and the direct WhatsApp contact.
- [x] Keep product and article management in separate admin sections, categories independently manageable, product cards in a gallery, Nutrition articles on `/nutrition` with excerpts and “Learn more” links, and an admin logout control.
- [x] Keep admin access protected by the existing server-validated PIN session; never write PIN values into source control.
- [x] Keep existing live product, category and article records intact during the new work.

## Requested hero photo
- [x] Replace the homepage photo beside “Back to yourself slowly.” with the newly supplied client photo at `/home/ubuntu/upload/image-1.webp`, without editing or visually reopening the original; ensure it renders attractively and responsively on desktop and mobile.

## Product INCI
- [x] Add an optional INCI ingredients field for every product in the owner’s admin create/edit form; persist and reload it for existing/new products without breaking other product fields.
- [x] Show a clear, expandable INCI ingredients section on public product cards only when a formula exists; preserve the entered INCI list without translating ingredient names.
- [x] Do not invent or infer an INCI formula: leave it empty unless already explicitly present in the product data or entered by the owner.

## Plants and raw materials
- [x] Add a browsable `/plants` section inspired by `https://barbara-botanica-ibiza.foldedrice.chatgpt.site/`, listing plants/raw materials with translated names, careful descriptions of cosmetic-context properties, source links where the reference supplies exact URLs, and relevant safety notes.
- [x] Keep public content in Italian, English and Spanish and make the section reachable from the main navigation and footer.
- [x] Add an owner-editable plants/materials catalogue and product-to-material assignments in dedicated admin controls; allow the owner to enter/edit localized names, properties, source URL and caution text.
- [x] On each published product, show links to the materials explicitly assigned to it; on each material entry, show links to published products explicitly assigned to it. Keep unconfirmed product-material links unassigned until the owner verifies them.
- [x] Do not make medical/treatment claims; retain source-supported safety cautions, including hypericum/UV exposure, potential allergens, and burns/wounds.

## Production integrity and delivery
- [x] Apply an additive Supabase migration for nullable product INCI and botanical/material data with appropriate public-read policies; preserve all current production rows and media.
- [x] Extend the existing `renacer-admin` Edge Function without weakening PIN/session checks, and keep the current admin product/category/article/settings flows working.
- [x] Keep `client/public/manus-routes.json` synchronized with `/plants`.
- [x] For Plants, let the owner upload an image file rather than paste a URL; enter names, descriptions and cautions in Italian only and translate them automatically to English and Spanish on save.
- [x] Pass `pnpm check`, `pnpm test` (6 tests), and `pnpm build:static`; verify `/plants` serves HTTP 200 directly, the 26-item public guide works, and a disposable admin entry saves uploaded imagery plus translated names, descriptions and cautions in English and Spanish; remove the test database row afterward.
- [x] Push the completed intended change to `origin/main`, wait for the Pages workflow, and confirm the deployed site works before marking these requested outcomes complete.

## Barbara follow-up notes (2026-11-20)
- [x] Shorten the homepage into a brand landing page with an introduction, photos, selected sections and clear links to a separate Catalogue; do not show the complete product set on Home. Reduce card/image footprint, show more products per row and per page, and keep spacing and layout comfortable and consistent on desktop and mobile.
- [x] Repair the Nutrition section route and show only published nutrition articles there; keep all five existing unpublished/test articles as drafts pending Barbara’s approval. No draft was published or otherwise altered.
- [x] Add editable Facebook and Instagram page URLs in the protected admin dashboard; Barbara can select and change her exact Facebook page, and configured icons/links appear publicly. The settings remain blank until she chooses the official profiles.
- [x] Add the separate public Artisans section and a validated submission form for product photos, descriptions, prices and contact details; new requests are Pending and not publicly readable before approval.
- [x] Add protected Artisan Submissions moderation: edit details, persist correction notes consistently, approve/reject, and permanently remove a request and its associated private/public images. Decisions remain with Barbara; disposable workflow tests were deleted after verification.
- [x] Add stable per-item routes and share controls for published Catalogue products, Nutrition articles and plants, including WhatsApp/Facebook sharing and copy-link; prerender unique canonical/Open Graph metadata where static hosting supports it.
- [x] Preserve production content and identity: existing 18 products, 16 categories, 5 draft articles, 26 plant materials and 62 product-material links remained unchanged; no duplicate or non-test product data was added. Responsive styles and navigation were built for desktop/mobile.

## Follow-up production verification (2026-11-20)
- [x] Apply the additive `site_settings_and_artisan_submissions` migration and the additive rate-limit identity primary key; verify the submissions bucket is private, contact/moderation columns are excluded from public grants, and only approved submissions are publicly selectable.
- [x] Deploy `renacer-admin` to `dybqvnthmfeatwfpysrv` with `verify_jwt=false`; the function permits public access only to the validated/rate-limited submission path and retains PIN-session checks for dashboard actions. The existing `ADMIN_PIN` secret was not changed.
- [x] Test live admin login/list (18 products, 5 draft articles, 0 submissions), verify invalid-session writes return 401, then submit synthetic requests through Pending → correction → approval and Pending → rejection; confirm public visibility rules and image availability; delete both test records and private/public images and remove exactly the three test quota entries.
- [x] Pass `pnpm check`, `pnpm test` (6 tests), `pnpm build:static`, `node --check scripts/prerender-public-routes.mjs`, and `git diff --check`; prerender 46 published routes with metadata. Vite reports only the existing non-module script notice and a large-chunk advisory.
- [ ] Push the completed changes to `origin/main`, wait for GitHub Pages deployment, then verify live URLs and social-preview metadata.

## Payment confirmation
- [ ] Do not state that the bank transfer succeeded: no bank record or payment evidence is available in this session. Ask the client to confirm through their bank if confirmation is required.
