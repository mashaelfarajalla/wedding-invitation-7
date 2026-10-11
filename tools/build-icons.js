// يولّد icons.css بأيقونات Phosphor المستخدمة فقط (بدل تحميل المكتبة كاملة من الإنترنت)
// شغّله بعد إضافة أو تغيير أيقونة في index.html أو main.js أو config.js:
//   npm pack @phosphor-icons/core && tar -xzf phosphor-icons-core-*.tgz
//   node tools/build-icons.js package/assets
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const assets = process.argv[2];
if (!assets) { console.error("usage: node tools/build-icons.js <phosphor-core>/assets"); process.exit(1); }

const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const src = read("index.html") + read("main.js");
const config = read("config.js");
const used = new Set();
// <i class="ph-light ph-heart"> أو class="ph ph-copy"
for (const [, w, n] of src.matchAll(/\bph(?:-(light|fill|bold|duotone|thin))?\s+ph-([a-z0-9-]+)/g)) used.add(`${w || "regular"}:${n}`);
// أيقونات الإعدادات (التفاصيل والمباركات) تُرسم بوزن light
for (const [, n] of config.matchAll(/icon:\s*"([a-z0-9-]+)"/g)) used.add(`light:${n}`);
// أيقونات الإشعار toast(..., "x") بوزن fill، والافتراضية في main.js
for (const [, n] of src.matchAll(/toast\([^)]*,\s*"([a-z0-9-]+)"\)/g)) used.add(`fill:${n}`);
["light:sparkle", "light:heart"].forEach((k) => used.add(k));

let css = `/* مُولَّد بواسطة tools/build-icons.js — لا تعدّله يدويًا */
.ph,.ph-light,.ph-fill,.ph-bold,.ph-duotone,.ph-thin{display:inline-block;width:1em;height:1em;line-height:1;vertical-align:-.125em;flex-shrink:0;background-color:currentColor;-webkit-mask:var(--i) center/contain no-repeat;mask:var(--i) center/contain no-repeat}
`;
for (const key of [...used].sort()) {
  const [w, n] = key.split(":");
  const file = path.join(assets, w, w === "regular" ? `${n}.svg` : `${n}-${w}.svg`);
  if (!fs.existsSync(file)) { console.warn("missing icon:", key); continue; }
  const svg = fs.readFileSync(file, "utf8").replace(/\s+/g, " ").replace(/> </g, "><").trim();
  const uri = "data:image/svg+xml," + svg.replace(/"/g, "'").replace(/[<>#%]/g, encodeURIComponent);
  css += `.${w === "regular" ? "ph" : "ph-" + w}.ph-${n}{--i:url("${uri}")}\n`;
}
fs.writeFileSync(path.join(root, "icons.css"), css);
console.log(`icons.css: ${used.size} icons, ${(css.length / 1024).toFixed(1)} KB`);
