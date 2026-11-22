import { useEffect, useMemo, useState } from "react";
import {
  imageFrameStyle,
  parseImageFrame,
  withImageFrame,
  type ImageFrame,
} from "../lib/imageFrame";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  HandHeart,
  Info,
  KeyRound,
  Leaf,
  LockKeyhole,
  LogOut,
  Package,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
} from "lucide-react";

type Product = {
  id: number;
  nameIt: string;
  descriptionIt: string;
  nameEn: string | null;
  descriptionEn: string | null;
  nameEs: string | null;
  descriptionEs: string | null;
  priceCents: number;
  currency: string;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  whatsappMessage: string | null;
  INCI: string | null;
  plantSlugs: string[];
  isPublished: number;
};
type Article = {
  id: number;
  slug: string;
  titleIt: string;
  bodyIt: string;
  titleEn: string | null;
  bodyEn: string | null;
  titleEs: string | null;
  bodyEs: string | null;
  imageUrl: string | null;
  isPublished: number;
};
type Category = {
  slug: string;
  nameIt: string;
  nameEn: string;
  nameEs: string;
  isActive: boolean;
};
type PlantMaterial = {
  slug: string;
  nameIt: string;
  nameEn: string;
  nameEs: string;
  botanicalName: string | null;
  descriptionIt: string;
  descriptionEn: string;
  descriptionEs: string;
  safetyIt: string | null;
  safetyEn: string | null;
  safetyEs: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
};
type PlantForm = {
  nameIt: string;
  botanicalName: string;
  descriptionIt: string;
  safetyIt: string;
  sourceUrl: string;
  imageUrl: string;
};
type ProductForm = {
  name: string;
  description: string;
  price: string;
  categorySlug: string;
  imageUrl: string;
  whatsappMessage: string;
  INCI: string;
  plantSlugs: string[];
};
type ProductTranslations = {
  en: { name: string; description: string };
  es: { name: string; description: string };
};
type ArticleForm = { title: string; body: string; imageUrl: string };
type CategoryForm = {
  nameIt: string;
  nameEn: string;
  nameEs: string;
  isActive: boolean;
};
type ArtisanSubmission = {
  id: number;
  slug: string;
  artisanName: string;
  contactEmail: string;
  contactPhone: string | null;
  productName: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  status: "pending" | "changes_requested" | "approved" | "rejected";
  correctionNote: string | null;
  moderationNote: string | null;
  signedImageUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
};
type AdminSection =
  | "overview"
  | "products"
  | "categories"
  | "plants"
  | "articles"
  | "artisans"
  | "settings";

const supabaseUrl = "https://dybqvnthmfeatwfpysrv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5YnF2bnRobWZlYXR3ZnB5c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Nzk3MTAsImV4cCI6MjExMDM1NTcxMH0.9HxrdAIQxWQ3PtWAuICpXfNjMfR4chgAmlY9cYyxB38";
const adminFunctionUrl = `${supabaseUrl}/functions/v1/renacer-admin`;
const blankProduct: ProductForm = {
  name: "",
  description: "",
  price: "",
  categorySlug: "",
  imageUrl: "",
  whatsappMessage: "",
  INCI: "",
  plantSlugs: [],
};
const blankArticle: ArticleForm = { title: "", body: "", imageUrl: "" };
const blankCategory: CategoryForm = {
  nameIt: "",
  nameEn: "",
  nameEs: "",
  isActive: true,
};
const blankPlant: PlantForm = {
  nameIt: "",
  botanicalName: "",
  descriptionIt: "",
  safetyIt: "",
  sourceUrl: "",
  imageUrl: "",
};

class AdminRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AdminRequestError";
  }
}

async function adminRequest(
  action: string,
  payload: Record<string, unknown> = {}
) {
  const token = sessionStorage.getItem("renacer_admin_token") || "";
  const response = await fetch(adminFunctionUrl, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "x-renacer-token": token,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new AdminRequestError(
      data.error || "Operazione non disponibile",
      response.status
    );
  return data;
}

function splitTranslationText(text: string, limit = 450) {
  const chunks: string[] = [];
  for (const paragraph of text.split(/\n\s*\n/)) {
    const sentences = paragraph
      .trim()
      .split(/(?<=[.!?…])\s+/u)
      .filter(Boolean);
    let current = "";
    for (const sentence of sentences) {
      if (
        sentence.length <= limit &&
        current &&
        `${current} ${sentence}`.length <= limit
      )
        current += ` ${sentence}`;
      else if (sentence.length <= limit) {
        if (current) chunks.push(current);
        current = sentence;
      } else {
        if (current) {
          chunks.push(current);
          current = "";
        }
        for (let start = 0; start < sentence.length; start += limit)
          chunks.push(sentence.slice(start, start + limit));
      }
    }
    if (current) chunks.push(current);
  }
  return chunks.length ? chunks : [text.trim()];
}

async function translateArticleInBrowser(title: string, body: string) {
  const translate = async (text: string, lang: "en" | "es") => {
    const translated: string[] = [];
    for (const chunk of splitTranslationText(text)) {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=it|${lang}`
      );
      const result = await response.json().catch(() => ({}));
      const value = result?.responseData?.translatedText;
      if (
        !response.ok ||
        typeof value !== "string" ||
        !value.trim() ||
        value.includes("QUERY LENGTH LIMIT EXCEEDED")
      )
        throw new Error("Traduzione incompleta. Riprova tra poco.");
      translated.push(value.trim());
    }
    return translated.join("\n\n");
  };
  const [titleEn, titleEs, bodyEn, bodyEs] = await Promise.all([
    translate(title, "en"),
    translate(title, "es"),
    translate(body, "en"),
    translate(body, "es"),
  ]);
  return {
    en: { name: titleEn, description: bodyEn },
    es: { name: titleEs, description: bodyEs },
  };
}

function hasValidAdminSession() {
  const token = sessionStorage.getItem("renacer_admin_token");
  const expiry = Number(token?.split(".")[0]);
  return Number.isFinite(expiry) && expiry > Date.now();
}

function AdminHeader({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="admin-header">
      <Link className="admin-back" href="/">
        <ArrowLeft size={15} />
        <span>Torna al sito</span>
      </Link>
      <Link
        className="admin-brand"
        href="/admin"
        aria-label="Dashboard Renacer"
      >
        <span className="admin-brand__mark">
          <Leaf size={17} />
        </span>
        <span>
          <strong>Renacer</strong>
          <small>Area riservata · Ibiza</small>
        </span>
      </Link>
      {onLogout ? (
        <button className="admin-lock" type="button" onClick={onLogout}>
          <LogOut size={14} />
          <span>Disconnetti</span>
        </button>
      ) : (
        <span className="admin-status">
          <span /> Accesso protetto
        </span>
      )}
    </header>
  );
}

const navItems: {
  id: AdminSection;
  label: string;
  icon: typeof Package;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Panoramica",
    icon: Sparkles,
    description: "Lo spazio di lavoro",
  },
  {
    id: "products",
    label: "Prodotti",
    icon: Package,
    description: "Schede e pubblicazione",
  },
  {
    id: "categories",
    label: "Categorie",
    icon: FolderTree,
    description: "Organizza i rituali",
  },
  {
    id: "plants",
    label: "Piante e materie",
    icon: Sprout,
    description: "Ingredienti e collegamenti",
  },
  {
    id: "articles",
    label: "Articoli",
    icon: BookOpen,
    description: "Journal Nutrition",
  },
  {
    id: "artisans",
    label: "Artisan Submissions",
    icon: HandHeart,
    description: "Richieste e revisione",
  },
  {
    id: "settings",
    label: "Impostazioni",
    icon: Settings2,
    description: "Social e sicurezza",
  },
];

function ImageFrameEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const frame = parseImageFrame(value);
  const update = (patch: Partial<ImageFrame>) =>
    onChange(withImageFrame(value, { ...frame, ...patch }));
  return (
    <div className="admin-frame-editor">
      <div className="admin-frame-preview" aria-label={`Anteprima ${label}`}>
        {value ? (
          <img
            src={value}
            alt={`Anteprima ${label}`}
            style={imageFrameStyle(value)}
          />
        ) : (
          <span>
            <ImageIcon size={17} /> Anteprima immagine
          </span>
        )}
      </div>
      {value ? (
        <div className="admin-frame-controls">
          <label>
            Orizzontale{" "}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={frame.x}
              onChange={event => update({ x: Number(event.target.value) })}
            />
          </label>
          <label>
            Verticale{" "}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={frame.y}
              onChange={event => update({ y: Number(event.target.value) })}
            />
          </label>
          <label>
            Zoom{" "}
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={frame.scale}
              onChange={event => update({ scale: Number(event.target.value) })}
            />
          </label>
          <button
            className="admin-frame-reset"
            type="button"
            onClick={() =>
              onChange(withImageFrame(value, { x: 50, y: 50, scale: 1 }))
            }
          >
            Reimposta
          </button>
        </div>
      ) : (
        <small>
          Carica una foto per regolare inquadratura, posizione e zoom.
        </small>
      )}
    </div>
  );
}

export default function Admin() {
  const [location] = useLocation();
  const sectionPart = location.replace(/^\/admin\/?/, "").split("/")[0];
  const section: AdminSection = [
    "products",
    "categories",
    "plants",
    "articles",
    "artisans",
    "settings",
  ].includes(sectionPart)
    ? (sectionPart as AdminSection)
    : "overview";
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(hasValidAdminSession);
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plantMaterials, setPlantMaterials] = useState<PlantMaterial[]>([]);
  const [submissions, setSubmissions] = useState<ArtisanSubmission[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [product, setProduct] = useState<ProductForm>(blankProduct);
  const [article, setArticle] = useState<ArticleForm>(blankArticle);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(blankCategory);
  const [plantForm, setPlantForm] = useState<PlantForm>(blankPlant);
  const [productTranslations, setProductTranslations] =
    useState<ProductTranslations | null>(null);
  const [translationSource, setTranslationSource] = useState("");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingPlant, setEditingPlant] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [imageUploading, setImageUploading] = useState<
    "product" | "article" | "plant" | null
  >(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [reviewBusyId, setReviewBusyId] = useState<number | null>(null);

  const activeCategories = useMemo(
    () => categories.filter(item => item.isActive),
    [categories]
  );
  const categoryName = (slug: string, fallback = "Altro") => {
    return categories.find(item => item.slug === slug)?.nameIt || fallback;
  };

  const load = async () => {
    const data = await adminRequest("list");
    setProducts(Array.isArray(data.products) ? data.products : []);
    setArticles(Array.isArray(data.articles) ? data.articles : []);
    setCategories(Array.isArray(data.categories) ? data.categories : []);
    setPlantMaterials(
      Array.isArray(data.plantMaterials) ? data.plantMaterials : []
    );
    setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    setFacebookUrl(
      typeof data.siteSettings?.facebookUrl === "string"
        ? data.siteSettings.facebookUrl
        : ""
    );
    setInstagramUrl(
      typeof data.siteSettings?.instagramUrl === "string"
        ? data.siteSettings.instagramUrl
        : ""
    );
  };

  const logout = (expired = false) => {
    sessionStorage.removeItem("renacer_admin_token");
    setUnlocked(false);
    if (expired)
      setPinError("La sessione è scaduta. Inserisci di nuovo il PIN.");
  };

  useEffect(() => {
    if (!unlocked) return;
    void load().catch(loadError => {
      if (loadError instanceof AdminRequestError && loadError.status === 401)
        logout(true);
      else
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Caricamento non riuscito."
        );
    });
  }, [unlocked]);

  const login = async () => {
    setPinError("");
    try {
      const result = await adminRequest("login", { pin });
      if (typeof result.token !== "string" || !result.token)
        throw new Error("Token di sessione non ricevuto.");
      sessionStorage.setItem("renacer_admin_token", result.token);
      setUnlocked(true);
      setPin("");
    } catch (loginError) {
      setPinError(
        loginError instanceof AdminRequestError && loginError.status === 401
          ? "Codice PIN non valido."
          : loginError instanceof Error
            ? loginError.message
            : "Accesso non disponibile. Riprova."
      );
    }
  };

  const uploadImage = async (
    file: File | undefined,
    entity: "product" | "article" | "plant"
  ) => {
    if (!file) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato non supportato. Usa JPG, PNG, WebP, GIF o AVIF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("L'immagine deve avere una dimensione massima di 10 MB.");
      return;
    }
    setImageUploading(entity);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("action", "upload_image");
      form.set("entity", entity);
      form.set("file", file);
      const token = sessionStorage.getItem("renacer_admin_token") || "";
      const response = await fetch(adminFunctionUrl, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "x-renacer-token": token,
        },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new AdminRequestError(
          data.error || "Caricamento immagine non riuscito.",
          response.status
        );
      if (typeof data.url !== "string")
        throw new Error(
          "Il caricamento non ha restituito l'indirizzo dell'immagine."
        );
      if (entity === "product")
        setProduct(value => ({ ...value, imageUrl: data.url }));
      else if (entity === "article")
        setArticle(value => ({ ...value, imageUrl: data.url }));
      else setPlantForm(value => ({ ...value, imageUrl: data.url }));
      setNotice("Immagine caricata. Salva il contenuto per pubblicarla.");
    } catch (uploadError) {
      if (
        uploadError instanceof AdminRequestError &&
        uploadError.status === 401
      )
        logout(true);
      else
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Caricamento immagine non riuscito."
        );
    } finally {
      setImageUploading(null);
    }
  };

  const setPublication = async (
    kind: "product" | "article",
    id: number,
    isPublished: boolean
  ) => {
    const key = `${kind}:${id}`;
    setStatusUpdating(key);
    setError("");
    setNotice("");
    try {
      await adminRequest("set_published", {
        kind,
        id,
        isPublished: isPublished ? 1 : 0,
      });
      await load();
      setNotice(
        isPublished ? "Contenuto pubblicato." : "Contenuto spostato in bozza."
      );
    } catch (statusError) {
      if (
        statusError instanceof AdminRequestError &&
        statusError.status === 401
      )
        logout(true);
      else
        setError(
          statusError instanceof Error
            ? statusError.message
            : "Stato di pubblicazione non aggiornato."
        );
    } finally {
      setStatusUpdating(null);
    }
  };

  const deleteContent = async (
    kind: "product" | "article" | "plant",
    item: Product | Article | PlantMaterial
  ) => {
    const label =
      kind === "product"
        ? (item as Product).nameIt
        : kind === "article"
          ? (item as Article).titleIt
          : (item as PlantMaterial).nameIt;
    const itemId = kind === "plant" ? 0 : (item as Product | Article).id;
    if (
      !window.confirm(
        `Eliminare definitivamente “${label}”? Questa operazione non può essere annullata.`
      )
    )
      return;
    setStatusUpdating(
      `${kind}:delete:${kind === "plant" ? (item as PlantMaterial).slug : itemId}`
    );
    setError("");
    setNotice("");
    try {
      await adminRequest("content_delete", {
        kind,
        id: itemId,
        ...(kind === "plant" ? { slug: (item as PlantMaterial).slug } : {}),
      });
      await load();
      if (kind === "product" && editingProduct === itemId) {
        setProduct(blankProduct);
        setEditingProduct(null);
      }
      if (kind === "article" && editingArticle === itemId) {
        setArticle(blankArticle);
        setEditingArticle(null);
      }
      setNotice(
        kind === "product"
          ? "Prodotto eliminato definitivamente."
          : kind === "article"
            ? "Articolo eliminato definitivamente."
            : "Materia prima eliminata definitivamente."
      );
    } catch (deleteError) {
      if (
        deleteError instanceof AdminRequestError &&
        deleteError.status === 401
      )
        logout(true);
      else
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Contenuto non eliminato."
        );
    } finally {
      setStatusUpdating(null);
    }
  };

  const translateProduct = async () => {
    if (!product.name.trim() || !product.description.trim()) {
      setError("Inserisci prima nome e descrizione in italiano.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const translated = await adminRequest("translate", {
        sourceLanguage: "it",
        name: product.name,
        description: product.description,
      });
      if (!translated?.en || !translated?.es)
        throw new Error("Traduzioni incomplete.");
      setProductTranslations(translated);
      setTranslationSource(`${product.name}\u0000${product.description}`);
      setNotice(
        "Traduzioni automatiche pronte: verranno salvate insieme al prodotto."
      );
    } catch (translationError) {
      if (
        translationError instanceof AdminRequestError &&
        translationError.status === 401
      )
        logout(true);
      else
        setError(
          translationError instanceof Error
            ? translationError.message
            : "Traduzione automatica non disponibile."
        );
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!product.name.trim() || !product.description.trim()) {
      setError("Nome e descrizione in italiano sono obbligatori.");
      return;
    }
    const categorySlug =
      product.categorySlug || activeCategories[0]?.slug || "altro";
    const chosenCategory = categories.find(item => item.slug === categorySlug);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const currentSource = `${product.name}\u0000${product.description}`;
      const translated =
        translationSource === currentSource && productTranslations
          ? productTranslations
          : await adminRequest("translate", {
              sourceLanguage: "it",
              name: product.name,
              description: product.description,
            }).catch(() => null);
      const data = {
        sourceLanguage: "it",
        nameIt: product.name.trim(),
        descriptionIt: product.description.trim(),
        nameEn: translated?.en?.name || null,
        descriptionEn: translated?.en?.description || null,
        nameEs: translated?.es?.name || null,
        descriptionEs: translated?.es?.description || null,
        priceCents: Math.round(
          (Number(product.price.replace(",", ".")) || 0) * 100
        ),
        currency: "EUR",
        categorySlug,
        categoryName: chosenCategory?.nameIt || "Altro",
        imageUrl: product.imageUrl.trim() || null,
        whatsappMessage: product.whatsappMessage.trim() || null,
        INCI: product.INCI.trim() || null,
        plantSlugs: product.plantSlugs,
        isPublished: editingProduct
          ? (products.find(item => item.id === editingProduct)?.isPublished ??
            0)
          : 1,
      };
      await adminRequest(editingProduct ? "update" : "create", {
        id: editingProduct,
        product: data,
      });
      await load();
      setProduct(blankProduct);
      setEditingProduct(null);
      setProductTranslations(null);
      setTranslationSource("");
      setNotice("Prodotto salvato e pubblicato nella categoria selezionata.");
    } catch (saveError) {
      if (saveError instanceof AdminRequestError && saveError.status === 401)
        logout(true);
      else
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Salvataggio prodotto non riuscito."
        );
    } finally {
      setBusy(false);
    }
  };

  const beginProductEdit = (item: Product) => {
    setEditingProduct(item.id);
    setProductTranslations(null);
    setTranslationSource("");
    const matchingCategory = categories.find(
      category =>
        category.slug === item.categorySlug || category.nameIt === item.category
    );
    setProduct({
      name: item.nameIt,
      description: item.descriptionIt,
      price: (item.priceCents / 100).toFixed(2),
      categorySlug: matchingCategory?.slug || item.categorySlug || "altro",
      imageUrl: item.imageUrl || "",
      whatsappMessage: item.whatsappMessage || "",
      INCI: item.INCI || "",
      plantSlugs: item.plantSlugs || [],
    });
    setError("");
    setNotice("");
  };

  const savePlant = async () => {
    if (!plantForm.nameIt.trim() || !plantForm.descriptionIt.trim()) {
      setError("Inserisci il nome e la descrizione in italiano.");
      return;
    }
    const sourceUrl = plantForm.sourceUrl.trim();
    if (sourceUrl) {
      try {
        if (new URL(sourceUrl).protocol !== "https:") throw new Error();
      } catch {
        setError("Il link della fonte deve iniziare con https://.");
        return;
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const translated = await adminRequest("translate", {
        sourceLanguage: "it",
        name: plantForm.nameIt.trim(),
        description: plantForm.descriptionIt.trim(),
        safety: plantForm.safetyIt.trim(),
      });
      if (
        !translated?.en?.name ||
        !translated?.en?.description ||
        !translated?.es?.name ||
        !translated?.es?.description ||
        (plantForm.safetyIt.trim() &&
          (!translated?.en?.safety || !translated?.es?.safety))
      ) {
        throw new Error(
          "Traduzioni automatiche incomplete. Controlla il testo e riprova."
        );
      }
      const data = {
        nameIt: plantForm.nameIt.trim(),
        nameEn: translated.en.name,
        nameEs: translated.es.name,
        botanicalName: plantForm.botanicalName.trim() || null,
        descriptionIt: plantForm.descriptionIt.trim(),
        descriptionEn: translated.en.description,
        descriptionEs: translated.es.description,
        safetyIt: plantForm.safetyIt.trim() || null,
        safetyEn: translated.en.safety || null,
        safetyEs: translated.es.safety || null,
        sourceUrl: sourceUrl || null,
        imageUrl: plantForm.imageUrl.trim() || null,
        isActive: editingPlant
          ? (plantMaterials.find(item => item.slug === editingPlant)
              ?.isActive ?? true)
          : true,
      };
      await adminRequest(editingPlant ? "material_update" : "material_create", {
        slug: editingPlant,
        material: data,
      });
      await load();
      setPlantForm(blankPlant);
      setEditingPlant(null);
      setNotice(
        editingPlant
          ? "Materia prima aggiornata e tradotta."
          : "Materia prima aggiunta e tradotta nella guida."
      );
    } catch (saveError) {
      if (saveError instanceof AdminRequestError && saveError.status === 401)
        logout(true);
      else
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Salvataggio della materia prima non riuscito."
        );
    } finally {
      setBusy(false);
    }
  };

  const beginPlantEdit = (item: PlantMaterial) => {
    setEditingPlant(item.slug);
    setPlantForm({
      nameIt: item.nameIt,
      botanicalName: item.botanicalName || "",
      descriptionIt: item.descriptionIt,
      safetyIt: item.safetyIt || "",
      sourceUrl: item.sourceUrl || "",
      imageUrl: item.imageUrl || "",
    });
    setError("");
    setNotice("");
  };

  const togglePlant = async (item: PlantMaterial) => {
    setError("");
    setNotice("");
    try {
      await adminRequest("material_update", {
        slug: item.slug,
        material: { isActive: !item.isActive },
      });
      await load();
      setNotice(
        item.isActive
          ? "Materia prima nascosta dalla guida pubblica."
          : "Materia prima attivata."
      );
    } catch (toggleError) {
      if (
        toggleError instanceof AdminRequestError &&
        toggleError.status === 401
      )
        logout(true);
      else
        setError(
          toggleError instanceof Error
            ? toggleError.message
            : "Stato della materia prima non aggiornato."
        );
    }
  };

  const saveArticle = async () => {
    if (!article.title.trim() || !article.body.trim()) {
      setError("Titolo e testo dell'articolo sono obbligatori.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const translated = await adminRequest("translate", {
        sourceLanguage: "it",
        name: article.title,
        description: article.body,
      }).catch(() =>
        translateArticleInBrowser(article.title.trim(), article.body.trim())
      );
      if (
        !translated?.en?.name ||
        !translated?.en?.description ||
        !translated?.es?.name ||
        !translated?.es?.description
      ) {
        throw new Error("Traduzioni incomplete. Controlla il testo e riprova.");
      }
      const data = {
        titleIt: article.title.trim(),
        bodyIt: article.body.trim(),
        titleEn: translated?.en?.name || null,
        bodyEn: translated?.en?.description || null,
        titleEs: translated?.es?.name || null,
        bodyEs: translated?.es?.description || null,
        imageUrl: article.imageUrl.trim() || null,
        isPublished: editingArticle
          ? (articles.find(item => item.id === editingArticle)?.isPublished ??
            0)
          : 1,
      };
      await adminRequest(editingArticle ? "article_update" : "article_create", {
        id: editingArticle,
        article: data,
      });
      await load();
      setArticle(blankArticle);
      setEditingArticle(null);
      setNotice("Articolo salvato nella sezione Nutrition.");
    } catch (saveError) {
      if (saveError instanceof AdminRequestError && saveError.status === 401)
        logout(true);
      else
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Salvataggio articolo non riuscito."
        );
    } finally {
      setBusy(false);
    }
  };

  const beginArticleEdit = (item: Article) => {
    setEditingArticle(item.id);
    setArticle({
      title: item.titleIt,
      body: item.bodyIt,
      imageUrl: item.imageUrl || "",
    });
    setError("");
    setNotice("");
  };

  const saveCategory = async () => {
    const data = {
      nameIt: categoryForm.nameIt.trim(),
      nameEn: categoryForm.nameEn.trim(),
      nameEs: categoryForm.nameEs.trim(),
      isActive: categoryForm.isActive,
    };
    if (!data.nameIt || !data.nameEn || !data.nameEs) {
      setError(
        "Completa i nomi della categoria in italiano, inglese e spagnolo."
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest(
        editingCategory ? "category_update" : "category_create",
        { slug: editingCategory, category: data }
      );
      await load();
      setCategoryForm(blankCategory);
      setEditingCategory(null);
      setNotice(
        editingCategory
          ? "Categoria aggiornata. I prodotti restano collegati al suo slug."
          : "Nuova categoria creata."
      );
    } catch (saveError) {
      if (saveError instanceof AdminRequestError && saveError.status === 401)
        logout(true);
      else
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Salvataggio categoria non riuscito."
        );
    } finally {
      setBusy(false);
    }
  };

  const beginCategoryEdit = (item: Category) => {
    setEditingCategory(item.slug);
    setCategoryForm({
      nameIt: item.nameIt,
      nameEn: item.nameEn,
      nameEs: item.nameEs,
      isActive: item.isActive,
    });
    setError("");
    setNotice("");
  };

  const deleteCategory = async (item: Category) => {
    if (
      !window.confirm(
        `Eliminare la categoria “${item.nameIt}”? Puoi eliminare solo le categorie senza prodotti assegnati.`
      )
    )
      return;
    setError("");
    setNotice("");
    try {
      await adminRequest("category_delete", { slug: item.slug });
      await load();
      if (editingCategory === item.slug) {
        setCategoryForm(blankCategory);
        setEditingCategory(null);
      }
      setNotice("Categoria eliminata.");
    } catch (deleteError) {
      if (
        deleteError instanceof AdminRequestError &&
        deleteError.status === 401
      )
        logout(true);
      else
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Categoria non eliminata."
        );
    }
  };

  const toggleCategory = async (item: Category) => {
    setError("");
    setNotice("");
    try {
      await adminRequest("category_update", {
        slug: item.slug,
        category: { isActive: !item.isActive },
      });
      await load();
      setNotice(
        item.isActive
          ? "Categoria nascosta dal catalogo pubblico."
          : "Categoria attivata."
      );
    } catch (toggleError) {
      if (
        toggleError instanceof AdminRequestError &&
        toggleError.status === 401
      )
        logout(true);
      else
        setError(
          toggleError instanceof Error
            ? toggleError.message
            : "Stato categoria non aggiornato."
        );
    }
  };

  const saveSocialSettings = async () => {
    for (const [value, label, hosts] of [
      [
        facebookUrl.trim(),
        "Facebook",
        [
          "facebook.com",
          "www.facebook.com",
          "m.facebook.com",
          "fb.com",
          "www.fb.com",
        ],
      ],
      [
        instagramUrl.trim(),
        "Instagram",
        ["instagram.com", "www.instagram.com"],
      ],
    ] as [string, string, string[]][]) {
      if (!value) continue;
      try {
        const parsed = new URL(value);
        if (
          parsed.protocol !== "https:" ||
          !hosts.includes(parsed.hostname.toLowerCase()) ||
          parsed.username ||
          parsed.password
        )
          throw new Error();
      } catch {
        setError(`Inserisci un link HTTPS valido per ${label}.`);
        return;
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest("social_settings_save", {
        facebookUrl: facebookUrl.trim(),
        instagramUrl: instagramUrl.trim(),
      });
      setNotice("Link Facebook e Instagram aggiornati.");
      await load();
    } catch (saveError) {
      if (saveError instanceof AdminRequestError && saveError.status === 401)
        logout(true);
      else
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Link social non aggiornati."
        );
    } finally {
      setBusy(false);
    }
  };

  const saveArtisanSubmission = async (item: ArtisanSubmission) => {
    setReviewBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await adminRequest("artisan_update", {
        id: item.id,
        submission: {
          productName: item.productName,
          description: item.description,
          category: item.category,
          priceCents: Math.round(Number(item.priceCents) || 0),
          correctionNote: item.correctionNote || "",
        },
      });
      await load();
      setNotice("Proposta aggiornata.");
    } catch (saveError) {
      if (saveError instanceof AdminRequestError && saveError.status === 401)
        logout(true);
      else
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Proposta non aggiornata."
        );
    } finally {
      setReviewBusyId(null);
    }
  };

  const decideArtisanSubmission = async (
    item: ArtisanSubmission,
    status: "approved" | "rejected" | "changes_requested"
  ) => {
    if (status === "changes_requested" && !item.correctionNote?.trim()) {
      setError(
        "Inserisci le correzioni richieste prima di inviare il messaggio."
      );
      return;
    }
    setReviewBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await adminRequest("artisan_decide", {
        id: item.id,
        status,
        moderationNote: item.correctionNote || "",
      });
      await load();
      setNotice(
        status === "approved"
          ? "Prodotto artigianale approvato e pubblicato."
          : status === "rejected"
            ? "Proposta rifiutata."
            : "Richiesta di correzione registrata."
      );
    } catch (decisionError) {
      if (
        decisionError instanceof AdminRequestError &&
        decisionError.status === 401
      )
        logout(true);
      else
        setError(
          decisionError instanceof Error
            ? decisionError.message
            : "Decisione non salvata."
        );
    } finally {
      setReviewBusyId(null);
    }
  };

  const deleteArtisanSubmission = async (item: ArtisanSubmission) => {
    if (
      !window.confirm(
        `Eliminare definitivamente la proposta “${item.productName}” e le relative immagini?`
      )
    )
      return;
    setReviewBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await adminRequest("artisan_delete", { id: item.id });
      await load();
      setNotice("Proposta e immagini rimosse.");
    } catch (deleteError) {
      if (
        deleteError instanceof AdminRequestError &&
        deleteError.status === 401
      )
        logout(true);
      else
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Proposta non eliminata."
        );
    } finally {
      setReviewBusyId(null);
    }
  };

  const changePin = async () => {
    if (!/^\d{6,12}$/.test(newPin)) {
      setError("Il nuovo PIN deve contenere da 6 a 12 cifre.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("I due nuovi PIN non coincidono.");
      return;
    }
    if (newPin === currentPin) {
      setError("Il nuovo PIN deve essere diverso da quello attuale.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest("change_pin", { currentPin, newPin });
      sessionStorage.removeItem("renacer_admin_token");
      setUnlocked(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setPinError("PIN aggiornato. Accedi di nuovo con il nuovo codice.");
    } catch (pinErrorValue) {
      if (
        pinErrorValue instanceof AdminRequestError &&
        pinErrorValue.status === 401
      ) {
        if (pinErrorValue.message.includes("attuale"))
          setError(pinErrorValue.message);
        else logout(true);
      } else
        setError(
          pinErrorValue instanceof Error
            ? pinErrorValue.message
            : "Impossibile aggiornare il PIN."
        );
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="admin-shell">
        <AdminHeader />
        <main className="admin-main admin-login admin-pin-login">
          <span className="admin-eyebrow">
            <LockKeyhole size={13} /> Area privata
          </span>
          <h1>
            Pronta a<br />
            <em>ripartire.</em>
          </h1>
          <p>
            Accedi alla gestione di Renacer per curare prodotti, categorie e
            articoli. Il sito pubblico resta sempre aggiornato con ciò che salvi
            qui.
          </p>
          <form
            className="admin-pin-form"
            onSubmit={event => {
              event.preventDefault();
              void login();
            }}
          >
            <label>
              Codice PIN
              <input
                type="password"
                value={pin}
                onChange={event => setPin(event.target.value)}
                autoFocus
                inputMode="numeric"
                autoComplete="current-password"
              />
            </label>
            {pinError && <p className="admin-error">{pinError}</p>}
            <button className="admin-primary" type="submit">
              <LockKeyhole size={14} /> Entra nell'area
            </button>
          </form>
        </main>
      </div>
    );
  }

  const publishedProducts = products.filter(
    item => item.isPublished === 1
  ).length;
  const publishedArticles = articles.filter(
    item => item.isPublished === 1
  ).length;
  const sectionMeta = navItems.find(item => item.id === section) || navItems[0];

  return (
    <div className="admin-shell admin-shell--workspace">
      <AdminHeader onLogout={() => logout()} />
      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__intro">
            <span>Studio Renacer</span>
            <strong>
              Spazio di
              <br />
              <em>cura.</em>
            </strong>
            <p>Organizza il catalogo, una cosa alla volta.</p>
          </div>
          <nav
            className="admin-sidebar__nav"
            aria-label="Sezioni amministrazione"
          >
            {navItems.map(item => {
              const Icon = item.icon;
              const href =
                item.id === "overview" ? "/admin" : `/admin/${item.id}`;
              return (
                <Link
                  key={item.id}
                  className={
                    section === item.id
                      ? "admin-nav-item is-active"
                      : "admin-nav-item"
                  }
                  href={href}
                >
                  <span className="admin-nav-item__icon">
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  {section === item.id ? <ArrowRight size={14} /> : null}
                </Link>
              );
            })}
          </nav>
          <div className="admin-sidebar__footer">
            <ShieldCheck size={16} />
            <span>
              Area protetta
              <br />
              <strong>Renacer · Ibiza</strong>
            </span>
          </div>
        </aside>

        <main className="admin-content">
          <div className="admin-content__topline">
            <span>{sectionMeta.description}</span>
            <a href="/" target="_blank" rel="noreferrer">
              Apri il sito <ExternalLink size={13} />
            </a>
          </div>
          <div className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">
                <Sparkles size={13} /> {sectionMeta.label}
              </span>
              <h1>
                {section === "overview" ? (
                  <>
                    Gestione
                    <br />
                    <em>con calma.</em>
                  </>
                ) : section === "products" ? (
                  <>
                    La galleria
                    <br />
                    <em>dei prodotti.</em>
                  </>
                ) : section === "categories" ? (
                  <>
                    Organizza
                    <br />
                    <em>i rituali.</em>
                  </>
                ) : section === "plants" ? (
                  <>
                    Piante e<br />
                    <em>materie prime.</em>
                  </>
                ) : section === "articles" ? (
                  <>
                    Nutrition
                    <br />
                    <em>journal.</em>
                  </>
                ) : (
                  <>
                    Impostazioni
                    <br />
                    <em>personali.</em>
                  </>
                )}
              </h1>
            </div>
            <p>
              {section === "overview"
                ? "Uno spazio ordinato per raccontare i prodotti e le storie di Renacer. Ogni area ha la sua sezione: semplice da trovare, semplice da aggiornare."
                : section === "products"
                  ? "Crea le schede, scegli la categoria e carica le immagini. Inserisci l’INCI quando la formula è stata verificata e collega solo le materie prime confermate."
                  : section === "categories"
                    ? "Crea le categorie dei tuoi rituali, aggiorna i nomi o nascondi quelle che non usi. Lo slug stabile mantiene i prodotti collegati anche se cambi il nome."
                    : section === "plants"
                      ? "Crea o aggiorna le schede delle piante e delle materie prime. Le relazioni con i prodotti sono modificabili nella scheda di ciascun prodotto."
                      : section === "articles"
                        ? "Scrivi gli articoli Nutrition: in homepage appare solo un estratto, mentre il testo completo vive nella sua pagina dedicata."
                        : "Cambia il PIN quando vuoi. Dopo l'aggiornamento la sessione termina e dovrai accedere con il nuovo codice."}
            </p>
          </div>

          {error && (
            <p className="admin-error admin-alert">
              <Info size={14} /> {error}
            </p>
          )}
          {notice && (
            <p className="admin-success admin-alert">
              <CheckCircle2 size={14} /> {notice}
            </p>
          )}

          {section === "overview" && (
            <section className="admin-overview">
              <div className="admin-overview__stats">
                <article>
                  <span>
                    <Package size={16} /> Prodotti pubblicati
                  </span>
                  <strong>
                    {publishedProducts}
                    <small> / {products.length}</small>
                  </strong>
                </article>
                <article>
                  <span>
                    <FolderTree size={16} /> Categorie attive
                  </span>
                  <strong>
                    {activeCategories.length}
                    <small> / {categories.length}</small>
                  </strong>
                </article>
                <article>
                  <span>
                    <Sprout size={16} /> Materie attive
                  </span>
                  <strong>
                    {plantMaterials.filter(item => item.isActive).length}
                    <small> / {plantMaterials.length}</small>
                  </strong>
                </article>
                <article>
                  <span>
                    <BookOpen size={16} /> Articoli online
                  </span>
                  <strong>
                    {publishedArticles}
                    <small> / {articles.length}</small>
                  </strong>
                </article>
              </div>
              <div className="admin-shortcuts">
                <Link href="/admin/products" className="admin-shortcut">
                  <span className="admin-shortcut__icon">
                    <Package size={20} />
                  </span>
                  <div>
                    <small>01 · Catalogo</small>
                    <strong>Gestisci i prodotti</strong>
                    <p>Aggiungi immagini, prezzi e categoria.</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
                <Link href="/admin/categories" className="admin-shortcut">
                  <span className="admin-shortcut__icon">
                    <FolderTree size={20} />
                  </span>
                  <div>
                    <small>02 · Organizzazione</small>
                    <strong>Modifica le categorie</strong>
                    <p>Assegna ogni prodotto al suo rituale.</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
                <Link href="/admin/plants" className="admin-shortcut">
                  <span className="admin-shortcut__icon">
                    <Sprout size={20} />
                  </span>
                  <div>
                    <small>03 · Materie prime</small>
                    <strong>Gestisci le piante</strong>
                    <p>Descrivi ingredienti e fonti.</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
                <Link href="/admin/articles" className="admin-shortcut">
                  <span className="admin-shortcut__icon">
                    <BookOpen size={20} />
                  </span>
                  <div>
                    <small>04 · Journal</small>
                    <strong>Scrivi un articolo</strong>
                    <p>Anteprime brevi e pagine complete.</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
                <Link href="/admin/settings" className="admin-shortcut">
                  <span className="admin-shortcut__icon">
                    <KeyRound size={20} />
                  </span>
                  <div>
                    <small>05 · Sicurezza</small>
                    <strong>Cambia il PIN</strong>
                    <p>Impostazione separata e protetta.</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              </div>
              <div className="admin-overview__note">
                <Leaf size={17} />
                <p>
                  <strong>Una piccola nota</strong>
                  <br />
                  Scrivi in italiano: le traduzioni per i visitatori vengono
                  preparate automaticamente, poi puoi controllarle nella scheda
                  prima di salvare.
                </p>
              </div>
            </section>
          )}

          {section === "products" && (
            <>
              <section className="admin-card">
                <div className="admin-card__top">
                  <div>
                    <span className="admin-card__number">01 / CATALOGO</span>
                    <h2>
                      {editingProduct
                        ? "Modifica prodotto"
                        : "Crea un prodotto"}
                    </h2>
                  </div>
                  <span className="admin-badge">
                    <Package size={12} /> Pubblicazione immediata
                  </span>
                </div>
                <div className="admin-language-tabs">
                  <button className="is-active" type="button">
                    <Leaf size={13} /> Italiano
                  </button>
                  <button type="button" disabled>
                    EN <small>automatico</small>
                  </button>
                  <button type="button" disabled>
                    ES <small>automatico</small>
                  </button>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Nome del prodotto
                    <input
                      value={product.name}
                      onChange={event => {
                        setProduct({ ...product, name: event.target.value });
                        setProductTranslations(null);
                        setTranslationSource("");
                      }}
                      placeholder="Es. Olio botanico"
                    />
                  </label>
                  <label>
                    Descrizione in italiano
                    <textarea
                      value={product.description}
                      onChange={event => {
                        setProduct({
                          ...product,
                          description: event.target.value,
                        });
                        setProductTranslations(null);
                        setTranslationSource("");
                      }}
                      rows={5}
                      placeholder="Racconta il prodotto con parole semplici..."
                    />
                  </label>
                </div>
                <div className="admin-extra-grid admin-product-fields">
                  <label>
                    Prezzo (EUR)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.price}
                      onChange={event =>
                        setProduct({ ...product, price: event.target.value })
                      }
                      placeholder="0,00"
                    />
                  </label>
                  <label>
                    Categoria
                    <select
                      value={
                        product.categorySlug || activeCategories[0]?.slug || ""
                      }
                      onChange={event =>
                        setProduct({
                          ...product,
                          categorySlug: event.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Seleziona una categoria
                      </option>
                      {categories.find(
                        item =>
                          item.slug === product.categorySlug && !item.isActive
                      ) ? (
                        <option value={product.categorySlug} disabled>
                          {categoryName(product.categorySlug)} · disattivata
                        </option>
                      ) : null}
                      {activeCategories.map(item => (
                        <option key={item.slug} value={item.slug}>
                          {item.nameIt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin-form-grid admin-inci-grid">
                  <label>
                    INCI · ingredienti
                    <textarea
                      rows={5}
                      value={product.INCI}
                      onChange={event =>
                        setProduct({ ...product, INCI: event.target.value })
                      }
                      placeholder="Incolla la lista INCI verificata, senza tradurla…"
                    />
                    <small>
                      Lascia vuoto se la composizione non è ancora stata
                      verificata.
                    </small>
                  </label>
                  <fieldset className="admin-material-assignment">
                    <legend>Materie prime collegate</legend>
                    <p>
                      Seleziona solo quelle confermate nella composizione di
                      questo prodotto.
                    </p>
                    <div className="admin-material-options">
                      {plantMaterials.map(item => (
                        <label key={item.slug}>
                          <input
                            type="checkbox"
                            checked={product.plantSlugs.includes(item.slug)}
                            onChange={event =>
                              setProduct(value => ({
                                ...value,
                                plantSlugs: event.target.checked
                                  ? [
                                      ...new Set([
                                        ...value.plantSlugs,
                                        item.slug,
                                      ]),
                                    ]
                                  : value.plantSlugs.filter(
                                      slug => slug !== item.slug
                                    ),
                              }))
                            }
                          />
                          <span>{item.nameIt}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div className="admin-form-grid admin-form-grid--compact">
                  <label>
                    <span>Messaggio WhatsApp opzionale</span>
                    <input
                      value={product.whatsappMessage}
                      onChange={event =>
                        setProduct({
                          ...product,
                          whatsappMessage: event.target.value,
                        })
                      }
                      placeholder="Es. Ciao Barbara, vorrei saperne di più..."
                    />
                  </label>
                </div>
                <div className="admin-extra-grid admin-image-grid admin-image-fields">
                  <div className="admin-upload-label">
                    <label className="admin-upload-control">
                      <ImageIcon size={16} />
                      <span>
                        {imageUploading === "product"
                          ? "Caricamento immagine..."
                          : product.imageUrl
                            ? "Sostituisci immagine prodotto"
                            : "Carica immagine prodotto"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          disabled={busy || imageUploading !== null}
                          onChange={event => {
                            void uploadImage(
                              event.currentTarget.files?.[0],
                              "product"
                            );
                            event.currentTarget.value = "";
                          }}
                        />
                      </span>
                    </label>
                    <small>JPG, PNG, WebP, GIF o AVIF · max 10 MB</small>
                  </div>
                  <ImageFrameEditor
                    value={product.imageUrl}
                    onChange={imageUrl => setProduct({ ...product, imageUrl })}
                    label="immagine prodotto"
                  />
                </div>
                <div className="admin-card__bottom">
                  <p>
                    <span className="admin-dot" /> La categoria viene collegata
                    con uno slug stabile
                  </p>
                  <div className="admin-actions">
                    <button
                      className="admin-secondary"
                      type="button"
                      onClick={() => void translateProduct()}
                      disabled={busy}
                    >
                      <Sparkles size={14} /> Prepara traduzioni
                    </button>
                    <button
                      className="admin-primary"
                      type="button"
                      onClick={() => void saveProduct()}
                      disabled={busy}
                    >
                      {editingProduct ? (
                        <Pencil size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      {editingProduct
                        ? "Aggiorna prodotto"
                        : "Salva e pubblica"}
                    </button>
                    {editingProduct ? (
                      <button
                        className="admin-cancel"
                        type="button"
                        onClick={() => {
                          setProduct(blankProduct);
                          setEditingProduct(null);
                          setProductTranslations(null);
                          setTranslationSource("");
                        }}
                      >
                        Annulla
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
              <section className="admin-products">
                <div className="admin-products__heading">
                  <div>
                    <span className="admin-eyebrow">
                      <Package size={13} /> Catalogo live
                    </span>
                    <h2>
                      Prodotti{" "}
                      <small>
                        ({publishedProducts} online · {products.length} totali)
                      </small>
                    </h2>
                  </div>
                  <a
                    href="/catalogue"
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Apri la galleria <ExternalLink size={14} />
                  </a>
                </div>
                {products.length === 0 ? (
                  <div className="admin-empty">
                    Nessun prodotto presente. Aggiungi la prima scheda qui
                    sopra.
                  </div>
                ) : (
                  <div className="admin-products-list">
                    {products.map(item => (
                      <div className="admin-product-row" key={item.id}>
                        <div className="admin-product-row__identity">
                          {item.imageUrl ? (
                            <img
                              className="admin-product-thumb"
                              src={item.imageUrl}
                              alt=""
                            />
                          ) : (
                            <span className="admin-product-thumb admin-product-thumb--empty">
                              <Leaf size={18} />
                            </span>
                          )}
                          <div>
                            <strong>{item.nameIt}</strong>
                            <span>
                              {categoryName(item.categorySlug, item.category)} ·{" "}
                              {(item.priceCents / 100).toFixed(2)} EUR
                            </span>
                          </div>
                        </div>
                        <span
                          className={
                            item.isPublished === 1
                              ? "admin-published"
                              : "admin-unpublished"
                          }
                        >
                          {item.isPublished === 1 ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Info size={13} />
                          )}
                          {item.isPublished === 1 ? "Online" : "Bozza"}
                        </span>
                        <button
                          className="admin-publish-toggle"
                          type="button"
                          disabled={statusUpdating !== null}
                          onClick={() =>
                            void setPublication(
                              "product",
                              item.id,
                              item.isPublished !== 1
                            )
                          }
                        >
                          {statusUpdating === `product:${item.id}`
                            ? "…"
                            : item.isPublished === 1
                              ? "Nascondi"
                              : "Pubblica"}
                        </button>
                        <button
                          className="admin-edit"
                          type="button"
                          aria-label={`Modifica ${item.nameIt}`}
                          onClick={() => beginProductEdit(item)}
                        >
                          <Pencil size={15} />
                          <span>Modifica</span>
                        </button>
                        <button
                          className="admin-delete"
                          type="button"
                          aria-label={`Elimina definitivamente ${item.nameIt}`}
                          disabled={statusUpdating !== null}
                          onClick={() => void deleteContent("product", item)}
                        >
                          <Trash2 size={15} />
                          <span>Elimina</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {section === "categories" && (
            <>
              <section className="admin-card category-form-card">
                <div className="admin-card__top">
                  <div>
                    <span className="admin-card__number">
                      {editingCategory ? "MODIFICA" : "NUOVA CATEGORIA"}
                    </span>
                    <h2>
                      {editingCategory ? "Rinomina categoria" : "Crea nuovo"}
                    </h2>
                  </div>
                  <span className="admin-badge">
                    <FolderTree size={12} /> Organizza i rituali
                  </span>
                </div>
                <div className="admin-category-form">
                  <label>
                    Nome in italiano
                    <input
                      value={categoryForm.nameIt}
                      onChange={event =>
                        setCategoryForm({
                          ...categoryForm,
                          nameIt: event.target.value,
                        })
                      }
                      placeholder="Es. Creme"
                    />
                  </label>
                  <label>
                    English
                    <input
                      value={categoryForm.nameEn}
                      onChange={event =>
                        setCategoryForm({
                          ...categoryForm,
                          nameEn: event.target.value,
                        })
                      }
                      placeholder="e.g. Creams"
                    />
                  </label>
                  <label>
                    Español
                    <input
                      value={categoryForm.nameEs}
                      onChange={event =>
                        setCategoryForm({
                          ...categoryForm,
                          nameEs: event.target.value,
                        })
                      }
                      placeholder="p. ej. Cremas"
                    />
                  </label>
                  {editingCategory ? (
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={categoryForm.isActive}
                        onChange={event =>
                          setCategoryForm({
                            ...categoryForm,
                            isActive: event.target.checked,
                          })
                        }
                      />{" "}
                      Attiva nel catalogo
                    </label>
                  ) : null}
                </div>
                <div className="admin-card__bottom">
                  <p>
                    <Info size={14} /> Le modifiche al nome non scollegano i
                    prodotti assegnati
                  </p>
                  <div className="admin-actions">
                    <button
                      className="admin-primary"
                      type="button"
                      onClick={() => void saveCategory()}
                      disabled={busy}
                    >
                      {editingCategory ? (
                        <Save size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                      {editingCategory ? "Salva modifiche" : "Crea categoria"}
                    </button>
                    {editingCategory ? (
                      <button
                        className="admin-cancel"
                        type="button"
                        onClick={() => {
                          setCategoryForm(blankCategory);
                          setEditingCategory(null);
                        }}
                      >
                        Annulla
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
              <section className="category-manager">
                <div className="admin-products__heading">
                  <div>
                    <span className="admin-eyebrow">
                      <FolderTree size={13} /> Categorie del catalogo
                    </span>
                    <h2>
                      Organizza i rituali <small>({categories.length})</small>
                    </h2>
                  </div>
                </div>
                <div className="category-list">
                  {categories.map((item, index) => (
                    <article
                      className={
                        !item.isActive
                          ? "category-row is-inactive"
                          : "category-row"
                      }
                      key={item.slug}
                    >
                      <div className="category-row__number">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="category-row__name">
                        <strong>{item.nameIt}</strong>
                        <span>{item.slug}</span>
                      </div>
                      <div className="category-row__translation">
                        <span>{item.nameEn}</span>
                        <span>{item.nameEs}</span>
                      </div>
                      <span
                        className={
                          item.isActive
                            ? "category-state is-active"
                            : "category-state"
                        }
                      >
                        {item.isActive ? "Attiva" : "Nascosta"}
                      </span>
                      <div className="category-row__actions">
                        <button
                          className="admin-publish-toggle"
                          type="button"
                          onClick={() => void toggleCategory(item)}
                        >
                          {item.isActive ? "Nascondi" : "Attiva"}
                        </button>
                        <button
                          className="admin-edit"
                          type="button"
                          aria-label={`Modifica ${item.nameIt}`}
                          onClick={() => beginCategoryEdit(item)}
                        >
                          <Pencil size={15} />
                          <span>Modifica</span>
                        </button>
                        <button
                          className="admin-delete"
                          type="button"
                          aria-label={`Elimina ${item.nameIt}`}
                          onClick={() => void deleteCategory(item)}
                        >
                          <Trash2 size={15} />
                          <span>Elimina</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="category-manager__hint">
                  <Info size={14} /> Per eliminare una categoria, sposta prima i
                  prodotti assegnati a un'altra categoria: così nessun prodotto
                  resta senza collocazione.
                </p>
              </section>
            </>
          )}

          {section === "plants" && (
            <>
              <section className="admin-card admin-plant-card">
                <div className="admin-card__top">
                  <div>
                    <span className="admin-card__number">
                      {editingPlant ? "MODIFICA MATERIA" : "NUOVA MATERIA"}
                    </span>
                    <h2>
                      {editingPlant
                        ? "Aggiorna la scheda"
                        : "Aggiungi una materia prima"}
                    </h2>
                  </div>
                  <span className="admin-badge">
                    <Sprout size={12} /> Guida botanica
                  </span>
                </div>
                <div className="admin-plant-fields">
                  <label>
                    Nome in italiano
                    <input
                      value={plantForm.nameIt}
                      onChange={event =>
                        setPlantForm({
                          ...plantForm,
                          nameIt: event.target.value,
                        })
                      }
                      placeholder="Es. Calendula"
                    />
                  </label>
                  <label>
                    Nome botanico
                    <input
                      value={plantForm.botanicalName}
                      onChange={event =>
                        setPlantForm({
                          ...plantForm,
                          botanicalName: event.target.value,
                        })
                      }
                      placeholder="Calendula officinalis"
                    />
                  </label>
                  <label className="admin-plant-source">
                    Link della fonte (HTTPS)
                    <input
                      type="url"
                      value={plantForm.sourceUrl}
                      onChange={event =>
                        setPlantForm({
                          ...plantForm,
                          sourceUrl: event.target.value,
                        })
                      }
                      placeholder="https://…"
                    />
                  </label>
                  <label className="admin-plant-description">
                    Descrizione in italiano
                    <textarea
                      rows={4}
                      value={plantForm.descriptionIt}
                      onChange={event =>
                        setPlantForm({
                          ...plantForm,
                          descriptionIt: event.target.value,
                        })
                      }
                      placeholder="Descrivi la materia prima e il suo uso cosmetico..."
                    />
                  </label>
                  <label className="admin-plant-safety">
                    Nota di cautela in italiano
                    <textarea
                      rows={3}
                      value={plantForm.safetyIt}
                      onChange={event =>
                        setPlantForm({
                          ...plantForm,
                          safetyIt: event.target.value,
                        })
                      }
                      placeholder="Facoltativa; aggiungi solo cautele pertinenti e supportate."
                    />
                  </label>
                  <div className="admin-plant-image-upload">
                    <div className="admin-upload-label">
                      <label className="admin-upload-control">
                        <ImageIcon size={16} />
                        <span>
                          {imageUploading === "plant"
                            ? "Caricamento immagine..."
                            : plantForm.imageUrl
                              ? "Sostituisci immagine"
                              : "Carica immagine della pianta"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            disabled={busy || imageUploading !== null}
                            onChange={event => {
                              void uploadImage(
                                event.currentTarget.files?.[0],
                                "plant"
                              );
                              event.currentTarget.value = "";
                            }}
                          />
                        </span>
                      </label>
                      <small>JPG, PNG, WebP, GIF o AVIF · max 10 MB</small>
                    </div>
                    <ImageFrameEditor
                      value={plantForm.imageUrl}
                      onChange={imageUrl =>
                        setPlantForm({ ...plantForm, imageUrl })
                      }
                      label="immagine della materia prima"
                    />
                  </div>
                </div>
                <div className="admin-card__bottom">
                  <p>
                    <Info size={14} /> Scrivi in italiano: nome, descrizione e
                    cautele saranno tradotti automaticamente in inglese e
                    spagnolo al salvataggio.
                  </p>
                  <div className="admin-actions">
                    <button
                      className="admin-primary"
                      type="button"
                      onClick={() => void savePlant()}
                      disabled={busy || imageUploading !== null}
                    >
                      {editingPlant ? <Save size={14} /> : <Plus size={14} />}
                      {busy
                        ? "Traduzione e salvataggio..."
                        : editingPlant
                          ? "Salva materia"
                          : "Aggiungi alla guida"}
                    </button>
                    {editingPlant ? (
                      <button
                        className="admin-cancel"
                        type="button"
                        onClick={() => {
                          setPlantForm(blankPlant);
                          setEditingPlant(null);
                        }}
                      >
                        Annulla
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
              <section className="admin-products admin-plant-list">
                <div className="admin-products__heading">
                  <div>
                    <span className="admin-eyebrow">
                      <Sprout size={13} /> Materie prime
                    </span>
                    <h2>
                      Guida botanica <small>({plantMaterials.length})</small>
                    </h2>
                  </div>
                  <a
                    href="/plants"
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Apri la guida <ExternalLink size={14} />
                  </a>
                </div>
                {plantMaterials.length === 0 ? (
                  <div className="admin-empty">
                    Nessuna materia prima. Aggiungi la prima scheda qui sopra.
                  </div>
                ) : (
                  <div className="admin-products-list">
                    {plantMaterials.map(item => (
                      <div
                        className="admin-product-row plant-admin-row"
                        key={item.slug}
                      >
                        <div className="admin-product-row__identity">
                          {item.imageUrl ? (
                            <img
                              className="admin-product-thumb admin-plant-thumbnail"
                              src={item.imageUrl}
                              alt=""
                            />
                          ) : (
                            <span className="admin-product-thumb admin-product-thumb--empty">
                              <Leaf size={17} />
                            </span>
                          )}
                          <div>
                            <strong>{item.nameIt}</strong>
                            <span>
                              {item.botanicalName || item.slug} · {item.nameEn}{" "}
                              · {item.nameEs}
                            </span>
                          </div>
                        </div>
                        <span
                          className={
                            item.isActive
                              ? "admin-published"
                              : "admin-unpublished"
                          }
                        >
                          {item.isActive ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Info size={13} />
                          )}
                          {item.isActive ? "Attiva" : "Nascosta"}
                        </span>
                        <button
                          className="admin-publish-toggle"
                          type="button"
                          onClick={() => void togglePlant(item)}
                        >
                          {item.isActive ? "Nascondi" : "Attiva"}
                        </button>
                        <button
                          className="admin-edit"
                          type="button"
                          aria-label={`Modifica ${item.nameIt}`}
                          onClick={() => beginPlantEdit(item)}
                        >
                          <Pencil size={15} />
                          <span>Modifica</span>
                        </button>
                        <button
                          className="admin-delete"
                          type="button"
                          aria-label={`Elimina definitivamente ${item.nameIt}`}
                          disabled={statusUpdating !== null}
                          onClick={() => void deleteContent("plant", item)}
                        >
                          <Trash2 size={15} />
                          <span>Elimina</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {section === "articles" && (
            <>
              <section className="admin-card admin-article-card">
                <div className="admin-card__top">
                  <div>
                    <span className="admin-card__number">01 / NUTRITION</span>
                    <h2>
                      {editingArticle ? "Modifica articolo" : "Nuovo articolo"}
                    </h2>
                  </div>
                  <span className="admin-badge">
                    <BookOpen size={12} /> Una pagina per ogni storia
                  </span>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Titolo dell'articolo
                    <input
                      value={article.title}
                      onChange={event =>
                        setArticle({ ...article, title: event.target.value })
                      }
                      placeholder="Es. Una cura più ampia"
                    />
                  </label>
                  <label>
                    Testo dell'articolo
                    <textarea
                      value={article.body}
                      onChange={event =>
                        setArticle({ ...article, body: event.target.value })
                      }
                      rows={8}
                      placeholder="Scrivi una nota per la sezione Nutrition..."
                    />
                  </label>
                </div>
                <div className="admin-extra-grid admin-image-grid admin-image-fields">
                  <div className="admin-upload-label">
                    <label className="admin-upload-control">
                      <ImageIcon size={16} />
                      <span>
                        {imageUploading === "article"
                          ? "Caricamento immagine..."
                          : article.imageUrl
                            ? "Sostituisci immagine articolo"
                            : "Carica immagine articolo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          disabled={busy || imageUploading !== null}
                          onChange={event => {
                            void uploadImage(
                              event.currentTarget.files?.[0],
                              "article"
                            );
                            event.currentTarget.value = "";
                          }}
                        />
                      </span>
                    </label>
                    <small>JPG, PNG, WebP, GIF o AVIF · max 10 MB</small>
                  </div>
                  <ImageFrameEditor
                    value={article.imageUrl}
                    onChange={imageUrl => setArticle({ ...article, imageUrl })}
                    label="immagine articolo"
                  />
                </div>
                <div className="admin-card__bottom">
                  <p>
                    <FileText size={14} /> In homepage appare solo un estratto
                    con “Learn more”
                  </p>
                  <div className="admin-actions">
                    <button
                      className="admin-primary"
                      type="button"
                      onClick={() => void saveArticle()}
                      disabled={busy}
                    >
                      {editingArticle ? (
                        <Pencil size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                      {editingArticle
                        ? "Aggiorna articolo"
                        : "Pubblica articolo"}
                    </button>
                    {editingArticle ? (
                      <button
                        className="admin-cancel"
                        type="button"
                        onClick={() => {
                          setArticle(blankArticle);
                          setEditingArticle(null);
                        }}
                      >
                        Annulla
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
              <section className="admin-products admin-articles-list">
                <div className="admin-products__heading">
                  <div>
                    <span className="admin-eyebrow">
                      <BookOpen size={13} /> Journal live
                    </span>
                    <h2>
                      Articoli{" "}
                      <small>
                        ({publishedArticles} online · {articles.length} totali)
                      </small>
                    </h2>
                  </div>
                  <a
                    href="/nutrition"
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Apri Nutrition <ExternalLink size={14} />
                  </a>
                </div>
                {articles.length === 0 ? (
                  <div className="admin-empty">
                    Non ci sono ancora articoli. Crea il primo qui sopra.
                  </div>
                ) : (
                  <div className="admin-products-list">
                    {articles.map(item => (
                      <div className="admin-product-row" key={item.id}>
                        <div className="admin-product-row__identity">
                          {item.imageUrl ? (
                            <img
                              className="admin-product-thumb"
                              src={item.imageUrl}
                              alt=""
                            />
                          ) : (
                            <span className="admin-product-thumb admin-product-thumb--empty">
                              <BookOpen size={17} />
                            </span>
                          )}
                          <div>
                            <strong>{item.titleIt}</strong>
                            <span>/{`nutrition/${item.slug}`}</span>
                          </div>
                        </div>
                        <span
                          className={
                            item.isPublished === 1
                              ? "admin-published"
                              : "admin-unpublished"
                          }
                        >
                          {item.isPublished === 1 ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Info size={13} />
                          )}
                          {item.isPublished === 1 ? "Online" : "Bozza"}
                        </span>
                        <button
                          className="admin-publish-toggle"
                          type="button"
                          disabled={statusUpdating !== null}
                          onClick={() =>
                            void setPublication(
                              "article",
                              item.id,
                              item.isPublished !== 1
                            )
                          }
                        >
                          {statusUpdating === `article:${item.id}`
                            ? "…"
                            : item.isPublished === 1
                              ? "Nascondi"
                              : "Pubblica"}
                        </button>
                        <button
                          className="admin-edit"
                          type="button"
                          aria-label={`Modifica ${item.titleIt}`}
                          onClick={() => beginArticleEdit(item)}
                        >
                          <Pencil size={15} />
                          <span>Modifica</span>
                        </button>
                        <button
                          className="admin-delete"
                          type="button"
                          aria-label={`Elimina definitivamente ${item.titleIt}`}
                          disabled={statusUpdating !== null}
                          onClick={() => void deleteContent("article", item)}
                        >
                          <Trash2 size={15} />
                          <span>Elimina</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {section === "artisans" && (
            <section className="admin-artisan-queue">
              <div className="admin-products__heading">
                <div>
                  <span className="admin-eyebrow">
                    <HandHeart size={13} /> Revisione privata
                  </span>
                  <h2>
                    Proposte <small>({submissions.length})</small>
                  </h2>
                </div>
                <a
                  href="/artisans"
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Apri la sezione pubblica <ExternalLink size={14} />
                </a>
              </div>
              {submissions.length === 0 ? (
                <div className="admin-empty">
                  Non ci sono ancora proposte di artigiani.
                </div>
              ) : (
                submissions.map(item => (
                  <article
                    className="admin-card artisan-review-card"
                    key={item.id}
                  >
                    <div className="admin-card__top">
                      <div>
                        <span className="admin-card__number">
                          PROPOSTA #{item.id} ·{" "}
                          {new Date(item.createdAt).toLocaleDateString("it-IT")}
                        </span>
                        <h2>{item.productName}</h2>
                      </div>
                      <span
                        className={
                          item.status === "approved"
                            ? "admin-published"
                            : item.status === "rejected"
                              ? "admin-unpublished"
                              : "admin-badge"
                        }
                      >
                        {item.status === "approved"
                          ? "Approvata"
                          : item.status === "rejected"
                            ? "Rifiutata"
                            : item.status === "changes_requested"
                              ? "Correzioni richieste"
                              : "In attesa"}
                      </span>
                    </div>
                    <div className="artisan-review-contact">
                      <strong>{item.artisanName}</strong>
                      <a href={`mailto:${item.contactEmail}`}>
                        {item.contactEmail}
                      </a>
                      {item.contactPhone ? (
                        <a href={`tel:${item.contactPhone}`}>
                          {item.contactPhone}
                        </a>
                      ) : null}
                    </div>
                    {item.signedImageUrl || item.imageUrl ? (
                      <img
                        className="artisan-review-image"
                        src={item.imageUrl || item.signedImageUrl || ""}
                        alt={`Anteprima ${item.productName}`}
                      />
                    ) : null}
                    <div className="admin-form-grid artisan-review-fields">
                      <label>
                        Nome prodotto
                        <input
                          value={item.productName}
                          onChange={event =>
                            setSubmissions(rows =>
                              rows.map(row =>
                                row.id === item.id
                                  ? { ...row, productName: event.target.value }
                                  : row
                              )
                            )
                          }
                        />
                      </label>
                      <label>
                        Categoria
                        <input
                          value={item.category}
                          onChange={event =>
                            setSubmissions(rows =>
                              rows.map(row =>
                                row.id === item.id
                                  ? { ...row, category: event.target.value }
                                  : row
                              )
                            )
                          }
                        />
                      </label>
                      <label>
                        Prezzo EUR
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(item.priceCents / 100).toFixed(2)}
                          onChange={event =>
                            setSubmissions(rows =>
                              rows.map(row =>
                                row.id === item.id
                                  ? {
                                      ...row,
                                      priceCents: Math.round(
                                        (Number(event.target.value) || 0) * 100
                                      ),
                                    }
                                  : row
                              )
                            )
                          }
                        />
                      </label>
                      <label className="artisan-review-description">
                        Descrizione
                        <textarea
                          rows={4}
                          value={item.description}
                          onChange={event =>
                            setSubmissions(rows =>
                              rows.map(row =>
                                row.id === item.id
                                  ? { ...row, description: event.target.value }
                                  : row
                              )
                            )
                          }
                        />
                      </label>
                    </div>
                    <label className="artisan-review-note">
                      Messaggio per l'artigiano / nota di moderazione
                      <textarea
                        rows={2}
                        maxLength={2000}
                        value={item.correctionNote || ""}
                        onChange={event =>
                          setSubmissions(rows =>
                            rows.map(row =>
                              row.id === item.id
                                ? { ...row, correctionNote: event.target.value }
                                : row
                            )
                          )
                        }
                        placeholder="Indica qui eventuali correzioni richieste…"
                      />
                    </label>
                    <div className="admin-actions artisan-review-actions">
                      <button
                        className="admin-secondary"
                        type="button"
                        disabled={reviewBusyId === item.id}
                        onClick={() => void saveArtisanSubmission(item)}
                      >
                        <Save size={14} /> Salva modifiche
                      </button>
                      <button
                        className="admin-secondary"
                        type="button"
                        disabled={reviewBusyId === item.id}
                        onClick={() =>
                          void decideArtisanSubmission(
                            item,
                            "changes_requested"
                          )
                        }
                      >
                        Richiedi correzioni
                      </button>
                      <button
                        className="admin-primary"
                        type="button"
                        disabled={
                          reviewBusyId === item.id || item.status === "approved"
                        }
                        onClick={() =>
                          void decideArtisanSubmission(item, "approved")
                        }
                      >
                        <CheckCircle2 size={14} /> Approva e pubblica
                      </button>
                      <button
                        className="admin-danger"
                        type="button"
                        disabled={
                          reviewBusyId === item.id || item.status === "rejected"
                        }
                        onClick={() =>
                          void decideArtisanSubmission(item, "rejected")
                        }
                      >
                        Rifiuta
                      </button>
                      <button
                        className="admin-danger"
                        type="button"
                        disabled={reviewBusyId === item.id}
                        onClick={() => void deleteArtisanSubmission(item)}
                      >
                        <Trash2 size={14} /> Elimina proposta e immagini
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}

          {section === "settings" && (
            <>
              <section className="admin-card admin-social-card">
                <div className="admin-card__top">
                  <div>
                    <span className="admin-card__number">01 / SOCIAL</span>
                    <h2>Profili Renacer</h2>
                  </div>
                  <span className="admin-badge">
                    <ExternalLink size={12} /> Link pubblici
                  </span>
                </div>
                <p className="admin-social-intro">
                  Aggiungi i link esatti dei profili ufficiali. Puoi scegliere e
                  cambiare la pagina Facebook quando vuoi; i link vuoti non
                  mostrano icone sul sito.
                </p>
                <div className="admin-security-form">
                  <label>
                    Facebook
                    <input
                      type="url"
                      maxLength={2048}
                      value={facebookUrl}
                      onChange={event => setFacebookUrl(event.target.value)}
                      placeholder="https://www.facebook.com/…"
                    />
                  </label>
                  <label>
                    Instagram
                    <input
                      type="url"
                      maxLength={2048}
                      value={instagramUrl}
                      onChange={event => setInstagramUrl(event.target.value)}
                      placeholder="https://www.instagram.com/…"
                    />
                  </label>
                </div>
                <div className="admin-card__bottom">
                  <p>
                    <ShieldCheck size={14} /> Sono accettati solo link HTTPS
                    Facebook e Instagram
                  </p>
                  <button
                    className="admin-primary"
                    type="button"
                    onClick={() => void saveSocialSettings()}
                    disabled={busy}
                  >
                    <Save size={14} /> Salva link social
                  </button>
                </div>
              </section>
              <section className="admin-card admin-security-card">
                <div className="admin-card__top">
                  <div>
                    <span className="admin-card__number">01 / ACCESSO</span>
                    <h2>Cambia il PIN</h2>
                  </div>
                  <span className="admin-badge">
                    <KeyRound size={12} /> Protetto
                  </span>
                </div>
                <div className="admin-security-intro">
                  <div className="admin-security-intro__icon">
                    <LockKeyhole size={20} />
                  </div>
                  <div>
                    <strong>Il codice resta privato</strong>
                    <p>
                      Il nuovo PIN viene salvato solo come hash con salt. Al
                      termine uscirai automaticamente e dovrai effettuare un
                      nuovo accesso.
                    </p>
                  </div>
                </div>
                <div className="admin-security-form">
                  <label>
                    PIN attuale
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="current-password"
                      value={currentPin}
                      onChange={event => setCurrentPin(event.target.value)}
                      placeholder="••••••"
                    />
                  </label>
                  <label>
                    Nuovo PIN
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      value={newPin}
                      onChange={event => setNewPin(event.target.value)}
                      placeholder="6–12 cifre"
                    />
                  </label>
                  <label>
                    Conferma nuovo PIN
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      value={confirmPin}
                      onChange={event => setConfirmPin(event.target.value)}
                      placeholder="Ripeti il nuovo PIN"
                    />
                  </label>
                </div>
                <div className="admin-card__bottom">
                  <p>
                    <ShieldCheck size={14} /> La modifica invalida le sessioni
                    precedenti
                  </p>
                  <button
                    className="admin-primary"
                    type="button"
                    onClick={() => void changePin()}
                    disabled={busy}
                  >
                    <KeyRound size={14} /> Aggiorna PIN
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
