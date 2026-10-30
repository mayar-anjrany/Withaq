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
     تشغيل كل شيء بعد تحميل الصفحة
     --------------------------------------------------------- */
  function init() {
    initNav();
    initConfig();
    initForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
