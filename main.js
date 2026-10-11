(function () {
  const C = CONFIG;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ============ تعبئة المحتوى من الإعدادات ============
  const bindings = {
    groom: C.couple.groom,
    bride: C.couple.bride,
    eventType: C.eventType,
    heroInvite: C.heroInvite,
    heroDua: C.heroDua,
    hall: C.location.hall,
    address: C.location.address,
    monthYear: `${C.date.month} ${C.date.year}`,
    day: C.date.day,
    dayName: C.date.dayName,
    time: C.date.time,
    short: C.date.short,
    closingLine: C.closing.line,
    closingHighlight: C.closing.highlight,
    poem1: C.poem1,
    poem2: C.poem2,
    carrier: C.pageTitle,
    lockDate: `${C.date.dayName}، ${C.date.day} ${C.date.month}`,
    lockClock: C.date.time.split(" ")[0],
    bank: C.gift.bank,
    account: C.gift.account,
  };
  $$("[data-bind]").forEach((el) => {
    const v = bindings[el.dataset.bind];
    if (v !== undefined) el.textContent = v;
  });

  document.title = C.pageTitle;
  const mapsUrl = "https://maps.google.com/?q=" + encodeURIComponent(C.location.mapsQuery);
  $("#maps-link").href = mapsUrl;
  $("#map-link").href = mapsUrl;
  // مع الإحداثيات تظهر الخريطة بدون دبوس جوجل الأحمر (دبوس القلب يحل محله)
  $("#map-frame").src = C.location.coords
    ? "https://maps.google.com/maps?ll=" + C.location.coords + "&z=16&output=embed"
    : "https://maps.google.com/maps?q=" + encodeURIComponent(C.location.mapsQuery) + "&z=15&output=embed";
  $("#qr-img").src = C.files.qr;
  $("#qr-img").onerror = function () { this.replaceWith(Object.assign(document.createElement("p"), { className: "muted", textContent: "ضع صورة QR في " + C.files.qr })); };

  // التفاصيل: نص فقط، أو { icon, text } بأيقونة من مكتبة Phosphor
  $("#details").innerHTML = C.details.map((d) => {
    const item = typeof d === "string" ? { icon: "sparkle", text: d } : d;
    return `<div class="detail"><span class="d-ic"><i class="ph-light ph-${esc(item.icon)}"></i></span><span class="txt">${esc(item.text)}</span></div>`;
  }).join("");
  $("#congrats").innerHTML = C.congrats.map((m) =>
    typeof m === "string" ? bubble({ message: m }) : bubble({ message: m.text, icon: m.icon })
  ).join("");
  $("#notes").innerHTML = C.notes.map((n) =>
    `<div class="note"><span class="note-icon">${n.icon}</span><div><strong>${esc(n.title)}</strong><span>${esc(n.text)}</span></div></div>`
  ).join("");
  $("#timeline").innerHTML = C.timeline.map((t) =>
    `<div class="notif"><div class="n-head"><span class="n-app"><i class="ph-fill ph-bell-ringing"></i></span><span class="n-name">${esc(C.eventType)}</span><span class="n-time">${esc(t.time)}</span></div><div class="n-body">${esc(t.name)}</div></div>`
  ).join("");

  // الصور: تُستخدم فقط إذا كانت موجودة
  $$("[data-photo]").forEach((el) => {
    const src = C.files[el.dataset.photo];
    const img = new Image();
    img.onload = () => { el.style.backgroundImage = `url("${src}")`; };
    img.src = src;
  });

  // فقاعة مباركة: أيقونة في دائرة + النص (والاسم إن وُجد)
  function bubble(m) {
    return `<div class="bubble"><span class="b-ic"><i class="ph-light ph-${esc(m.icon || "heart")}"></i></span>` +
      `<div class="b-txt">"${esc(m.message)}"${m.name ? `<small>— ${esc(m.name)}</small>` : ""}</div></div>`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ============ العد التنازلي ============
  const target = new Date(C.date.iso).getTime();
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    $("#cd-d").textContent = d;
    $("#cd-h").textContent = h;
    $("#cd-m").textContent = m;
    $("#cd-s").textContent = s;
  }
  tick();
  setInterval(tick, 1000);

  // ============ الموسيقى ============
  const audio = $("#music");
  audio.src = C.files.music;
  const musicBtn = $("#music-btn");
  function setPlaying(on) { musicBtn.classList.toggle("playing", on); }
  function playMusic() { audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  musicBtn.addEventListener("click", () => {
    if (audio.paused) playMusic(); else { audio.pause(); setPlaying(false); }
  });

  // ============ فتح الظرف ============
  const cover = $("#cover");
  $("#open-btn").addEventListener("click", () => {
    if (cover.classList.contains("open")) return;
    cover.classList.add("open");
    document.body.classList.add("opening");
    playMusic();
    setTimeout(() => {
      cover.classList.add("gone");
      document.body.classList.remove("locked");
      autoScroll();
    }, 5000);
  });

  // تمرير تلقائي بطيء يتوقف عند لمس المستخدم
  function autoScroll() {
    let active = true;
    const stop = () => { active = false; };
    ["wheel", "touchstart", "mousedown", "keydown"].forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    let last = performance.now();
    (function step(now) {
      if (!active) return;
      window.scrollBy(0, (now - last) * 0.06);
      last = now;
      if (window.innerHeight + window.scrollY < document.body.scrollHeight - 2) requestAnimationFrame(step);
    })(last);
  }

  // ============ سهم الهيرو: ينزل للقسم اللي تحته ============
  $(".scroll-ind").addEventListener("click", (e) => {
    e.preventDefault();
    $("#welcome").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // ============ النوافذ المنبثقة ============
  $$("[data-modal]").forEach((b) => b.addEventListener("click", () => $("#" + b.dataset.modal).classList.add("show")));
  $$(".modal").forEach((m) => m.addEventListener("click", (e) => {
    if (e.target === m || e.target.closest(".close")) m.classList.remove("show");
  }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal.show").forEach((m) => m.classList.remove("show"));
  });

  // ============ نسخ رقم الحساب ============
  $("#copy-acc").addEventListener("click", () => {
    navigator.clipboard?.writeText(C.gift.account).then(() => toast("تم نسخ رقم الحساب", "check-circle"), () => toast(C.gift.account));
  });

  // ============ المشاركة ============
  $("#share-btn").addEventListener("click", async () => {
    const data = { title: C.pageTitle, text: C.share.text, url: location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch (_) {}
    } else {
      navigator.clipboard?.writeText(`${C.share.text}\n${location.href}`);
      toast("تم نسخ رابط الدعوة", "check-circle");
    }
  });

  // ============ احفظ الموعد (ملف تقويم .ics) ============
  $("#save-date").addEventListener("click", () => {
    const start = new Date(C.date.iso);
    const end = new Date(start.getTime() + C.date.durationHours * 36e5);
    const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//wedding-invite//AR", "BEGIN:VEVENT",
      "UID:" + start.getTime() + "@wedding-invite",
      "DTSTAMP:" + f(new Date()), "DTSTART:" + f(start), "DTEND:" + f(end),
      `SUMMARY:${C.eventType} ${C.couple.groom} و ${C.couple.bride}`,
      `LOCATION:${C.location.hall} - ${C.location.address}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = "wedding.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // ============ تأكيد الحضور والمباركات (Google Sheets، أو واتساب كبديل) ============
  const rsvpForm = $("#rsvp-form");
  const guestsSel = $("#rsvp-guests");
  const nameInput = $("#rsvp-name");
  const rsvpBtn = rsvpForm.querySelector("button[type=submit]");
  const sheetUrl = C.rsvp.sheetUrl;
  if (sheetUrl) {
    rsvpBtn.innerHTML = `<i class="ph-fill ph-paper-plane-tilt"></i> إرسال`;
    rsvpBtn.classList.remove("wa-btn");
    // المباركات المحفوظة في الشيت تظهر قبل الرسائل الثابتة
    fetch(sheetUrl).then((r) => r.json()).then((d) => {
      if (d.messages?.length) $("#congrats").insertAdjacentHTML("afterbegin", d.messages.map(bubble).join(""));
    }).catch(() => {});
  }
  for (let i = 1; i <= (C.rsvp.maxGuests || 5); i++) guestsSel.add(new Option(i === 1 ? "شخص واحد" : `${i} أشخاص`, i));
  rsvpForm.addEventListener("change", (e) => {
    if (e.target.name === "attend") $("#guests-field").classList.toggle("hidden", e.target.value === "no");
  });
  nameInput.addEventListener("input", () => nameInput.classList.remove("invalid"));
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) { nameInput.classList.add("invalid"); nameInput.focus(); toast("فضلاً اكتب اسمك"); return; }
    const coming = rsvpForm.attend.value === "yes";
    const msg = $("#rsvp-msg").value.trim();
    if (sheetUrl) {
      rsvpBtn.disabled = true;
      try {
        const body = new URLSearchParams({ name, attend: coming ? "yes" : "no", guests: guestsSel.value, message: msg });
        const res = await fetch(sheetUrl, { method: "POST", body }).then((r) => r.json());
        if (!res.ok) throw 0;
        if (msg) $("#congrats").insertAdjacentHTML("afterbegin", bubble({ name, message: msg }));
        rsvpForm.reset();
        $("#guests-field").classList.remove("hidden");
        toast(coming ? "تم تأكيد حضورك، شكرًا لك" : "وصل ردّك، شكرًا لك", "heart");
      } catch (_) {
        toast("تعذّر الإرسال، حاول مرة أخرى");
      } finally {
        rsvpBtn.disabled = false;
      }
      return;
    }
    const lines = [
      `💌 تأكيد حضور ${C.eventType} ${C.couple.groom} و ${C.couple.bride}`,
      "",
      `👤 الاسم: ${name}`,
      coming ? `✅ الحضور: سأحضر بإذن الله` : `❌ الحضور: أعتذر عن الحضور`,
    ];
    if (coming) lines.push(`👥 عدد الحضور: ${guestsSel.value}`);
    if (msg) lines.push("", `🤍 المباركة: ${msg}`);
    window.open(`https://wa.me/${C.rsvp.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  });

  // ============ تأثير Ripple على الأزرار ============
  $$(".btn").forEach((btn) => btn.addEventListener("click", (e) => {
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }));

  // ============ ظهور الأقسام عند التمرير ============
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  $$(".reveal").forEach((el) => io.observe(el));

  // ============ إشعارات البرنامج على شاشة الجوال ============
  // تنزل الإشعارات واحدًا تلو الآخر عند ظهور الجوال، والضغط عليه يعيد العرض
  const phone = $("#phone");
  const notifs = [...phone.querySelectorAll(".notif")];
  let timers = [];
  function playNotifs() {
    timers.forEach(clearTimeout);
    notifs.forEach((n) => n.classList.remove("in"));
    timers = notifs.map((n, i) => setTimeout(() => {
      n.classList.add("in");
      phone.classList.remove("buzz");
      void phone.offsetWidth; // إعادة تشغيل حركة الاهتزاز
      phone.classList.add("buzz");
    }, 700 + i * 1100));
  }
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { playNotifs(); obs.disconnect(); }
  }, { threshold: 0.45 }).observe(phone);
  phone.addEventListener("click", playNotifs);

  function toast(msg, icon) {
    const t = $("#toast");
    t.innerHTML = (icon ? `<i class="ph-fill ph-${icon}"></i>` : "") + esc(msg);
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
})();
