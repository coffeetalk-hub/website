import type { Dictionary } from './types'

export const en: Dictionary = {
  meta: {
    title: 'CoffeeTalk for Drivers — Deliver coffee, on your terms',
    description:
      'Apply to drive with CoffeeTalk: go online when it suits you, take the orders you want, and let the app pick the nearest order and the fastest route.',
    ogLocale: 'en_US',
  },
  brand: { name: 'CoffeeTalk', product: 'Drivers' },
  nav: {
    features: 'Features',
    how: 'How it works',
    earnings: 'Getting paid',
    safety: 'Safety',
    faq: 'FAQ',
    apply: 'Apply to drive',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    skip: 'Skip to content',
    langToggle: 'عربي',
    langToggleAria: 'التبديل إلى العربية',
  },
  hero: {
    eyebrow: 'The CoffeeTalk Driver app',
    headline: 'Deliver coffee, on your terms.',
    subline:
      'Go online when it suits you, take the orders you want, and let the app match you to the nearest order and the fastest route.',
    primary: 'Apply to drive',
    secondary: 'See how it works',
    chips: ['Apply from your phone', 'Orders near you', 'Every trip on record'],
    screenAlt: 'Driver app home screen: the "Available now" switch is on and a nearby order is waiting to be accepted.',
  },
  themes: {
    eyebrow: 'Features',
    heading: 'Built for the driver, not just the order.',
    subhead: 'Every feature serves one goal: work the way you want, and deliver coffee in its best state.',
    signature: 'Only on CoffeeTalk',
    comingLater: 'Coming later',
    items: [
      {
        id: 'start',
        title: 'Start fast, start verified',
        benefit: 'Apply from your phone. Once the CoffeeTalk team approves you, every shift starts with a check that takes seconds.',
        screen: 'checkIn',
        features: [
          {
            name: 'Application',
            desc: 'Driving licence, vehicle or bike registration, and national ID or iqama.',
          },
          {
            name: 'Approval & terms',
            desc: 'The CoffeeTalk team reviews your documents and you accept the terms. No orders until you’re approved.',
            signature: true,
          },
          {
            name: 'Face verification',
            desc: 'A quick face scan at sign-in, matched to your registered profile.',
          },
          {
            name: 'Uniform & hygiene check',
            desc: 'Gloves, mask, the CoffeeTalk uniform, and the outfit check for Premium handoffs.',
          },
        ],
        note: {
          label: 'AI',
          text: 'An automatic visual check at sign-in flags anything missing before the shift starts, not after the first complaint.',
        },
      },
      {
        id: 'flex',
        title: 'Work when you want',
        benefit: 'You decide when you’re available, when you take a break, and which orders you accept.',
        features: [
          {
            name: 'Online / Offline',
            desc: 'An “Available now” switch to receive orders, and a pause for breaks.',
            signature: true,
          },
          {
            name: 'Accept / Decline',
            desc: 'A response window for each proposed order (about 15 seconds), with an optional decline reason.',
            signature: true,
          },
          {
            name: 'Settings',
            desc: 'Update vehicle and bank details, the language, and each notification on its own.',
          },
        ],
        note: {
          label: 'Note',
          text: 'Repeated declines without a clear reason affect your internal rating in the app.',
        },
      },
      {
        id: 'smart',
        title: 'Smarter trips, less wasted time',
        benefit: 'The app matches you to the nearest order, picks the fastest route, and sequences drop-offs so the coffee arrives in its best state.',
        screen: 'order',
        features: [
          { name: 'Best match', desc: 'The nearest available driver for each order, by distance and time.' },
          { name: 'Traffic & route', desc: 'Live traffic analysis and the fastest route by time.' },
          { name: 'Temperature-safe ETA', desc: 'Hot stays hot. Cold doesn’t melt.' },
          {
            name: 'Batched orders',
            desc: 'Two nearby orders in one trip, delivered in a sequence that keeps each at the right temperature.',
            signature: true,
          },
        ],
        note: {
          label: 'AI',
          text: 'Matching isn’t just “nearest driver”: the app factors in the drink and its temperature, and only batches two orders when it’s sure neither will suffer.',
        },
      },
      {
        id: 'protected',
        title: 'Every trip protected',
        benefit: 'Every move is on record and tied to the map from start to finish. It protects you, the customer, and the café.',
        screen: 'route',
        features: [
          {
            name: 'Bound to route',
            desc: 'No side orders outside the app, and an instant alert if you leave the route.',
          },
          {
            name: 'Live journey map',
            desc: 'The customer and the café see your trip live. Tracking stops at delivery.',
          },
          { name: 'Trip history', desc: 'The full route is saved after the delivery is complete.' },
          {
            name: 'Incident report',
            desc: 'An official record after any incident, with photos and a description, for insurance and admin follow-up.',
            signature: true,
          },
        ],
        note: {
          label: 'Different from SOS',
          text: 'SOS is immediate help in a dangerous moment. An incident report is documentation after the situation is over.',
        },
      },
      {
        id: 'tier',
        title: 'Grow into Butler',
        benefit: 'Every driver starts at Standard. Reach the required rating and trip count, and the Butler tier unlocks automatically.',
        comingLater: true,
        features: [
          { name: 'Standard tier', desc: 'Single or standard batched deliveries.' },
          { name: 'Butler tier', desc: 'An earned upgrade that qualifies you for multi-store trips.' },
          { name: 'Your tier, visible', desc: 'Your current tier shows clearly on the home screen.' },
          { name: 'Unlock conditions', desc: 'A minimum rating, a number of completed trips, and a clean record.' },
        ],
      },
    ],
  },
  how: {
    eyebrow: 'How it works',
    heading: 'From applying to your first delivery',
    subhead: 'Four steps, all from your phone.',
    steps: [
      { title: 'Apply from your phone', desc: 'Upload your driving licence, vehicle or bike registration, and ID or iqama.' },
      { title: 'Get approved', desc: 'The CoffeeTalk team reviews your documents and you accept the terms.' },
      { title: 'Daily check-in', desc: 'Face verification and the uniform & hygiene check. Seconds, then you’re set.' },
      { title: 'Go online and deliver', desc: 'Take the nearest order, follow the route, and hand over the coffee in its best state.' },
    ],
  },
  earnings: {
    eyebrow: 'Getting paid',
    heading: 'Your bank account, in Settings',
    body: 'Your bank account is linked to your driver profile, and you can update it from Settings at any time.',
    points: [
      { name: 'Bank account', desc: 'Add or update your bank details from Settings.' },
      { name: 'Vehicle details', desc: 'Change your registered car or bike from the same place.' },
    ],
    todo: '[TODO] Earnings structure and payout schedule: awaiting product input. Do not publish this page until this block is filled.',
  },
  safety: {
    eyebrow: 'Safety',
    heading: 'On record from the first metre to the last',
    subhead: 'Safety on CoffeeTalk isn’t an extra button. It’s how the app works.',
    points: [
      { name: 'Verified identity, every shift', desc: 'Face verification and a uniform check before you receive any order.' },
      { name: 'A route you keep, that others can see', desc: 'An alert if you leave the route, and the customer and café follow the trip live.' },
      { name: 'Every incident on record', desc: 'Photos and a description, for insurance and admin follow-up.' },
    ],
    sosNote: 'SOS is for immediate help in a dangerous moment. The incident report documents what happened once it’s over.',
  },
  requirements: {
    eyebrow: 'Requirements',
    heading: 'What you need to apply',
    subhead: 'Have these ready. The rest happens in the app.',
    items: [
      'A valid driving licence',
      'Vehicle or bike registration',
      'National ID or iqama',
      'Accepting the terms of use once the CoffeeTalk team approves you',
      'Being ready for the daily check-in: face verification, and the CoffeeTalk uniform with gloves and mask',
    ],
    cta: 'Apply now',
  },
  faq: {
    eyebrow: 'FAQ',
    heading: 'What drivers usually ask',
    items: [
      {
        q: 'How do I apply?',
        a: 'Straight from the app: upload your driving licence, vehicle or bike registration, and national ID or iqama. The CoffeeTalk team reviews the documents, then you accept the terms of use.',
      },
      {
        q: 'When can I start receiving orders?',
        a: 'After the CoffeeTalk team approves your application. Before approval, the daily check-in doesn’t open and you don’t receive any orders.',
      },
      {
        q: 'What is the daily check-in?',
        a: 'A quick face scan matched to your profile, plus an automatic visual check for gloves, mask, and the CoffeeTalk uniform. If anything is missing, the shift doesn’t start until you fix it.',
      },
      {
        q: 'Do I have to accept every order?',
        a: 'No. Each proposed order has a response window of about 15 seconds, and you can decline with an optional reason. Repeated declines without a clear reason affect your internal rating.',
      },
      {
        q: 'How does the app pick orders for me?',
        a: 'It matches you to the nearest order by distance and time, and factors in traffic, the drink type, and its temperature. It only batches two orders into one trip when it’s sure neither will suffer.',
      },
      {
        q: 'Can I take orders outside the app during a trip?',
        a: 'No. The trip is bound to its route, you get an alert if you leave it, and the customer and café see your trip live. The full route is saved in trip history after delivery.',
      },
      {
        q: 'What do I do if there’s an accident or breakdown?',
        a: 'Use the incident report to document what happened with photos and a description, for insurance and admin follow-up. SOS is for immediate help in a dangerous moment.',
      },
      {
        q: 'How do I get paid?',
        a: 'Your bank account is linked to your driver profile and you can update it from Settings. [TODO] Earnings structure and payout schedule awaiting product input.',
      },
    ],
  },
  finalCta: {
    heading: 'Ready to start?',
    subhead: 'Apply from your phone today. Your first shift is right after approval.',
    primary: 'Apply to drive',
  },
  waitlist: {
    title: 'Apply to drive with CoffeeTalk',
    intro: 'Leave your details and we’ll contact you as soon as applications open in your city.',
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
    submit: 'Send my application',
    submitting: 'Sending…',
    successTitle: 'Got it!',
    successBody: 'We’ll contact you on your mobile number as soon as applications open in your city.',
    errorGeneric: 'We couldn’t send your application. Please try again in a moment.',
    errors: {
      name: 'Enter your name.',
      phone: 'Enter a valid Saudi mobile number (starts with 05 or +9665).',
      city: 'Choose your city.',
    },
    close: 'Close',
  },
  footer: {
    tagline: 'The CoffeeTalk Driver app.',
    links: 'On this page',
    contact: 'Contact',
    contactTodo: '[TODO] contact email or phone',
    legal: 'Legal',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    copyright: '© 2026 CoffeeTalk. All rights reserved.',
  },
  screensAlt: {
    checkIn: 'Daily check-in screen: face verification and the uniform checklist.',
    order: 'New order screen with the acceptance countdown and accept / decline buttons.',
    route: 'Live map screen with the trip route from the café to the customer.',
  },
}
