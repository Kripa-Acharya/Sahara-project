/**
 * Minimal EN/NE translation dictionary for major labels.
 * The elder page and key navigation use this; full-sentence translation
 * is a documented follow-up for production.
 */

export type Lang = "en" | "ne";

const dictionary = {
  appName: { en: "साहारा", ne: "साहारा" },
  tagline: {
    en: "You may be far. Your care does not have to be.",
    ne: "तपाईं टाढा भए पनि तपाईंको माया जहिले सँगै हुन्छ।",
  },
  home: { en: "Home", ne: "गृहपृष्ठ" },
  login: { en: "Log in", ne: "लगइन" },
  register: { en: "Register", ne: "दर्ता गर्नुहोस्" },
  logout: { en: "Log out", ne: "लगआउट" },
  services: { en: "Services", ne: "सेवाहरू" },
  bookings: { en: "Bookings", ne: "बुकिङहरू" },
  bookVisit: { en: "Book a Visit", ne: "भेट बुक गर्नुहोस्" },
  myElders: { en: "My Elders", ne: "मेरा अभिभावक" },
  visitReports: { en: "Visit Reports", ne: "भेट प्रतिवेदन" },
  messages: { en: "Messages", ne: "सन्देशहरू" },
  payments: { en: "Payments", ne: "भुक्तानी" },
  settings: { en: "Settings", ne: "सेटिङ" },
  nextVisit: { en: "Your next visit", ne: "तपाईंको अर्को भेट" },
  companion: { en: "Companion", ne: "साथी" },
  callSupport: { en: "Call साहारा Support", ne: "साहारा सहयोगलाई फोन गर्नुहोस्" },
  callFamily: { en: "Call my family", ne: "परिवारसँग कुरा गर्ने" },
  todaysVisit: { en: "Today's visit", ne: "आजको भेट" },
  needHelp: { en: "I need help", ne: "सहयोग चाहियो" },
  emergencyHelp: { en: "Emergency help", ne: "आकस्मिक सहायता" },
  sos: { en: "Emergency / SOS", ne: "आपतकालीन / SOS" },
  sosHelp: { en: "Press only if you need urgent help", ne: "तत्काल सहयोग चाहिएमा मात्र थिच्नुहोस्" },
  visitDone: { en: "The visit is complete", ne: "भेट सम्पन्न भयो" },
  confirmVisit: { en: "Yes, the visit happened", ne: "हो, भेट भयो" },
  noUpcoming: { en: "No visit is scheduled yet", ne: "अहिले कुनै भेट तय छैन" },
  language: { en: "Language", ne: "भाषा" },
  english: { en: "English", ne: "अंग्रेजी" },
  nepali: { en: "नेपाली", ne: "नेपाली" },
  date: { en: "Date", ne: "मिति" },
  time: { en: "Time", ne: "समय" },
  emergencyDisclaimer: {
    en: "In a life-threatening situation, always call local emergency services first (Police 100, Ambulance 102).",
    ne: "जीवन जोखिममा परेमा पहिले स्थानीय आपतकालीन सेवा (प्रहरी १००, एम्बुलेन्स १०२) मा फोन गर्नुहोस्।",
  },
  sosSent: {
    en: "Alert sent. साहारा and your family have been notified.",
    ne: "सूचना पठाइयो। साहारा र तपाईंको परिवारलाई खबर गरियो।",
  },
} as const;

export type LabelKey = keyof typeof dictionary;

export function t(key: LabelKey, lang: Lang): string {
  return dictionary[key][lang];
}
