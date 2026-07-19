const BAD_WORDS = [
  "đm", "dm", "đjt", "djt", "địt", "dit",
  "cc", "clm", "cml", "cmm", "cmnr",
  "vl", "vcl", "vloz", "vlon",
  "đéo", "deo",
  "lồn", "lon",
  "cặc", "cac",
  "buồi", "buoi",
  "đĩ", "di",
  "óc chó", "oc cho",
  "ngu", "ngu si", "ngu dot", "ngu dốt",
  "chó chết", "cho chet",
  "thằng chó", "thang cho",
  "con điếm", "con diem",
  "súc vật", "suc vat",
  "khốn nạn", "khon nan",
  "fuck", "fck", "shit", "bitch", "asshole", "bastard", "motherfucker",
];
 

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
 
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
 
function containsProfanity(text) {
  if (!text) return false;
  const normalized = normalize(text);
  if (!normalized) return false;
 
  return BAD_WORDS.some((word) => {
    const normWord = normalize(word);
    if (!normWord) return false;
    const pattern = new RegExp(`\\b${escapeRegExp(normWord)}\\b`, "i");
    return pattern.test(normalized);
  });
}
 
module.exports = { containsProfanity, normalize };