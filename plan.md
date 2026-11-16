# خطة تطوير متجر Renacer

## النطاق المؤكد
- إعادة تصميم الموقع الحالي ليعمل ككتالوج منتجات واضح بدل واجهة تسويقية طويلة.
- الإبقاء على قسم **Nutrition / Nutrizione / Nutrición** ليكون مكانًا جاهزًا لدروس التغذية لاحقًا، من دون اختلاق دروس أو ادعاءات صحية.
- إظهار المنتجات المنشورة مع صورها وأوصافها، من دون أسعار.
- استبدال أي عبارة «اشترِ الآن / Buy now» بدعوة للاستفسار أو الطلب عبر WhatsApp، مع رسالة جاهزة باسم المنتج.
- تمكين الزائرة من تبديل لغة الواجهة والنصوص بين الإيطالية والإنجليزية والإسبانية.
- في لوحة الإدارة، تكتب Barbara اسم المنتج ووصفه بلغة واحدة، ثم تراجع الترجمة الآلية للغات الثلاث قبل الحفظ.
- إضافة رفع صورة للمنتج من الجهاز، مع إبقاء حقول WhatsApp الحالية.
- لا تُضاف منتجات أو صور أو أسعار حقيقية من دون أن تدخلها Barbara.

## التنفيذ
- الإبقاء على React/Vite للواجهة العامة المنشورة عبر GitHub Pages، وعلى جدول المنتجات الحالي في Supabase.
- استخدام الحقول الموجودة للمنتج؛ لا تعرض الواجهة العامة السعر ولا تطلبه لوحة الإدارة.
- قراءة حقول الكتالوج اللازمة فقط من Supabase، مع دعم الرجوع إلى الاسم/الوصف المصدر إن كانت ترجمة غير متاحة.
- نقل عمليات إدارة المنتجات ورفع الصور إلى خادم التطبيق المحمي بجلسة PIN، وعدم إبقاء CRUD على Supabase داخل النسخة الثابتة من الموقع. يوجّه مسار `/admin` على GitHub Pages إلى لوحة الإدارة المستضافة على Manus لأن Pages لا يشغّل خادم Node.
- رفع الصور من لوحة الإدارة عبر نقطة خادم تتحقق من جلسة PIN ثم تستخدم تخزين التطبيق الحالي؛ يُحفظ رابط الصورة العامة في الحقل الحالي `imageUrl` لتجنّب تغيير مخطط البيانات أثناء هذه المرحلة.
- عند فشل الترجمة، لا تُنسخ اللغة المصدر بصمت إلى اللغات الأخرى ولا يُسمح باعتبارها ترجمة جاهزة.
- إضافة ترحيل SQL مستقل لتفعيل RLS على جدول المنتجات والسماح للزوار بقراءة المنتجات المنشورة فقط، ومنع عمليات الكتابة العامة. هذا ملف كود فقط؛ لا يُطبّق على قاعدة البيانات الحية ضمن هذه المهمة.

## بنية الملفات والمسؤوليات
- `client/src/pages/Home.tsx`: الصفحة العامة، تبديل اللغات، الكاتالوج، أزرار WhatsApp وقسم Nutrition.
- `client/src/pages/Admin.tsx`: تسجيل PIN، محرر المنتج، الترجمة، رفع صورة، وحفظ/تعديل/حذف المنتجات عبر واجهة الخادم المحمية.
- `client/src/index.css`: نظام التصميم المتجاوب للموقع واللوحة.
- `server/_core/index.ts`: نقطة رفع الصور المحمية بجلسة PIN.
- `server/routers.ts` و`server/products.ts`: تحقق بيانات المنتجات وعمليات CRUD عبر الخادم القائم.
- `supabase/migrations/`: ترحيل RLS آمن؛ لا تُنشأ سجلات منتجات ولا تُحذف بيانات.

## التصميم
ثلاثة اتجاهات بديلة (احتمالات منخفضة كاختيارات تصميمية أولية):
- متجر نباتي معاصر يقدّم المنتجات أولًا، بخلفية عاجية ولمسات زيتونية وتيراكوتا: 0.083.
- صيدلية متوسطية فاخرة بطابع طباعي كلاسيكي: 0.061.
- معرض منتجات جريء عالي التباين ببطاقات كبيرة ومساحات ملونة: 0.037.

**الاتجاه المختار:** متجر نباتي معاصر يقدّم المنتجات أولًا، مع الاحتفاظ بعناصر Renacer الأصلية والصور الموجودة بدل إعادة استخدام صور عامة. المبادئ: وضوح المنتجات، صور كبيرة، وصف قابل للقراءة، وتفاعل مباشر مع WhatsApp. تكون تجربة الهاتف أولوية، مع تدرج هادئ وحركة محدودة.


## Specifiche del design scelto

**Design Movement:** contemporary botanical storefront, con l’editorialità mediterranea di un piccolo marchio artigianale, ma con una gerarchia e una chiarezza da vero catalogo.

**Principi:** i prodotti si trovano subito dopo l’introduzione; le foto hanno più peso del testo accessorio; il contatto è diretto e semplice; la sezione personale e Nutrition restano presenti senza competere con la collezione.

**Colore:** una base avorio minerale mantiene la pagina luminosa; verde foresta comunica il mondo botanico e guida le azioni; salvia crea superfici quiete; terracotta serve solo come accento caldo e leggibile.

**Layout:** apertura editoriale con illustrazione originale, poi passaggio diretto alla collezione; schede prodotto con fotografia, descrizione e un’unica azione WhatsApp. La storia personale e Nutrition vengono dopo il catalogo, in una colonna narrativa più ariosa.

**Elementi distintivi:** illustrazione botanica ad arco già presente nel progetto; schede con angoli morbidi e fotografia ampia; pulsanti a capsula che ricorrono solo per le azioni principali.

**Interazione e animazione:** il selettore lingua aggiorna i testi della stessa pagina; ogni richiesta WhatsApp contiene il prodotto scelto e il testo nella lingua del visitatore. Gli effetti hover sono brevi e discreti; niente animazioni invasive o scroll forzato; rispettare `prefers-reduced-motion`.

**Tipografia:** mantenere Georgia come serif editoriale per i titoli e Inter/system sans-serif per testi, controlli e navigazione; i titoli usano una gerarchia breve e grande, mentre le descrizioni restano leggibili anche su telefono.

**Brand essence:** cura artigianale e botanica di Ibiza, fatta da Barbara per chi cerca prodotti e informazioni presentati in modo personale e senza pressioni. Personalità: calma, sincera, concreta.

**Brand voice:** titoli caldi e brevi; microcopy pratico, mai promesse mediche o urgenze di vendita. Esempi: «Scopri la collezione Renacer.» / «Chiedi a Barbara disponibilità e dettagli su WhatsApp.»

**Marchio e logo:** riutilizzare il logo originale `client/public/images/logo-woman.png` e la firma Renacer; non ridisegnare il marchio né simulare nuove foto dei prodotti.

**Signature brand color:** verde foresta `#214638`, come colore proprietario per navigazione, pulsanti e punti di orientamento.
