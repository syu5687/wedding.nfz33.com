/* =========================================================================
 * rcs-tracking.js  ―  Le Diaphane（ロイヤルチェスター佐賀）LP 計測モジュール
 * GA4 / Meta Pixel / LINE広告タグ を統合してCV計測する。
 * 依存: <head> に gtag / fbq / _lt のベースタグが読み込まれていること。
 * ベースタグが無い環境でも安全（typeof チェックで握りつぶす）。
 * ========================================================================= */
(function () {
  'use strict';

  /* ---- 各プラットフォームへの安全呼び出しヘルパー -------------------- */
  function ga(eventName, params) {
    if (typeof gtag === 'function') gtag('event', eventName, params || {});
  }
  function meta(eventName, params) {
    if (typeof fbq === 'function') fbq('track', eventName, params || {});
  }
  function lineCv() {
    // ※ tagId は LINE広告管理画面で発行された実IDに置換
    if (typeof _lt === 'function') {
      _lt('send', 'cv', { type: 'Conversion' },
          ['XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX']);
    }
  }

  /* =====================================================================
   * 1. プライマリCV：フォーム送信成功
   *    main.js の送信成功分岐から window.trackFormConversion(fair) を呼ぶ。
   * ===================================================================== */
  window.trackFormConversion = function (fairName) {
    ga('generate_lead', {
      event_category: 'form',
      event_label: fairName || 'unknown',
      value: 1,
      currency: 'JPY'
    });
    meta('Lead', {
      content_name: 'Le Diaphane フェア予約',
      content_category: fairName || ''
    });
    lineCv();
  };

  /* =====================================================================
   * 2. セカンダリCV：LINE / 電話クリック（イベント委譲で全要素を捕捉）
   * ===================================================================== */
  document.addEventListener('click', function (e) {
    var lineEl = e.target.closest('a[href*="line.me"], a[href*="lin.ee"], .js-line-cta');
    if (lineEl) {
      ga('line_click', { event_category: 'cta', event_label: 'LINE', value: 1 });
      meta('Contact', { content_name: 'LINE相談' });
    }
    var telEl = e.target.closest('a[href^="tel:"]');
    if (telEl) {
      ga('phone_click', { event_category: 'cta', event_label: telEl.getAttribute('href') });
      meta('Contact', { content_name: '電話問い合わせ' });
    }
  }, true);

  /* =====================================================================
   * 3. 意図シグナル：フェア選択（ラジオボタン全件にバインド）
   * ===================================================================== */
  var fairEls = document.querySelectorAll('[name="fair"]');
  fairEls.forEach(function (el) {
    el.addEventListener('change', function () {
      if (this.checked) {
        ga('select_fair', { event_category: 'engagement', event_label: this.value });
      }
    });
  });

  /* =====================================================================
   * 4. エンゲージメント：スクロール深度（25 / 50 / 75 / 100%）
   * ===================================================================== */
  var fired = {};
  function onScroll() {
    var h = document.documentElement;
    var scrolled = h.scrollTop || document.body.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    if (height <= 0) return;
    var pct = Math.round((scrolled / height) * 100);
    [25, 50, 75, 100].forEach(function (mark) {
      if (pct >= mark && !fired[mark]) {
        fired[mark] = true;
        ga('scroll_depth', { event_category: 'engagement', event_label: mark + '%', value: mark });
      }
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  /* =====================================================================
   * 5. フォーム到達：予約フォームが画面内に入ったら1回だけ計測
   * ===================================================================== */
  var formEl = document.getElementById('reserveForm');
  if (formEl && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          ga('view_form', { event_category: 'engagement', event_label: 'reserveForm' });
          meta('ViewContent', { content_name: '予約フォーム' });
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(formEl);
  }
})();
