ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "INCI" text;

CREATE TABLE IF NOT EXISTS public.plant_materials (
  slug text PRIMARY KEY,
  "nameIt" text NOT NULL,
  "nameEn" text NOT NULL,
  "nameEs" text NOT NULL,
  "botanicalName" text,
  "descriptionIt" text NOT NULL DEFAULT '',
  "descriptionEn" text NOT NULL DEFAULT '',
  "descriptionEs" text NOT NULL DEFAULT '',
  "safetyIt" text,
  "safetyEn" text,
  "safetyEs" text,
  "sourceUrl" text CHECK ("sourceUrl" IS NULL OR "sourceUrl" ~ '^https://'),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_plant_materials (
  "productId" bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  "plantSlug" text NOT NULL REFERENCES public.plant_materials(slug) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("productId", "plantSlug")
);

CREATE INDEX IF NOT EXISTS product_plant_materials_plant_idx
  ON public.product_plant_materials ("plantSlug");

ALTER TABLE public.plant_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_plant_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active plant materials" ON public.plant_materials;
CREATE POLICY "Public can read active plant materials"
  ON public.plant_materials FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "Public can read materials linked to published products" ON public.product_plant_materials;
CREATE POLICY "Public can read materials linked to published products"
  ON public.product_plant_materials FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.plant_materials m ON m.slug = public.product_plant_materials."plantSlug"
      WHERE p.id = public.product_plant_materials."productId"
        AND p."isPublished" = 1
        AND m."isActive" = true
    )
  );

GRANT SELECT ON public.plant_materials TO anon, authenticated;
GRANT SELECT ON public.product_plant_materials TO anon, authenticated;

INSERT INTO public.plant_materials
  (slug, "nameIt", "nameEn", "nameEs", "botanicalName", "descriptionIt", "descriptionEn", "descriptionEs", "safetyIt", "safetyEn", "safetyEs", "sourceUrl")
VALUES
('moringa', 'Moringa', 'Moringa', 'Moringa', 'Moringa oleifera', 'L’olio di moringa può contribuire alla fase emolliente di una formula. Parte della pianta, estrazione e composizione del prodotto determinano il risultato cosmetico.', 'Moringa oil may contribute to the emollient phase of a formula. Plant part, extraction and the finished product determine its cosmetic performance.', 'El aceite de moringa puede formar parte de la fase emoliente de una fórmula. La parte de la planta, la extracción y el producto final determinan su función cosmética.', NULL, NULL, NULL, 'https://pubmed.ncbi.nlm.nih.gov/25097471/'),
('aloe-vera', 'Aloe vera', 'Aloe vera', 'Aloe vera', 'Aloe vera', 'Il gel interno della foglia contiene soprattutto acqua e polisaccaridi. In cosmetica si usa in formule idratanti; la qualità e la conservazione contano.', 'Inner-leaf gel contains mainly water and polysaccharides. It is used in hydrating cosmetics; quality and preservation matter.', 'El gel interior de la hoja contiene principalmente agua y polisacáridos. Se utiliza en cosméticos hidratantes; importan la calidad y la conservación.', NULL, NULL, NULL, 'https://pubmed.ncbi.nlm.nih.gov/17026654/'),
('calendula', 'Calendula', 'Calendula', 'Caléndula', 'Calendula officinalis', 'I fiori sono tradizionalmente usati in preparazioni cosmetiche. Un oleolito porta i componenti liposolubili nella fase oleosa di balsami e creme.', 'The flowers have a traditional history in cosmetic preparations. An oil macerate carries oil-soluble components into the oil phase of balms and creams.', 'Las flores tienen un uso tradicional en preparaciones cosméticas. Un oleato lleva componentes liposolubles a la fase oleosa de bálsamos y cremas.', NULL, NULL, NULL, 'https://www.ema.europa.eu/en/medicines/herbal/calendulae-flos'),
('helichrysum', 'Elicriso', 'Helichrysum', 'Siempreviva', 'Helichrysum italicum', 'Pianta mediterranea citata nella cura cosmetica tradizionale. Gli oleoliti e i balsami sono usati per lasciare la pelle morbida e confortevole.', 'A Mediterranean plant with a traditional place in skincare. Oil macerates and balms are used to leave skin feeling soft and comfortable.', 'Planta mediterránea presente en la tradición cosmética. Los oleatos y bálsamos se usan para dejar la piel suave y confortable.', NULL, NULL, NULL, 'https://pubmed.ncbi.nlm.nih.gov/36202166/'),
('iperico', 'Iperico · Erba di San Giovanni', 'St John’s wort · Hypericum', 'Hipérico · Hierba de San Juan', 'Hypericum perforatum', 'I fiori possono essere macerati in olio. L’uso cosmetico va accompagnato da cautela rispetto alla luce solare.', 'The flowers may be macerated in oil. Cosmetic use calls for care around sunlight exposure.', 'Las flores pueden macerarse en aceite. El uso cosmético requiere precaución frente a la exposición solar.', 'Evita sole e raggi UV sulle zone trattate: l’iperico può causare fotosensibilità. Non applicare su ustioni o ferite.', 'Avoid sunlight and UV exposure on treated areas: St John’s wort may cause photosensitivity. Do not apply to burns or wounds.', 'Evita el sol y los rayos UV en las zonas tratadas: el hipérico puede causar fotosensibilidad. No aplicar sobre quemaduras o heridas.', 'https://www.ema.europa.eu/en/medicines/herbal/hyperici-herba-0'),
('artemisia', 'Artemisia', 'Artemisia', 'Artemisa', 'Artemisia spp.', 'La descrizione del prodotto nomina l’artemisia. Specie, parte impiegata e metodo di estrazione vanno confermati dalla formulatrice prima di precisare proprietà botaniche.', 'The product description names artemisia. Species, plant part and extraction method should be confirmed by the maker before specifying botanical properties.', 'La descripción del producto menciona artemisa. La especie, la parte utilizada y el método de extracción deben ser confirmados antes de detallar propiedades botánicas.', NULL, NULL, NULL, NULL),
('cera-d-api', 'Cera d’api', 'Beeswax', 'Cera de abeja', 'Cera alba', 'Dà struttura a balsami e pomate e crea un film che può ridurre la perdita d’acqua; non aggiunge acqua alla pelle.', 'Adds structure to balms and ointments and forms a film that can reduce water loss; it does not add water to skin.', 'Aporta estructura a bálsamos y ungüentos y forma una película que puede reducir la pérdida de agua; no añade agua a la piel.', NULL, NULL, NULL, 'https://www.fao.org/4/w0076e/w0076e22.htm'),
('burro-di-karite', 'Burro di karité', 'Shea butter', 'Manteca de karité', 'Butyrospermum parkii butter', 'Ingrediente emolliente che ammorbidisce e contribuisce alla fase grassa e alla consistenza di creme e balsami.', 'An emollient that softens skin and contributes to the oil phase and texture of creams and balms.', 'Emoliente que suaviza la piel y contribuye a la fase oleosa y la textura de cremas y bálsamos.', NULL, NULL, NULL, NULL),
('jojoba', 'Olio di jojoba', 'Jojoba oil', 'Aceite de jojoba', 'Simmondsia chinensis seed oil', 'La jojoba è una cera vegetale liquida usata per la sensazione morbida e per la fase oleosa di formule per pelle e capelli.', 'Jojoba is a liquid plant wax used for a soft skin feel and as part of the oil phase in skin and hair formulas.', 'La jojoba es una cera vegetal líquida que se usa por su tacto suave y como parte de la fase oleosa en fórmulas para piel y cabello.', NULL, NULL, NULL, NULL),
('argilla', 'Argilla', 'Clay', 'Arcilla', NULL, 'L’argilla può assorbire parte dell’olio superficiale. Il comportamento dipende dal tipo di argilla e dalla formula completa.', 'Clay can absorb some surface oil. Its behaviour depends on the clay type and the complete formula.', 'La arcilla puede absorber parte del aceite superficial. Su comportamiento depende del tipo de arcilla y de la fórmula completa.', 'Nei dentifrici, l’argilla non sostituisce le indicazioni del dentista né l’igiene orale raccomandata.', 'In toothpaste, clay does not replace dental advice or recommended oral hygiene.', 'En la pasta dental, la arcilla no sustituye el consejo odontológico ni la higiene oral recomendada.', NULL),
('olio-di-girasole', 'Olio di girasole', 'Sunflower oil', 'Aceite de girasol', 'Helianthus annuus seed oil', 'Olio vegetale usato come emolliente e come base per macerare materiale botanico liposolubile.', 'A vegetable oil used as an emollient and as a carrier for oil macerates of botanical material.', 'Aceite vegetal usado como emoliente y como base para macerados oleosos de material botánico.', NULL, NULL, NULL, NULL),
('olio-di-sesamo', 'Olio di sesamo', 'Sesame oil', 'Aceite de sésamo', 'Sesamum indicum seed oil', 'Olio vegetale emolliente, usato anche come base per oleoliti e per il massaggio.', 'An emollient vegetable oil also used as a carrier for macerates and massage.', 'Aceite vegetal emoliente que también se usa como base para oleatos y masajes.', 'Il sesamo può essere un allergene: verificare l’etichetta e la propria sensibilità.', 'Sesame can be an allergen: check the label and personal sensitivities.', 'El sésamo puede ser un alérgeno: comprueba la etiqueta y la sensibilidad personal.', NULL),
('olio-di-cocco', 'Olio di cocco', 'Coconut oil', 'Aceite de coco', 'Cocos nucifera oil', 'Olio emolliente che può contribuire alla consistenza e alla fase grassa di una formula.', 'An emollient oil that can contribute to a formula’s texture and oil phase.', 'Aceite emoliente que puede contribuir a la textura y a la fase oleosa de una fórmula.', NULL, NULL, NULL, 'https://pubmed.ncbi.nlm.nih.gov/23077821/'),
('olio-di-rosa-mosqueta', 'Olio di rosa mosqueta', 'Rosehip oil', 'Aceite de rosa mosqueta', 'Rosa canina fruit oil', 'Olio vegetale emolliente, inserito nella fase oleosa di creme e preparazioni per la pelle.', 'An emollient vegetable oil used in the oil phase of creams and skincare preparations.', 'Aceite vegetal emoliente utilizado en la fase oleosa de cremas y preparados para la piel.', NULL, NULL, NULL, NULL),
('vitamina-e', 'Vitamina E', 'Vitamin E', 'Vitamina E', 'Tocopherol', 'Antiossidante della fase oleosa, può aiutare a proteggere gli oli dall’ossidazione. Non è un conservante contro batteri o muffe.', 'An antioxidant for the oil phase that may help protect oils from oxidation. It is not a preservative against bacteria or mould.', 'Antioxidante de la fase oleosa que puede ayudar a proteger los aceites de la oxidación. No es un conservante contra bacterias ni moho.', NULL, NULL, NULL, NULL),
('oli-essenziali', 'Oli essenziali', 'Essential oils', 'Aceites esenciales', NULL, 'Ingredienti aromatici concentrati, usati in quantità formulate per profumare. La presenza di singoli componenti va riportata nell’INCI del prodotto.', 'Concentrated aromatic ingredients used at formulated levels for fragrance. Individual components should be listed in the product INCI.', 'Ingredientes aromáticos concentrados que se usan en cantidades formuladas para perfumar. Los componentes individuales deben figurar en el INCI del producto.', 'Possono sensibilizzare o causare allergie. Controlla l’INCI e sospendi l’uso in caso di reazione.', 'They may cause sensitisation or allergy. Check the INCI and stop use if a reaction occurs.', 'Pueden sensibilizar o causar alergia. Comprueba el INCI y deja de usarlo si aparece una reacción.', NULL),
('polveri-botaniche', 'Polveri botaniche', 'Botanical powders', 'Polvos botánicos', NULL, 'Polveri di piante usate come ingredienti di una formula. Pianta, parte, granulometria ed estratto non sono intercambiabili.', 'Plant powders used as formula ingredients. Plant, part, particle size and extract are not interchangeable.', 'Polvos vegetales usados como ingredientes de una fórmula. La planta, la parte, el tamaño de partícula y el extracto no son intercambiables.', NULL, NULL, NULL, NULL),
('rosmarino', 'Rosmarino', 'Rosemary', 'Romero', 'Salvia rosmarinus', 'Pianta aromatica mediterranea. Il prodotto Renacer citato usa rosmarino in olio di cocco per una pomata da massaggio.', 'A Mediterranean aromatic plant. The Renacer product mentioned combines rosemary with coconut oil in a massage ointment.', 'Planta aromática mediterránea. El producto Renacer citado combina romero con aceite de coco en un ungüento de masaje.', NULL, NULL, NULL, NULL),
('burro-di-cacao', 'Burro di cacao', 'Cocoa butter', 'Manteca de cacao', 'Theobroma cacao seed butter', 'Ingrediente emolliente e solido che contribuisce alla consistenza di balsami e profumi solidi.', 'A solid emollient that contributes to the texture of balms and solid perfumes.', 'Emoliente sólido que contribuye a la textura de bálsamos y perfumes sólidos.', NULL, NULL, NULL, NULL),
('olio-di-geranio', 'Olio essenziale di geranio', 'Geranium essential oil', 'Aceite esencial de geranio', 'Pelargonium graveolens flower oil', 'Ingrediente aromatico nominato negli INCI e nelle descrizioni dei prodotti. La composizione dipende da materiale e fornitore.', 'An aromatic ingredient named in product descriptions and INCI lists. Composition depends on material and supplier.', 'Ingrediente aromático mencionado en descripciones e INCI. La composición depende del material y del proveedor.', 'Gli oli essenziali possono causare sensibilizzazione; seguire l’etichetta del prodotto.', 'Essential oils may cause sensitisation; follow the product label.', 'Los aceites esenciales pueden causar sensibilización; sigue la etiqueta del producto.', NULL),
('olio-di-lavanda', 'Olio essenziale di lavanda', 'Lavender essential oil', 'Aceite esencial de lavanda', 'Lavandula angustifolia oil', 'Ingrediente aromatico nominato negli INCI e nelle descrizioni dei prodotti. La composizione dipende da materiale e fornitore.', 'An aromatic ingredient named in product descriptions and INCI lists. Composition depends on material and supplier.', 'Ingrediente aromático mencionado en descripciones e INCI. La composición depende del material y del proveedor.', 'Gli oli essenziali possono causare sensibilizzazione; seguire l’etichetta del prodotto.', 'Essential oils may cause sensitisation; follow the product label.', 'Los aceites esenciales pueden causar sensibilización; sigue la etiqueta del producto.', NULL),
('olio-di-limone', 'Olio essenziale di limone', 'Lemon essential oil', 'Aceite esencial de limón', 'Citrus limon peel oil', 'Ingrediente aromatico agrumato nominato nella descrizione di un prodotto Renacer.', 'A citrus aromatic ingredient named in a Renacer product description.', 'Ingrediente aromático cítrico mencionado en la descripción de un producto Renacer.', 'Gli oli essenziali agrumati possono richiedere precauzioni specifiche; seguire l’etichetta del prodotto.', 'Citrus essential oils may require specific precautions; follow the product label.', 'Los aceites esenciales cítricos pueden requerir precauciones; sigue la etiqueta del producto.', NULL),
('olio-di-arancia-dolce', 'Olio essenziale di arancia dolce', 'Sweet orange essential oil', 'Aceite esencial de naranja dulce', 'Citrus aurantium dulcis peel oil', 'Ingrediente aromatico agrumato nominato nella descrizione di un prodotto Renacer.', 'A citrus aromatic ingredient named in a Renacer product description.', 'Ingrediente aromático cítrico mencionado en la descripción de un producto Renacer.', 'Gli oli essenziali possono causare sensibilizzazione; seguire l’etichetta del prodotto.', 'Essential oils may cause sensitisation; follow the product label.', 'Los aceites esenciales pueden causar sensibilización; sigue la etiqueta del producto.', NULL),
('olio-di-chiodi-di-garofano', 'Olio essenziale di chiodi di garofano', 'Clove essential oil', 'Aceite esencial de clavo', 'Eugenia caryophyllus bud oil', 'Ingrediente aromatico speziato nominato nella descrizione di un prodotto Renacer.', 'A spicy aromatic ingredient named in a Renacer product description.', 'Ingrediente aromático especiado mencionado en la descripción de un producto Renacer.', 'Gli oli essenziali possono causare sensibilizzazione; seguire l’etichetta del prodotto.', 'Essential oils may cause sensitisation; follow the product label.', 'Los aceites esenciales pueden causar sensibilización; sigue la etiqueta del producto.', NULL),
('bicarbonato-di-sodio', 'Bicarbonato di sodio', 'Sodium bicarbonate', 'Bicarbonato de sodio', 'Sodium bicarbonate', 'Ingrediente minerale indicato nella descrizione del dentifricio. Non costituisce da solo una promessa di efficacia dentale.', 'A mineral ingredient listed in the toothpaste description. Its presence alone is not a claim of dental efficacy.', 'Ingrediente mineral indicado en la descripción de la pasta dental. Su presencia por sí sola no implica eficacia dental.', 'Per la cura orale, segui le indicazioni del dentista e le linee guida odontoiatriche.', 'For oral care, follow dental advice and oral-health guidance.', 'Para el cuidado oral, sigue el consejo dental y las recomendaciones de salud bucal.', NULL),
('xilitolo', 'Xilitolo', 'Xylitol', 'Xilitol', 'Xylitol', 'Ingrediente indicato nella descrizione del dentifricio Renacer. La funzione nel prodotto dipende dalla formula completa.', 'An ingredient listed in the Renacer toothpaste description. Its function depends on the complete formula.', 'Ingrediente indicado en la descripción de la pasta dental Renacer. Su función depende de la fórmula completa.', 'Per la cura orale, segui le indicazioni del dentista e le linee guida odontoiatriche.', 'For oral care, follow dental advice and oral-health guidance.', 'Para el cuidado oral, sigue el consejo dental y las recomendaciones de salud bucal.', NULL)
ON CONFLICT (slug) DO UPDATE SET
  "nameIt" = EXCLUDED."nameIt",
  "nameEn" = EXCLUDED."nameEn",
  "nameEs" = EXCLUDED."nameEs",
  "botanicalName" = EXCLUDED."botanicalName",
  "descriptionIt" = EXCLUDED."descriptionIt",
  "descriptionEn" = EXCLUDED."descriptionEn",
  "descriptionEs" = EXCLUDED."descriptionEs",
  "safetyIt" = EXCLUDED."safetyIt",
  "safetyEn" = EXCLUDED."safetyEn",
  "safetyEs" = EXCLUDED."safetyEs",
  "sourceUrl" = EXCLUDED."sourceUrl",
  "updatedAt" = now();

-- Move only text explicitly labelled INCI in live product descriptions; leave every other product blank.
UPDATE public.products SET "INCI" = 'Cera Alba (Cera d’api), Theobroma Cacao Seed Butter (Burro di cacao), Simmondsia Chinensis Seed Oil (Jojoba), Pelargonium Graveolens Flower Oil (Geranio Bourbon), Lavandula Angustifolia Oil (Lavanda).'
WHERE "nameIt" = 'Profumo solido' AND "INCI" IS NULL;
UPDATE public.products SET "INCI" = 'Olio di girasole bio, olio di sesamo bio, fiori di calendula freschi o secchi.'
WHERE "nameIt" = 'Oleolito di calendula' AND "INCI" IS NULL;
UPDATE public.products SET "INCI" = 'Olio di girasole bio, fiori di elicriso secchi.'
WHERE "nameIt" = 'Oleolito di elicriso' AND "INCI" IS NULL;
UPDATE public.products SET "INCI" = 'Helianthus Annuus Seed Oil (Girasole), Sesamum Indicum Seed Oil (Sesamo), Cera Alba (Cera d’api), Helichrysum Italicum Flower Extract (Elicriso).'
WHERE "nameIt" = 'Pomata di Elicriso' AND "INCI" IS NULL;

-- Link only materials explicitly named in existing published product descriptions; no formulas are inferred.
INSERT INTO public.product_plant_materials ("productId", "plantSlug")
SELECT p.id, v."plantSlug"
FROM (VALUES
  ('Profumo solido', 'cera-d-api'),
  ('Profumo solido', 'burro-di-cacao'),
  ('Profumo solido', 'jojoba'),
  ('Profumo solido', 'olio-di-geranio'),
  ('Profumo solido', 'olio-di-lavanda'),
  ('Crema Oro classica', 'cera-d-api'),
  ('Crema Oro classica', 'calendula'),
  ('Crema Oro classica', 'helichrysum'),
  ('Crema Oro classica', 'artemisia'),
  ('Crema leggera Aloe Vera', 'aloe-vera'),
  ('Crema leggera Aloe Vera', 'burro-di-karite'),
  ('Crema leggera Aloe Vera', 'calendula'),
  ('Crema leggera Aloe Vera', 'helichrysum'),
  ('Crema leggera Aloe Vera', 'artemisia'),
  ('Crema leggera Aloe Vera', 'olio-di-rosa-mosqueta'),
  ('Crema leggera Aloe Vera', 'vitamina-e'),
  ('Crema Oro leggera', 'olio-di-rosa-mosqueta'),
  ('Crema Oro leggera', 'aloe-vera'),
  ('Crema Oro leggera', 'vitamina-e'),
  ('Crema Moringa e Aloe Vera', 'moringa'),
  ('Crema Moringa e Aloe Vera', 'aloe-vera'),
  ('Crema Moringa e Aloe Vera', 'burro-di-karite'),
  ('Crema Moringa e Aloe Vera', 'helichrysum'),
  ('Crema Moringa e Aloe Vera', 'calendula'),
  ('Crema Moringa e Aloe Vera', 'olio-di-rosa-mosqueta'),
  ('Crema Moringa e Aloe Vera', 'vitamina-e'),
  ('Unguento di Calendula', 'calendula'),
  ('Unguento di Calendula', 'olio-di-girasole'),
  ('Unguento di Calendula', 'olio-di-sesamo'),
  ('Unguento di Calendula', 'cera-d-api'),
  ('Unguento di Iperico', 'iperico'),
  ('Unguento di Iperico', 'olio-di-girasole'),
  ('Unguento di Iperico', 'olio-di-sesamo'),
  ('Unguento di Iperico', 'cera-d-api'),
  ('Pomata di rosmarino', 'rosmarino'),
  ('Pomata di rosmarino', 'olio-di-cocco'),
  ('Shampoo doccia solido', 'aloe-vera'),
  ('Shampoo doccia solido', 'argilla'),
  ('Shampoo doccia solido', 'polveri-botaniche'),
  ('Shampoo doccia solido', 'jojoba'),
  ('Shampoo doccia solido', 'oli-essenziali'),
  ('Shampoo doccia solido', 'olio-di-limone'),
  ('Shampoo doccia solido', 'olio-di-geranio'),
  ('Shampoo doccia solido', 'olio-di-lavanda'),
  ('Oleolito di calendula', 'calendula'),
  ('Oleolito di calendula', 'olio-di-girasole'),
  ('Oleolito di calendula', 'olio-di-sesamo'),
  ('Oleolito di elicriso', 'helichrysum'),
  ('Oleolito di elicriso', 'olio-di-girasole'),
  ('Oleolito di iperico', 'iperico'),
  ('Dentifricio all’argilla bianca e cocco', 'argilla'),
  ('Dentifricio all’argilla bianca e cocco', 'olio-di-cocco'),
  ('Dentifricio all’argilla bianca e cocco', 'oli-essenziali'),
  ('Dentifricio all’argilla bianca e cocco', 'olio-di-arancia-dolce'),
  ('Dentifricio all’argilla bianca e cocco', 'olio-di-limone'),
  ('Dentifricio all’argilla bianca e cocco', 'olio-di-chiodi-di-garofano'),
  ('Dentifricio all’argilla bianca e cocco', 'bicarbonato-di-sodio'),
  ('Dentifricio all’argilla bianca e cocco', 'xilitolo'),
  ('Pomata di Elicriso', 'helichrysum'),
  ('Pomata di Elicriso', 'olio-di-girasole'),
  ('Pomata di Elicriso', 'olio-di-sesamo'),
  ('Pomata di Elicriso', 'cera-d-api')
) AS v("productName", "plantSlug")
JOIN public.products p ON p."nameIt" = v."productName" AND p."isPublished" = 1
JOIN public.plant_materials m ON m.slug = v."plantSlug"
ON CONFLICT ("productId", "plantSlug") DO NOTHING;
