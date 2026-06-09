const GOVERNORATES_MAP = {
  
  cairo: "Cairo",
  giza: "Giza",
  alexandria: "Alexandria",
  dakahlia: "Dakahlia",
  redsea: "Red Sea",
  "red sea": "Red Sea",
  beheira: "Beheira",
  fayoum: "Fayoum",
  faiyum: "Fayoum",
  gharbia: "Gharbia",
  ismailia: "Ismailia",
  monufia: "Monufia",
  menofia: "Monufia",
  minya: "Minya",
  qalyubia: "Qalyubia",
  qalyobia: "Qalyubia",
  newvalley: "New Valley",
  "new valley": "New Valley",
  suez: "Suez",
  aswan: "Aswan",
  assiut: "Assiut",
  asyut: "Assiut",
  benisuef: "Beni Suef",
  "beni suef": "Beni Suef",
  portsaid: "Port Said",
  "port said": "Port Said",
  damietta: "Damietta",
  southsinai: "South Sinai",
  "south sinai": "South Sinai",
  kafrelsheikh: "Kafr El Sheikh",
  "kafr el sheikh": "Kafr El Sheikh",
  matrouh: "Matrouh",
  qena: "Qena",
  northsinai: "North Sinai",
  "north sinai": "North Sinai",
  sohag: "Sohag",
  luxor: "Luxor",
  sharqia: "Sharqia",
  sharkia: "Sharqia",

  
  "القاهره": "Cairo",
  "القاهرة": "Cairo",
  "الجيزه": "Giza",
  "الجيزة": "Giza",
  "الاسكندريه": "Alexandria",
  "الاسكندرية": "Alexandria",
  "الاقصر": "Luxor",
  "الأقصر": "Luxor",
  "اسوان": "Aswan",
  "أسوان": "Aswan",
  "اسيوط": "Assiut",
  "أسيوط": "Assiut",
  "البحيره": "Beheira",
  "البحيرة": "Beheira",
  "بني سويف": "Beni Suef",
  "بورسعيد": "Port Said",
  "الدقهليه": "Dakahlia",
  "الدقهلية": "Dakahlia",
  "دمياط": "Damietta",
  "الفيوم": "Fayoum",
  "الغربيه": "Gharbia",
  "الغربية": "Gharbia",
  "الاسماعيليه": "Ismailia",
  "الاسماعيلية": "Ismailia",
  "المنوفيه": "Monufia",
  "المنوفية": "Monufia",
  "المنيا": "Minya",
  "القليوبيه": "Qalyubia",
  "القليوبية": "Qalyubia",
  "قنا": "Qena",
  "البحر الاحمر": "Red Sea",
  "البحر الأحمر": "Red Sea",
  "الشرقيه": "Sharqia",
  "الشرقية": "Sharqia",
  "سوهاج": "Sohag",
  "جنوب سيناء": "South Sinai",
  "شمال سيناء": "North Sinai",
  "مطروح": "Matrouh",
  "كفر الشيخ": "Kafr El Sheikh",
  "الوادي الجديد": "New Valley"
};

function normalizeArabic(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u064B-\u0652]/g, "") 
    .replace(/[أإآ]/g, "ا")         
    .replace(/ة/g, "ه")            
    .replace(/ى/g, "ي")            
    .trim();
}

function validateAndNormalizeGovernorate(value) {
  if (!value || typeof value !== "string") return null;

  
  const cleanVal = value.trim().toLowerCase();
  if (GOVERNORATES_MAP[cleanVal]) {
    return GOVERNORATES_MAP[cleanVal];
  }

  
  const normalizedSpaces = cleanVal.replace(/[\s-_]+/g, " ");
  if (GOVERNORATES_MAP[normalizedSpaces]) {
    return GOVERNORATES_MAP[normalizedSpaces];
  }

  const noSpaces = cleanVal.replace(/[\s-_]+/g, "");
  if (GOVERNORATES_MAP[noSpaces]) {
    return GOVERNORATES_MAP[noSpaces];
  }

  
  const cleanArabic = normalizeArabic(value);
  if (GOVERNORATES_MAP[cleanArabic]) {
    return GOVERNORATES_MAP[cleanArabic];
  }

  const cleanArabicNoSpaces = cleanArabic.replace(/\s+/g, "");
  if (GOVERNORATES_MAP[cleanArabicNoSpaces]) {
    return GOVERNORATES_MAP[cleanArabicNoSpaces];
  }

  return null;
}

module.exports = {
  GOVERNORATES_MAP,
  validateAndNormalizeGovernorate
};
