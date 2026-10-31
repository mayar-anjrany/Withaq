/* =========================================================
   جافاسكربت الموقع — بدون مكتبات وبدون ضغط
   1) قائمة الجوال
   2) تعبئة بيانات الشركة من site-config.js
   3) نماذج التواصل: تُرسل الطلب عبر واتساب (لا يُخزَّن شيء على الموقع)
   ========================================================= */

(function () {
  "use strict";

  var config = window.WITHAQ_CONFIG || {};

  /* ---------------------------------------------------------
     1) قائمة الجوال
     --------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    // إغلاق القائمة بزر Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     2) تعبئة بيانات الشركة
     عنصر بالشكل: <span data-config="legalName">[نص افتراضي]</span>
     --------------------------------------------------------- */
  function initConfig() {
    var nodes = document.querySelectorAll("[data-config]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-config");
      var value = config[key];
      if (!value) return; // تبقى القيمة الافتراضية (حقل قيد التعبئة)
      el.textContent = value;
      el.classList.remove("placeholder");
    });

    // روابط البريد
    Array.prototype.forEach.call(document.querySelectorAll("[data-config-mailto]"), function (el) {
      if (config.email) {
        el.setAttribute("href", "mailto:" + config.email);
        el.textContent = config.email;
        el.classList.remove("placeholder");
      }
    });

    // روابط واتساب العامة
    Array.prototype.forEach.call(document.querySelectorAll("[data-whatsapp-link]"), function (el) {
      el.setAttribute("href", "https://wa.me/" + config.whatsappNumber);
    });

    // حسابات التواصل الاجتماعي (تُخفى إن كانت فارغة)
    Array.prototype.forEach.call(document.querySelectorAll("[data-social]"), function (el) {
      var url = config.social && config.social[el.getAttribute("data-social")];
      if (url) {
        el.setAttribute("href", url);
        el.hidden = false;
      }
    });

    // لافتة المسودة القانونية
    if (config.showLegalDraftBanner === false) {
      Array.prototype.forEach.call(document.querySelectorAll(".draft-banner"), function (el) {
        el.hidden = true;
      });
    }

    // سنة التذييل
    Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------------------------------------------------
     3) نماذج واتساب
     النموذج يحمل data-whatsapp-form ويحدد عنوان الرسالة في data-intro
     كل حقل له name، ويُضاف إلى الرسالة مع تسمية data-label
     --------------------------------------------------------- */
  function showError(field, message) {
    field.classList.add("has-error");
    var text = field.querySelector(".error-text span");
    if (text && message) text.textContent = message;
  }

  function clearError(field) {
    field.classList.remove("has-error");
  }

  function initForms() {
    var forms = document.querySelectorAll("[data-whatsapp-form]");
    Array.prototype.forEach.call(forms, function (form) {
      var status = form.querySelector(".form-status");

      // إزالة رسالة الخطأ بمجرد أن يبدأ المستخدم بالكتابة
      form.addEventListener("input", function (e) {
        var field = e.target.closest(".field, .check-field");
        if (field) clearError(field);
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstInvalid = null;
        var lines = [];

        // التحقق من الحقول
        var controls = form.querySelectorAll("input, select, textarea");
        Array.prototype.forEach.call(controls, function (control) {
          var wrapper = control.closest(".field, .check-field");
          if (!wrapper) return;
          clearError(wrapper);

          var value = control.type === "checkbox" ? control.checked : control.value.trim();

          if (control.required && !value) {
            showError(wrapper);
            if (!firstInvalid) firstInvalid = control;
            return;
          }

          if (control.type !== "checkbox" && value) {
            lines.push({ label: control.getAttribute("data-label") || control.name, value: value });
          }
        });

        if (firstInvalid) {
          if (status) status.textContent = "يرجى استكمال الحقول المشار إليها.";
          firstInvalid.focus();
          return;
        }

        // بناء نص الرسالة
        var intro = form.getAttribute("data-intro") || "السلام عليكم";
        var text = intro + "\n\n" + lines.map(function (l) {
          return l.label + ": " + l.value;
        }).join("\n");

        var url = "https://wa.me/" + config.whatsappNumber + "?text=" + encodeURIComponent(text);
        if (status) status.textContent = "جارٍ فتح واتساب ورسالتك جاهزة للإرسال.";
        window.open(url, "_blank", "noopener");
      });
    });
  }

  /* ---------------------------------------------------------
     4) أنيميشن الدخول بالشعار — مرة واحدة في الجلسة
     --------------------------------------------------------- */
  var LOGO_MARK_SVG =
    '<svg class="intro-logo" viewBox="12 28 155 212" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<path class="logo-stroke" pathLength="1" d="M27 225H62C118 225 152 192 152 138V95A52 52 0 1 0 72.4 139.1" fill="none" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle class="logo-key" cx="100" cy="88" r="9.5"/>' +
    '<path class="logo-key" d="M94 92H106L109.5 118H90.5Z"/>' +
    "</svg>";

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initIntro() {
    if (prefersReducedMotion()) return;

    try {
      if (sessionStorage.getItem("withaq-intro-seen") === "1") return;
    } catch (err) {
      /* التخزين قد يكون محظورًا */
    }

    var overlay = document.createElement("div");
    overlay.className = "intro-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML =
      '<div class="intro-overlay__inner">' +
      LOGO_MARK_SVG +
      '<p class="intro-word">وِثاق</p>' +
      '<p class="intro-word-en" lang="en">WITHAQ</p>' +
      "</div>";

    document.body.appendChild(overlay);
    document.body.classList.add("is-introing");

    requestAnimationFrame(function () {
      overlay.classList.add("is-ready");
    });

    var introDone = false;
    function finish() {
      if (introDone) return;
      introDone = true;
      overlay.classList.add("is-leaving");
      document.body.classList.remove("is-introing");
      try {
        sessionStorage.setItem("withaq-intro-seen", "1");
      } catch (err) {
        /* تجاهل */
      }
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 700);
    }

    window.setTimeout(finish, 2500);
    overlay.addEventListener("click", finish);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onKey);
        finish();
      }
    });
  }

  /* ---------------------------------------------------------
     5) بطاقات الفريق من بيانات الموقع
     --------------------------------------------------------- */
  function instagramUrl(value) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return "https://instagram.com/" + String(value).replace(/^@/, "");
  }

  function whatsappUrl(value) {
    if (!value) return "";
    return "https://wa.me/" + String(value).replace(/[^\d]/g, "");
  }

  var ICON_INSTAGRAM =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="0.8" fill="currentColor" stroke="none"/></svg>';

  var ICON_WHATSAPP =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.8 19.2l.7-2.6A7.8 7.8 0 1 1 7.4 19l-2.6.2z"/><path d="M9.2 9.6c.2-.5.3-.5.6-.5h.5c.2 0 .3.1.4.4l.6 1.5c.1.2 0 .4-.1.5l-.4.5c-.1.1-.1.3 0 .4.3.5.8 1.1 1.4 1.5.2.1.3.1.4 0l.6-.4c.2-.1.4-.1.5.1l1.2.7c.2.1.3.3.2.5-.1.4-.5 1-1.6.9-1.3-.1-3.3-1.1-4.6-3.1-1.1-1.7-1.2-3.2-1-3.7z"/></svg>';

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initTeam() {
    var grid = document.querySelector("[data-team-grid]");
    if (!grid) return;

    var team = config.team || [];
    if (!team.length) {
      var section = grid.closest("section");
      if (section) section.hidden = true;
      return;
    }

    grid.innerHTML = team
      .map(function (member, index) {
        var name = escapeHtml(member.name || "");
        var role = escapeHtml(member.role || "");
        var photo = escapeHtml(member.photo || "");
        var ig = instagramUrl(member.instagram);
        var wa = whatsappUrl(member.whatsapp);
        var actions = "";

        if (ig) {
          actions +=
            '<a class="team-card__btn team-card__btn--ig" href="' +
            escapeHtml(ig) +
            '" target="_blank" rel="noopener noreferrer">' +
            ICON_INSTAGRAM +
            "<span>إنستغرام</span></a>";
        }
        if (wa) {
          actions +=
            '<a class="team-card__btn team-card__btn--wa" href="' +
            escapeHtml(wa) +
            '" target="_blank" rel="noopener noreferrer">' +
            ICON_WHATSAPP +
            "<span>واتساب</span></a>";
        }

        return (
          '<article class="team-card" style="--i:' +
          index +
          '">' +
          '<div class="team-card__photo">' +
          '<img src="' +
          photo +
          '" alt="' +
          name +
          '" width="480" height="600" loading="lazy">' +
          "</div>" +
          '<div class="team-card__body">' +
          "<h3>" +
          name +
          "</h3>" +
          '<p class="team-card__role">' +
          role +
          "</p>" +
          '<div class="team-card__actions">' +
          actions +
          "</div></div></article>"
        );
      })
      .join("");
  }

  /* ---------------------------------------------------------
     تشغيل كل شيء بعد تحميل الصفحة
     --------------------------------------------------------- */
  function init() {
    initIntro();
    initNav();
    initConfig();
    initForms();
    initTeam();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
