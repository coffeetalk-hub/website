/**
 * CoffeeTalk landing page — all copy, in both languages.
 *
 * Every string on the page lives here. Edit the `en` and `ar` objects below;
 * the components never contain literal copy. Keep the two objects
 * structurally identical (the `Content` type enforces this).
 */

export type Lang = 'en' | 'ar'

export interface Feature {
  title: string
  body: string
}

export interface Stat {
  value: string
  label: string
}

export interface Content {
  meta: { title: string; description: string }
  brand: { name: string; tagline: string }
  nav: {
    features: string
    cafes: string
    drivers: string
    download: string
    cta: string
    langToggle: string
    langToggleAria: string
    menuOpen: string
    menuClose: string
    skipToContent: string
  }
  store: { appStore: string; appStoreSub: string; googlePlay: string; googlePlaySub: string }
  hero: {
    eyebrow: string
    headline: string
    subhead: string
    trust: string[]
    mockupAlt: string
    screen: {
      greeting: string
      listening: string
      transcript: string
      matched: string
      product: string
      cafe: string
      price: string
      confirm: string
    }
  }
  differentiators: {
    heading: string
    subhead: string
    items: [Feature, Feature, Feature, Feature]
  }
  supporting: {
    heading: string
    items: Feature[]
  }
  howItWorks: {
    heading: string
    subhead: string
    steps: [Feature, Feature, Feature]
  }
  cafes: {
    eyebrow: string
    heading: string
    subhead: string
    items: Feature[]
    cta: string
    form: {
      title: string
      intro: string
      cafeName: string
      city: string
      contact: string
      contactHint: string
      message: string
      submit: string
      success: string
      close: string
      cancel: string
    }
  }
  drivers: {
    eyebrow: string
    heading: string
    subhead: string
    items: Feature[]
    cta: string
  }
  stats: {
    heading: string
    items: [Stat, Stat, Stat]
    source: string
  }
  download: {
    heading: string
    subhead: string
    note: string
  }
  footer: {
    tagline: string
    product: string
    company: string
    legal: string
    about: string
    contact: string
    privacy: string
    terms: string
    builtBy: string
    builtByName: string
    copyright: string
  }
}

const en: Content = {
  meta: {
    title: "CoffeeTalk — Saudi Arabia's AI-native coffee platform",
    description:
      "CoffeeTalk — Saudi Arabia's AI-native coffee platform. Order by voice or photo, book a table, order from several cafés at once, and earn smarter loyalty.",
  },
  brand: { name: 'CoffeeTalk', tagline: "Saudi Arabia's AI-native coffee platform" },
  nav: {
    features: 'Features',
    cafes: 'For Cafés',
    drivers: 'For Drivers',
    download: 'Download',
    cta: 'Get the app',
    langToggle: 'العربية',
    langToggleAria: 'التبديل إلى العربية',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    skipToContent: 'Skip to content',
  },
  store: {
    appStore: 'App Store',
    appStoreSub: 'Download on the',
    googlePlay: 'Google Play',
    googlePlaySub: 'Get it on',
  },
  hero: {
    eyebrow: "Saudi Arabia's AI-native coffee platform",
    headline: 'Coffee, the way you’d ask a barista.',
    subhead:
      'Say your order or snap a photo of a drink. CoffeeTalk finds it, books your table, and learns what you love from cafés across the Kingdom.',
    trust: ['Arabic & English', 'Pickup & delivery', 'Table booking'],
    mockupAlt:
      'Illustration of the CoffeeTalk app: a voice order being transcribed and matched to a Spanish latte from a Riyadh café.',
    screen: {
      greeting: 'Good morning, Sara',
      listening: 'Listening…',
      transcript: '“My usual, but iced, and a cinnamon roll.”',
      matched: 'Matched to',
      product: 'Iced Spanish Latte',
      cafe: 'Brew Lab · Al Olaya',
      price: 'SAR 24',
      confirm: 'Confirm order',
    },
  },
  differentiators: {
    heading: 'Features no other delivery app in Saudi has',
    subhead: 'We don’t compete on discounts. We compete on what the app can do.',
    items: [
      {
        title: 'AI voice & image ordering',
        body: 'Say “my usual, extra hot” or snap a photo of any drink. We match it to a product on the menu.',
      },
      {
        title: 'Recommendations that learn you',
        body: 'Suggestions built from your own ordering history, not a static promo carousel.',
      },
      {
        title: 'Table reservations',
        body: 'Book a seat at your favourite café before you leave the house. Delivery is one option, not the only one.',
      },
      {
        title: 'Multi-store ordering',
        body: 'A flat white from one café, a cinnamon roll from another. One order, one checkout, one delivery.',
      },
    ],
  },
  supporting: {
    heading: 'And everything else you’d expect, done better',
    items: [
      { title: 'Subscriptions', body: 'Your daily cup on a plan. Pause any time.' },
      { title: 'Catering & business accounts', body: 'Office accounts with invoicing and meal allowances.' },
      { title: 'Pickup or delivery', body: 'Skip the queue, or have it brought to your door.' },
      { title: 'Dynamic AI loyalty', body: 'Challenges shaped by how you actually order, not a points card.' },
      { title: 'Mindful Sip', body: 'A gentle nudge when it’s your fourth espresso before noon.' },
      { title: 'Entertainment while you wait', body: 'Spotify and Anghami, right inside the order screen.' },
    ],
  },
  howItWorks: {
    heading: 'How it works',
    subhead: 'Three steps between you and your next cup.',
    steps: [
      { title: 'Order your way', body: 'Speak it, snap it, or tap it. Voice, photo, or the classic menu.' },
      {
        title: 'Café prepares, driver dispatched',
        body: 'The café gets your order instantly. A nearby driver is matched the moment it’s ready, or you pick it up.',
      },
      { title: 'Sip and earn', body: 'Enjoy it, then watch your loyalty challenge move forward.' },
    ],
  },
  cafes: {
    eyebrow: 'Partner app · for cafés & roasters',
    heading: 'Run the whole café from one screen',
    subhead: 'Built for cafés and roasters that want more than another delivery channel.',
    items: [
      { title: 'Orders & menu', body: 'Live orders, menu edits and prep times in one place.' },
      { title: 'Reservations', body: 'Fill tables on quiet afternoons with bookable seating.' },
      { title: 'Catering', body: 'Quote, confirm and invoice corporate orders.' },
      { title: 'Wholesale marketplace', body: 'Buy beans, milk and cups from roasters and suppliers in-app.' },
      { title: 'Barista network', body: 'Hire vetted baristas for a shift or a season.' },
    ],
    cta: 'Partner with us',
    form: {
      title: 'Partner with CoffeeTalk',
      intro: 'Tell us about your café and we’ll get back to you within two working days.',
      cafeName: 'Café name',
      city: 'City',
      contact: 'Contact',
      contactHint: 'Email or mobile number',
      message: 'Message',
      submit: 'Send request',
      success: 'Thanks! We’ll be in touch shortly.',
      close: 'Close',
      cancel: 'Cancel',
    },
  },
  drivers: {
    eyebrow: 'Driver app',
    heading: 'Drive on your terms',
    subhead: 'Smart dispatch, real safety tools, and payouts you can see before you accept.',
    items: [
      { title: 'Smart dispatch', body: 'Batched, nearby orders with clear pickup and drop-off.' },
      { title: 'Safety & SOS', body: 'One-tap SOS and live trip sharing.' },
      { title: 'Transparent payouts', body: 'See every delivery and every riyal before you accept.' },
      { title: 'Proof of delivery', body: 'Photo and PIN confirmation protects you and the customer.' },
    ],
    cta: 'Drive with CoffeeTalk',
  },
  stats: {
    heading: 'A market that’s ready',
    items: [
      { value: 'SAR 24B', label: 'Saudi food-delivery market' },
      { value: '13M+', label: 'yearly active users' },
      { value: '85%+', label: 'of orders placed on mobile' },
    ],
    source: 'Saudi food-delivery market figures.',
  },
  download: {
    heading: 'Your next cup is one tap away',
    subhead: 'Coming soon on iOS and Android, in Arabic and English.',
    note: 'Store links will go live at launch.',
  },
  footer: {
    tagline: "Saudi Arabia's AI-native coffee platform.",
    product: 'Product',
    company: 'Company',
    legal: 'Legal',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    builtBy: 'Built by',
    builtByName: 'The Sailors AI',
    copyright: '© 2026 CoffeeTalk. All rights reserved.',
  },
}

const ar: Content = {
  meta: {
    title: 'كوفي توك — منصة القهوة السعودية المدعومة بالذكاء الاصطناعي',
    description:
      'كوفي توك — منصة القهوة السعودية المدعومة بالذكاء الاصطناعي. اطلب بالصوت أو بالصورة، احجز طاولتك، اطلب من عدة مقاهٍ في طلب واحد، واكسب ولاءً أذكى.',
  },
  brand: { name: 'كوفي توك', tagline: 'منصة القهوة السعودية المدعومة بالذكاء الاصطناعي' },
  nav: {
    features: 'المزايا',
    cafes: 'للمقاهي',
    drivers: 'للسائقين',
    download: 'حمّل التطبيق',
    cta: 'احصل على التطبيق',
    langToggle: 'English',
    langToggleAria: 'Switch to English',
    menuOpen: 'فتح القائمة',
    menuClose: 'إغلاق القائمة',
    skipToContent: 'الانتقال إلى المحتوى',
  },
  store: {
    appStore: 'App Store',
    appStoreSub: 'حمّله من',
    googlePlay: 'Google Play',
    googlePlaySub: 'احصل عليه من',
  },
  hero: {
    eyebrow: 'منصة القهوة السعودية المدعومة بالذكاء الاصطناعي',
    headline: 'قهوتك، كما تطلبها من الباريستا.',
    subhead:
      'قل طلبك أو صوّر مشروبك، وكوفي توك يجده لك، يحجز طاولتك، ويتعلّم ذوقك من المقاهي في أنحاء المملكة.',
    trust: ['عربي وإنجليزي', 'استلام وتوصيل', 'حجز الطاولات'],
    mockupAlt: 'رسم توضيحي لتطبيق كوفي توك: طلب صوتي يُحوَّل إلى نص ويُطابَق مع سبانش لاتيه من مقهى في الرياض.',
    screen: {
      greeting: 'صباح الخير يا سارة',
      listening: 'أستمع إليك…',
      transcript: '«طلبي المعتاد بس مثلّج، ومعه سينامون رول.»',
      matched: 'تمت المطابقة مع',
      product: 'سبانش لاتيه مثلّج',
      cafe: 'برو لاب · العليا',
      price: '24 ر.س',
      confirm: 'تأكيد الطلب',
    },
  },
  differentiators: {
    heading: 'مزايا لا تجدها في أي تطبيق توصيل آخر في السعودية',
    subhead: 'لا ننافس بالخصومات، بل بما يقدر التطبيق يقدّمه لك.',
    items: [
      {
        title: 'الطلب بالصوت والصورة',
        body: 'قل «طلبي المعتاد، حار زيادة» أو صوّر أي مشروب، ونطابقه لك مع منتج في القائمة.',
      },
      {
        title: 'توصيات تتعلّم ذوقك',
        body: 'اقتراحات مبنية على طلباتك السابقة أنت، لا على عروض ثابتة تُعرض للجميع.',
      },
      {
        title: 'حجز الطاولات',
        body: 'احجز مقعدك في مقهاك المفضل قبل أن تخرج من البيت. التوصيل خيار، وليس الخيار الوحيد.',
      },
      {
        title: 'طلب واحد من عدة مقاهٍ',
        body: 'فلات وايت من مقهى، وسينامون رول من مقهى آخر. طلب واحد، دفعة واحدة، توصيلة واحدة.',
      },
    ],
  },
  supporting: {
    heading: 'وكل ما تتوقعه من تطبيق قهوة، بشكل أفضل',
    items: [
      { title: 'الاشتراكات', body: 'فنجانك اليومي باشتراك. أوقفه متى شئت.' },
      { title: 'الضيافة وحسابات الشركات', body: 'حسابات للشركات مع فواتير وبدلات وجبات للموظفين.' },
      { title: 'استلام أو توصيل', body: 'تجاوز الطابور، أو استلمه عند بابك.' },
      { title: 'ولاء ذكي ومتغيّر', body: 'تحديات تُبنى على طريقة طلبك الفعلية، وليست بطاقة نقاط.' },
      { title: 'رشفة واعية', body: 'تنبيه لطيف عندما يكون هذا إسبريسوك الرابع قبل الظهر.' },
      { title: 'ترفيه أثناء الانتظار', body: 'Spotify وأنغامي داخل شاشة الطلب مباشرة.' },
    ],
  },
  howItWorks: {
    heading: 'كيف يعمل',
    subhead: 'ثلاث خطوات بينك وبين فنجانك القادم.',
    steps: [
      { title: 'اطلب بطريقتك', body: 'بالصوت أو بالصورة أو باللمس. كما يناسبك.' },
      {
        title: 'المقهى يجهّز والسائق في الطريق',
        body: 'يصل طلبك إلى المقهى فورًا، ويُرسل أقرب سائق لحظة جاهزيته، أو تستلمه بنفسك.',
      },
      { title: 'استمتع واكسب', body: 'استمتع بقهوتك، وتابع تقدّمك في تحدي الولاء.' },
    ],
  },
  cafes: {
    eyebrow: 'تطبيق الشريك · للمقاهي والمحامص',
    heading: 'أدر مقهاك بالكامل من شاشة واحدة',
    subhead: 'صُمّم للمقاهي والمحامص التي تريد أكثر من مجرد قناة توصيل إضافية.',
    items: [
      { title: 'الطلبات والقائمة', body: 'الطلبات المباشرة وتعديل القائمة وأوقات التحضير في مكان واحد.' },
      { title: 'الحجوزات', body: 'املأ طاولاتك في فترات الهدوء بحجوزات مسبقة.' },
      { title: 'الضيافة', body: 'قدّم عروض الأسعار، وأكّد الطلبات، وأصدر فواتير الشركات.' },
      { title: 'سوق الجملة', body: 'اشترِ البن والحليب والأكواب من المحامص والموردين داخل التطبيق.' },
      { title: 'شبكة الباريستا', body: 'وظّف باريستا موثوقين لوردية واحدة أو لموسم كامل.' },
    ],
    cta: 'كن شريكًا معنا',
    form: {
      title: 'الشراكة مع كوفي توك',
      intro: 'عرّفنا على مقهاك وسنتواصل معك خلال يومي عمل.',
      cafeName: 'اسم المقهى',
      city: 'المدينة',
      contact: 'وسيلة التواصل',
      contactHint: 'بريد إلكتروني أو رقم جوال',
      message: 'رسالتك',
      submit: 'إرسال الطلب',
      success: 'شكرًا لك! سنتواصل معك قريبًا.',
      close: 'إغلاق',
      cancel: 'إلغاء',
    },
  },
  drivers: {
    eyebrow: 'تطبيق السائق',
    heading: 'اعمل بشروطك',
    subhead: 'توزيع ذكي للطلبات، أدوات أمان حقيقية، وأرباح تراها قبل أن تقبل.',
    items: [
      { title: 'توزيع ذكي', body: 'طلبات قريبة ومجمّعة مع نقاط استلام وتسليم واضحة.' },
      { title: 'الأمان وزر الطوارئ', body: 'زر طوارئ بلمسة واحدة ومشاركة الرحلة مباشرة.' },
      { title: 'أرباح شفافة', body: 'اطّلع على كل توصيلة وكل ريال قبل أن تقبل الطلب.' },
      { title: 'إثبات التسليم', body: 'تأكيد بالصورة ورمز PIN يحميك ويحمي العميل.' },
    ],
    cta: 'انضم كسائق مع كوفي توك',
  },
  stats: {
    heading: 'سوق جاهز',
    items: [
      { value: '24 مليار ر.س', label: 'حجم سوق توصيل الطعام في السعودية' },
      { value: '+13 مليون', label: 'مستخدم نشط سنويًا' },
      { value: '+85٪', label: 'من الطلبات عبر الجوال' },
    ],
    source: 'أرقام سوق توصيل الطعام في السعودية.',
  },
  download: {
    heading: 'قهوتك القادمة على بُعد لمسة',
    subhead: 'قريبًا على iOS وAndroid، بالعربية والإنجليزية.',
    note: 'روابط المتاجر ستُفعَّل عند الإطلاق.',
  },
  footer: {
    tagline: 'منصة القهوة السعودية المدعومة بالذكاء الاصطناعي.',
    product: 'المنتج',
    company: 'الشركة',
    legal: 'قانوني',
    about: 'من نحن',
    contact: 'تواصل معنا',
    privacy: 'سياسة الخصوصية',
    terms: 'شروط الاستخدام',
    builtBy: 'من تطوير',
    builtByName: 'The Sailors AI',
    copyright: '© 2026 كوفي توك. جميع الحقوق محفوظة.',
  },
}

export const content: Record<Lang, Content> = { en, ar }
