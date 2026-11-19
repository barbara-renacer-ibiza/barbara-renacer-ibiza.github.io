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
- [ ] Pass `pnpm check`, `pnpm test`, and `pnpm build:static`; verify the plant route, public data reads, admin persistence paths, static bundle, image response and deployed GitHub Pages site.
- [x] Push the completed intended change to `origin/main`, wait for the Pages workflow, and confirm the deployed site works before marking these requested outcomes complete.

## Payment confirmation
- [ ] Do not state that the bank transfer succeeded: no bank record or payment evidence is available in this session. Ask the client to confirm through their bank if confirmation is required.
