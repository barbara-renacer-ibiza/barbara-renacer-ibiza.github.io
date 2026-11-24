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

## Homepage adjustments requested (2026-11-20)
- [x] Temporarily hide the homepage section titled “Segui il ritmo di Renacer” in Italian (and its corresponding English and Spanish versions); keep its social configuration/data intact and make the section easy to restore.
- [x] Place the homepage Nutrition section immediately after the product/collection section.
- [x] Remove the three homepage value cards titled “Personale”, “Essenziale” and “In ascolto” (including their English and Spanish equivalents); do not alter other homepage content.

## Homepage imagery and Plants emblem requested (2026-11-20)
- [x] Add a distinct, polished lifestyle photograph relevant to food, botanicals and the “Care is also connected to what we eat” homepage Nutrition section; match the warm editorial feel of the existing hero photograph.
- [x] Add a separate, polished seasonal-gifting / handmade botanical skincare photograph for the “Small rituals, as an offering” section; match the same visual identity without inventing product labels or text.
- [x] Show the same botanical Renacer emblem used in the Nutrition page hero in the Plants page hero, so the brand mark is present there as requested; preserve the existing header/logo and page content.
- [x] Keep both images as separate responsive website assets and preserve all Supabase records and existing production content.

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

## Client notes — homepage, nutrition and image framing (2026-11-22)
- [x] Keep `Renacer Ibiza`, use the Italian subtitle `Cura personale artigianale`, and make the logo more visible by reusing it in the Nutrition visual.
- [x] Order the homepage so the opening comes first, then `La cura della pelle passa anche da ciò che mangiamo` and the Nutrition section, followed by `Scopri la collezione` and catalogue links.
- [x] Replace the unnatural personal-section ending `arriva alla fine...` with an Italian phrase describing the person bringing Renacer to life; update the contact copy to cover holistic nutrition, detox meetings, products, availability and markets.
- [x] Add a combined hero image using the existing Renacer/Ibiza skincare composition with figs, pomegranate, avocado and other fresh produce; keep the real products and place recognizable and avoid invented people or labels.
- [x] In Admin product, article and raw-material image forms, provide a catalogue-matched live preview, direct drag positioning, horizontal/vertical framing and zoom controls with reset; preserve old images and apply saved framing on public catalogue, article and plant renderers.
- [x] Validate the implementation with `pnpm check`, `pnpm build:static` and `git diff --check`; existing Vite warnings remain non-blocking.
- [ ] Push the finished changes to `origin/main`, wait for GitHub Pages deployment, then verify the published homepage and `/admin` framing controls.
- [x] إصلاح لوحة صورة قسم التغذية في الصفحة الرئيسية باستخدام صورة التغذية داخل إطار ثابت ومتجاوب، مع إبقاء الشعار واضحًا.


## Client feedback — reliable products, ordering, WhatsApp and Nutrition formatting (2026-11-23)
- [ ] Product Italian edits regenerate complete English and Spanish name/description translations; translation failure blocks the save and never writes null or provider error text over existing translations.
- [ ] Existing products remain present, preserve publication state/images/categories/plant links, and the admin reloads the saved row so an edited cream cannot appear to disappear because of stale state.
- [ ] Add protected manual product ordering with move-up/move-down controls; Home and Catalogue use the same deterministic manual order with creation/id fallback.
- [ ] Keep individual product-specific WhatsApp buttons on cards and details, and explain in admin that each button opens a prefilled message for that product; add an article-level detox consultation WhatsApp CTA that is safe and configurable.
- [ ] Nutrition articles support Italian-authored headings, bold text, highlighted callouts and safe links; the same formatting renders correctly in Italian, English and Spanish without unsanitized HTML.
- [ ] Prepare and deliver a transparent Facebook-ready Renacer logo export while preserving the current homepage image/logo placement.
- [ ] Apply the additive ordering migration, deploy the Edge Function, pass `pnpm check`, `pnpm build:static`, and `git diff --check`, then verify the public/admin behavior and Pages deployment before claiming completion.

## Translation synchronization (2026-11-23)
- [x] ضمان تطابق محتوى المنتجات والمقالات: الإيطالية هي المصدر الوحيد، وEN/ES يعاد توليدهما تلقائيًا عند كل حفظ.
- [x] تحديد حد النص الإيطالي للمنتجات والمقالات بـ 15,000 حرف مع رفض الحفظ الصامت عند فشل الترجمة.

## Independent product and article sharing (2026-11-24)
- [x] لكل منتج ولكل مقالة صفحة مستقلة قابلة للمشاركة عبر أزرار بأيقونات WhatsApp وFacebook وInstagram.
- [x] Instagram يستعمل Web Share على الهاتف، مع نسخ الرابط تلقائيًا كحل احتياطي على المتصفح.
