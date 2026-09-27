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

export interface AppFeatureGroup {
  title: string
  /** One-line context shown under the title (optional). */
  body?: string
  chips: string[]
  /** 'signature' = a CoffeeTalk-only feature; 'soon' = phase 2. */
  tag?: 'signature' | 'soon'
  /** Example in-app message, rendered as a chat bubble (optional). */
  quote?: string
}

export interface AppTab {
  id: string
  name: string
  tagline: string
  /** Whole tab ships in phase 2. */
  soon?: boolean
  groups: AppFeatureGroup[]
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
  appTour: {
    eyebrow: string
    heading: string
    subhead: string
    signatureBadge: string
    soonBadge: string
    tablistLabel: string
    tabs: AppTab[]
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
    form: {
      title: string
      intro: string
      name: string
      phone: string
      phoneHint: string
      city: string
      cityPlaceholder: string
      cities: { value: string; label: string }[]
      vehicle: string
      vehicles: { value: string; label: string }[]
      submit: string
      submitting: string
      successTitle: string
      successBody: string
      errorGeneric: string
      errors: { name: string; phone: string; city: string; vehicle: string }
      close: string
    }
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
    driveWithUs: string
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
    heading: 'Coffee ordering, reimagined',
    subhead: 'Order by voice or photo, book your table, and let the app learn your taste.',
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
    heading: 'More',
    items: [
      { title: 'Subscriptions', body: 'Your daily cup on a plan. Pause any time.' },
      { title: 'Catering & business accounts', body: 'Office accounts with invoicing and meal allowances.' },
      { title: 'Pickup or delivery', body: 'Skip the queue, or have it brought to your door.' },
      { title: 'Dynamic AI loyalty', body: 'Challenges shaped by how you actually order, not a points card.' },
      { title: 'Mindful Sip', body: 'A gentle nudge when it’s your fourth espresso before noon.' },
      { title: 'Entertainment while you wait', body: 'Spotify and Anghami, right inside the order screen.' },
    ],
  },
  appTour: {
    eyebrow: 'Customer app',
    heading: 'Everything in the app',
    subhead: 'All the features, by area.',
    signatureBadge: 'Signature',
    soonBadge: 'Coming soon',
    tablistLabel: 'App sections',
    tabs: [
      {
        id: 'home',
        name: 'Home',
        tagline: 'A landing screen that’s personal from day one.',
        groups: [
          {
            title: 'For You',
            body: 'Opens on what you’re most likely to want right now.',
            chips: ['AI recommendations', 'Smart reordering', 'Trending drinks'],
          },
          {
            title: 'Nearby & Now',
            chips: ['Featured cafés', 'Nearby shops', 'Recently visited'],
          },
          {
            title: 'Buzz',
            chips: ['Promotions', 'Upcoming events'],
            tag: 'soon',
          },
        ],
      },
      {
        id: 'order',
        name: 'Order',
        tagline: 'Order · Delivery · Pickup',
        groups: [
          {
            title: 'Browse & Build',
            chips: ['Search by drink or café', 'Menu by café', 'Image-to-order', 'Voice-to-order'],
          },
          {
            title: 'Recommend Me',
            body: 'An in-app assistant that picks by mood and weather, and answers questions about the menu.',
            chips: ['Mood & weather picks', 'Ask about the menu'],
            tag: 'signature',
            quote: '“Hot one today ☀️ Feel like a juice? Try the mango, it just landed and it’s refreshing.”',
          },
          {
            title: 'My Usuals',
            chips: ['Order history', 'Favorites', 'View / download invoice'],
          },
          {
            title: 'Cart Review',
            chips: ['Items & quantities', 'Edit before confirming', 'Total price'],
          },
          {
            title: 'Group Orders',
            body: 'An office of five opens one cart, everyone adds their own drink, one person confirms.',
            chips: ['Shared cart + invite link', 'Everyone adds their own', 'Closing deadline', 'Host pays or split payment'],
          },
        ],
      },
      {
        id: 'discover',
        name: 'Discover',
        tagline: 'Explore · Map · Booking',
        groups: [
          {
            title: 'Coffeepedia',
            chips: ['Origins & beans', 'Recipes & brewing'],
          },
          {
            title: 'Recipe Hub',
            body: 'Search by name, bean or brewer. Users publish their own recipes; verified baristas get a badge.',
            chips: ['Search by bean or brewer (V60, Moka, French press)', 'User-submitted recipes', 'Verified-barista badge', 'Save recipe ♥'],
          },
          {
            title: 'Local Picks',
            body: 'The best drinks in your city, ranked by real likes and ratings.',
            chips: ['Best coffees to try in your city', 'Ranked by likes & ratings'],
            tag: 'signature',
            quote: '“The 5 drinks you have to try in Khobar this week ☕”',
          },
          {
            title: 'Around Me',
            chips: ['Live map', 'Navigation', 'Check-in', 'Ratings on every pin'],
            tag: 'soon',
          },
        ],
      },
      {
        id: 'community',
        name: 'Community',
        tagline: 'Coffee social',
        soon: true,
        groups: [
          {
            title: 'The Table',
            chips: ['Coffee feed', 'Follow friends & baristas', 'Clubs & discussions'],
          },
          {
            title: 'Chats',
            chips: ['Group / club chats', 'Direct messages'],
          },
          {
            title: 'Gatherings',
            chips: ['Tastings & meetups', 'Workshops'],
          },
          {
            title: 'People Like You',
            body: 'Matched on the drinks and cafés you actually like.',
            chips: ['Suggested coffee friends'],
          },
          {
            title: 'The Guild',
            chips: ['Become a barista', 'Freelance trainers'],
          },
        ],
      },
      {
        id: 'profile',
        name: 'Profile',
        tagline: 'My coffee journey',
        groups: [
          {
            title: 'Account & Settings',
            chips: ['Profile info', 'Saved addresses', 'Per-notification toggles', 'Language', 'Delete account'],
          },
          {
            title: 'My Favorites',
            body: 'Cafés, baristas and recipes, all in one place.',
            chips: ['Favorite cafés', 'Favorite baristas', 'Saved recipes'],
            tag: 'signature',
          },
          {
            title: 'Verified Discounts',
            body: 'Verify a student or company ID once; the discount applies itself.',
            chips: ['Student ID → student discount', 'Company ID (e.g. Aramco)', 'Auto-applied after verification'],
            tag: 'signature',
          },
          {
            title: 'Perks',
            chips: ['Personalized challenges', 'Autonomous AI loyalty'],
          },
          {
            title: 'Premium Membership',
            chips: ['Monthly / yearly plan', 'Free or reduced delivery', 'Exclusive discounts & perks'],
            tag: 'signature',
          },
        ],
      },
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
    form: {
      title: 'Apply to drive with CoffeeTalk',
      intro: 'Leave your details and we’ll contact you when driver onboarding opens in your city.',
      name: 'Name',
      phone: 'Mobile number',
      phoneHint: 'e.g. 05xxxxxxxx or +9665xxxxxxxx',
      city: 'City',
      cityPlaceholder: 'Choose your city',
      cities: [
        { value: 'riyadh', label: 'Riyadh' },
        { value: 'jeddah', label: 'Jeddah' },
        { value: 'makkah', label: 'Makkah' },
        { value: 'eastern', label: 'Eastern Province (Dammam, Khobar, Dhahran)' },
        { value: 'other', label: 'Another city' },
      ],
      vehicle: 'Vehicle',
      vehicles: [
        { value: 'car', label: 'Car' },
        { value: 'bike', label: 'Motorbike' },
      ],
      submit: 'Send my application',
      submitting: 'Sending…',
      successTitle: 'Got it!',
      successBody: 'We’ll contact you on your mobile number when onboarding opens in your city.',
      errorGeneric: 'We couldn’t send your application. Please try again in a moment.',
      errors: {
        name: 'Enter your name.',
        phone: 'Enter a valid Saudi mobile number (starts with 05 or +9665).',
        city: 'Choose your city.',
        vehicle: 'Choose your vehicle.',
      },
      close: 'Close',
    },
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
    driveWithUs: 'Apply as a driver',
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
    heading: 'تجربة قهوة مختلفة من أول طلب',
    subhead: 'اطلب بالصوت أو بالصورة، احجز طاولتك، ودع التطبيق يتعلّم ذوقك.',
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
    heading: 'وأيضًا',
    items: [
      { title: 'الاشتراكات', body: 'فنجانك اليومي باشتراك. أوقفه متى شئت.' },
      { title: 'الضيافة وحسابات الشركات', body: 'حسابات للشركات مع فواتير وبدلات وجبات للموظفين.' },
      { title: 'استلام أو توصيل', body: 'تجاوز الطابور، أو استلمه عند بابك.' },
      { title: 'ولاء ذكي ومتغيّر', body: 'تحديات تُبنى على طريقة طلبك الفعلية، وليست بطاقة نقاط.' },
      { title: 'رشفة واعية', body: 'تنبيه لطيف عندما يكون هذا إسبريسوك الرابع قبل الظهر.' },
      { title: 'ترفيه أثناء الانتظار', body: 'Spotify وأنغامي داخل شاشة الطلب مباشرة.' },
    ],
  },
  appTour: {
    eyebrow: 'تطبيق العميل',
    heading: 'كل ما في التطبيق',
    subhead: 'جميع المزايا، حسب القسم.',
    signatureBadge: 'ميزة كوفي توك',
    soonBadge: 'قريبًا',
    tablistLabel: 'أقسام التطبيق',
    tabs: [
      {
        id: 'home',
        name: 'الرئيسية',
        tagline: 'صفحة رئيسية شخصية من أول يوم.',
        groups: [
          {
            title: 'توصيات ذكية',
            body: 'تفتح على ما تشتهيه الآن على الأرجح.',
            chips: ['توصيات بالذكاء الاصطناعي', 'إعادة طلب ذكية', 'المشروبات الرائجة'],
          },
          {
            title: 'حولك الآن',
            chips: ['كافيهات مميزة', 'المتاجر القريبة', 'زرتها مؤخرًا'],
          },
          {
            title: 'عروض وفعاليات',
            chips: ['العروض', 'الفعاليات القادمة'],
            tag: 'soon',
          },
        ],
      },
      {
        id: 'order',
        name: 'الطلب',
        tagline: 'طلب · توصيل · استلام',
        groups: [
          {
            title: 'تصفّح واختيار',
            chips: ['بحث بالمشروب أو الكافيه', 'القائمة حسب الكافيه', 'الطلب بالصورة', 'الطلب بالصوت'],
          },
          {
            title: 'مساعد الطلب',
            body: 'مساعد داخل التطبيق يرشّح لك حسب الجو والمزاج، ويجيب عن استفساراتك بالمنيو.',
            chips: ['ترشيح حسب الجو والمزاج', 'استفسارات بالمنيو'],
            tag: 'signature',
            quote: '«الجو حار اليوم ☀️ مشتهي عصير؟ جرّب المانجو، توّه نازل ومنعش!»',
          },
          {
            title: 'طلباتي',
            chips: ['سجل الطلبات', 'المفضلة', 'عرض / تحميل الفاتورة'],
          },
          {
            title: 'مراجعة السلة',
            chips: ['مراجعة الأصناف والكمية', 'تعديل قبل التأكيد', 'السعر الإجمالي'],
          },
          {
            title: 'طلب جماعي',
            body: 'مكتب فيه خمسة موظفين: أحدهم يفتح سلة مشتركة، كل واحد يضيف مشروبه، وواحد يؤكد الطلب.',
            chips: ['سلة مشتركة + رابط دعوة', 'كل شخص يضيف طلبه بنفسه', 'مهلة زمنية لإغلاق السلة', 'صاحب السلة يدفع أو تقسيم الدفع'],
          },
        ],
      },
      {
        id: 'discover',
        name: 'استكشف',
        tagline: 'استكشاف · خريطة · حجز',
        groups: [
          {
            title: 'مكتبة القهوة',
            chips: ['أصول البن وأنواعه', 'الوصفات وطرق التحضير'],
          },
          {
            title: 'وصفات القهوة',
            body: 'ابحث بالاسم أو نوع البن أو الأداة. المستخدمون ينشرون وصفاتهم، والباريستا الموثّق يحصل على شارة.',
            chips: ['بحث حسب البن أو الأداة (V60، موكا، فرنش برس)', 'وصفات من المستخدمين', 'شارة باريستا موثّق', 'حفظ الوصفة ♥'],
          },
          {
            title: 'أفضل ما في مدينتك',
            body: 'أفضل المشروبات في مدينتك، مرتّبة حسب الإعجابات والتقييمات الحقيقية.',
            chips: ['أفضل القهوة في مدينتك', 'مبني على الإعجابات والتقييمات'],
            tag: 'signature',
            quote: '«أفضل 5 مشروبات لازم تجرّبها بالخبر هذا الأسبوع ☕»',
          },
          {
            title: 'الخريطة التفاعلية',
            chips: ['خريطة مباشرة', 'التنقّل', 'تسجيل الحضور', 'التقييم على كل دبوس'],
            tag: 'soon',
          },
        ],
      },
      {
        id: 'community',
        name: 'المجتمع',
        tagline: 'مجتمع القهوة',
        soon: true,
        groups: [
          {
            title: 'الطاولة',
            chips: ['فيد القهوة', 'تابع أصدقاءك والباريستا', 'نوادٍ ونقاشات'],
          },
          {
            title: 'المحادثات',
            chips: ['محادثات المجموعات والنوادي', 'رسائل مباشرة'],
          },
          {
            title: 'الفعاليات والورش',
            chips: ['جلسات تذوّق ولقاءات', 'ورش عمل'],
          },
          {
            title: 'أشخاص مثلك',
            body: 'اقتراحات مبنية على المشروبات والكافيهات التي تحبها فعلًا.',
            chips: ['أصدقاء قهوة مقترحون'],
          },
          {
            title: 'فرص العمل',
            chips: ['كن باريستا', 'مدرّبون مستقلون'],
          },
        ],
      },
      {
        id: 'profile',
        name: 'حسابي',
        tagline: 'رحلتي مع القهوة',
        groups: [
          {
            title: 'الحساب والإعدادات',
            chips: ['معلومات الحساب', 'العناوين المحفوظة', 'تحكّم بكل تنبيه على حدة', 'اللغة', 'حذف الحساب'],
          },
          {
            title: 'مفضلتي',
            body: 'كافيهات وباريستا ووصفات، كلها في مكان واحد.',
            chips: ['الكافيهات المفضلة', 'الباريستا المفضلون', 'الوصفات المحفوظة'],
            tag: 'signature',
          },
          {
            title: 'خصومات موثّقة',
            body: 'وثّق هويتك الجامعية أو هوية الشركة مرة واحدة، والخصم يُفعَّل تلقائيًا.',
            chips: ['الهوية الجامعية ← خصم الطلاب', 'هوية الشركة (أرامكو وغيرها)', 'تفعيل تلقائي بعد التحقق'],
            tag: 'signature',
          },
          {
            title: 'الولاء الذكي',
            chips: ['تحديات شخصية', 'ولاء ذكي يتعلّم منك'],
          },
          {
            title: 'العضوية المميزة',
            chips: ['اشتراك شهري / سنوي', 'توصيل مجاني أو مخفّض', 'خصومات ومزايا حصرية'],
            tag: 'signature',
          },
        ],
      },
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
    form: {
      title: 'قدّم كسائق مع كوفي توك',
      intro: 'اترك بياناتك، ونتواصل معك عند فتح التسجيل للسائقين في مدينتك.',
      name: 'الاسم',
      phone: 'رقم الجوال',
      phoneHint: 'مثال: 05xxxxxxxx أو +9665xxxxxxxx',
      city: 'المدينة',
      cityPlaceholder: 'اختر مدينتك',
      cities: [
        { value: 'riyadh', label: 'الرياض' },
        { value: 'jeddah', label: 'جدة' },
        { value: 'makkah', label: 'مكة المكرمة' },
        { value: 'eastern', label: 'المنطقة الشرقية (الدمام، الخبر، الظهران)' },
        { value: 'other', label: 'مدينة أخرى' },
      ],
      vehicle: 'المركبة',
      vehicles: [
        { value: 'car', label: 'سيارة' },
        { value: 'bike', label: 'دراجة نارية' },
      ],
      submit: 'إرسال الطلب',
      submitting: 'جارٍ الإرسال…',
      successTitle: 'وصلنا طلبك!',
      successBody: 'سنتواصل معك على رقم جوالك عند فتح التسجيل في مدينتك.',
      errorGeneric: 'تعذّر إرسال طلبك. حاول مرة أخرى بعد قليل.',
      errors: {
        name: 'اكتب اسمك.',
        phone: 'اكتب رقم جوال سعودي صحيح (يبدأ بـ 05 أو +9665).',
        city: 'اختر مدينتك.',
        vehicle: 'اختر نوع المركبة.',
      },
      close: 'إغلاق',
    },
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
    driveWithUs: 'قدّم كسائق',
    privacy: 'سياسة الخصوصية',
    terms: 'شروط الاستخدام',
    builtBy: 'من تطوير',
    builtByName: 'The Sailors AI',
    copyright: '© 2026 كوفي توك. جميع الحقوق محفوظة.',
  },
}

export const content: Record<Lang, Content> = { en, ar }
