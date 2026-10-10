// =========================================================
// 📊 ربط تأكيد الحضور والمباركات مع Google Sheets
// =========================================================
// طريقة التركيب (مرة واحدة فقط):
// 1) أنشئ ملف Google Sheets جديد.
// 2) من القائمة: الإضافات (Extensions) ← Apps Script.
// 3) احذف الكود الموجود والصق هذا الملف كاملاً، ثم احفظ.
// 4) نشر (Deploy) ← نشر جديد (New deployment) ← النوع: تطبيق ويب (Web app)
//      - التنفيذ باسم (Execute as): أنا (Me)
//      - من يمكنه الوصول (Who has access): أي شخص (Anyone)
// 5) وافق على الصلاحيات، ثم انسخ رابط تطبيق الويب (ينتهي بـ /exec)
//    وضعه في config.js داخل rsvp.sheetUrl
//
// ملاحظة: عند تعديل هذا الكود لاحقاً يجب عمل نشر جديد
// (Deploy ← Manage deployments ← تعديل ← New version) حتى يسري التعديل.
//
// لإخفاء مباركة من الدعوة: اكتب أي شيء في عمود "إخفاء" لنفس الصف.
// =========================================================

const SHEET_NAME = "الردود";
const HEADERS = ["التاريخ", "الاسم", "الحضور", "العدد", "المباركة", "إخفاء"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#f6dfe0");
  }
  return sh;
}

// استقبال رد جديد من نموذج الدعوة
function doPost(e) {
  const p = (e && e.parameter) || {};
  const name = clean_(p.name, 80);
  if (!name) return json_({ ok: false, error: "name" });
  const coming = p.attend === "yes";
  const guests = Math.min(Math.max(parseInt(p.guests, 10) || 1, 1), 20);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([new Date(), name, coming ? "سيحضر" : "معتذر", coming ? guests : 0, clean_(p.message, 500), ""]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

// إرجاع المباركات لعرضها في قسم "رسائل الأصدقاء"
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const messages = rows
    .filter((r) => r[4] && !r[5])
    .map((r) => ({ name: String(r[1]), message: String(r[4]) }))
    .reverse()
    .slice(0, 100);
  return json_({ messages: messages });
}

function clean_(v, max) {
  let s = String(v || "").trim().slice(0, max);
  // منع تنفيذ النص كمعادلة داخل الشيت
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
