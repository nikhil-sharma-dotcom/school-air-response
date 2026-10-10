// PATH: src/rules/templates.js
// Tier-templated parent communications. EN + Hindi per ADR-007.
// {school} is substituted at render time.

export const TEMPLATES = {
  green: {
    en: (s) => `Air quality at ${s} is good today. Normal outdoor activities.`,
    hi: (s) => `${s} में आज हवा की गुणवत्ता अच्छी है। सामान्य बाहरी गतिविधियाँ।`,
  },
  yellow: {
    en: (s) => `Air quality at ${s} is moderate today. Limit strenuous outdoor activity.`,
    hi: (s) => `${s} में आज हवा की गुणवत्ता मध्यम है। कठिन बाहरी गतिविधि सीमित करें।`,
  },
  orange: {
    en: (s) => `Due to air pollution, all outdoor activities at ${s} are canceled today. Students will remain indoors with filtered air.`,
    hi: (s) => `वायु प्रदूषण के कारण, ${s} में आज सभी बाहरी गतिविधियाँ रद्द कर दी गई हैं। छात्र फ़िल्टर की हुई हवा में अंदर रहेंगे।`,
  },
  red: {
    en: (s) => `Severe air pollution at ${s}. All outdoor activities are canceled and students will remain indoors. School will close at the normal time unless we contact you again.`,
    hi: (s) => `${s} में गंभीर वायु प्रदूषण। सभी बाहरी गतिविधियाँ रद्द, छात्र अंदर रहेंगे। जब तक हम दोबारा संपर्क न करें, स्कूल सामान्य समय पर बंद होगा।`,
  },
};
