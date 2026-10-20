(() => {
  'use strict';

  const raw = window.TZC_ADS || {};
  const cfg = {
    client: raw.client || '',
    showPlaceholders: raw.showPlaceholders !== false,
    slots: raw.slots || {},
    custom: raw.custom || {},
    video: Object.assign({ enabled: true, delaySeconds: 4 }, raw.video),
    interstitial: Object.assign({ enabled: true, delaySeconds: 30, closeAfterSeconds: 5, frequencyHours: 24 }, raw.interstitial),
  };

  const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
  const session = {
    get: (k) => safe(() => sessionStorage.getItem(k)),
    set: (k, v) => safe(() => sessionStorage.setItem(k, v)),
  };
  const local = {
    get: (k) => safe(() => localStorage.getItem(k)),
    set: (k, v) => safe(() => localStorage.setItem(k, v)),
  };

  let libLoaded = false;
  function loadAdSense() {
    if (libLoaded || !cfg.client) return;
    libLoaded = true;
    if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.client)}`;
    document.head.appendChild(s);
  }

  // Inserted this way, <script> tags inside custom HTML run.
  function insertHtml(el, html) {
    el.appendChild(document.createRange().createContextualFragment(html));
  }

  function hideWrap(el) {
    const wrap = el.closest('[data-ad-wrap]');
    if (wrap) wrap.hidden = true;
  }

  /** Fills one ad space. Returns true when something is shown. */
  function fill(el) {
    if (el.dataset.state) return el.dataset.state !== 'empty';
    const key = el.dataset.ad;
    const [w, h] = (el.dataset.size || '').split('x').map(Number);
    const custom = cfg.custom[key];
    const slot = cfg.slots[key];

    if (custom) {
      el.dataset.state = 'custom';
      el.classList.add('is-filled');
      insertHtml(el, custom);
      return true;
    }

    if (cfg.client && slot) {
      loadAdSense();
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.dataset.adClient = cfg.client;
      ins.dataset.adSlot = slot;
      if (el.hasAttribute('data-fixed') && w && h) {
        ins.style.cssText = `display:inline-block;width:${w}px;height:${h}px`;
      } else {
        ins.style.cssText = 'display:block;width:100%';
        ins.dataset.adFormat = el.dataset.format || 'auto';
        ins.dataset.fullWidthResponsive = 'true';
      }
      el.dataset.state = 'adsense';
      el.classList.add('is-filled');
      el.appendChild(ins);
      safe(() => (window.adsbygoogle = window.adsbygoogle || []).push({}));
      return true;
    }

    if (cfg.showPlaceholders) {
      el.dataset.state = 'placeholder';
      el.classList.add('is-placeholder');
      const size = key === 'interstitial' ? 'Full-screen ad' : `${w} × ${h}`;
      el.innerHTML = `<span class="ad-ph"><strong>Ad space</strong><span>${size}</span><span>${key}</span></span>`;
      return true;
    }

    el.dataset.state = 'empty';
    hideWrap(el);
    return false;
  }

  // AdSense needs a visible, sized container, so hidden rails wait until they show.
  function fillVisible() {
    document.querySelectorAll('.ad[data-ad]:not([data-lazy])').forEach((el) => {
      if (!el.dataset.state && el.offsetWidth > 0) fill(el);
    });
  }

  /* ---------- Bottom-right video ---------- */

  function setupVideo() {
    const box = document.getElementById('video-ad');
    if (!box || !cfg.video.enabled || session.get('tzc:video-closed')) return;
    setTimeout(() => {
      box.hidden = false;
      if (!fill(box.querySelector('.ad'))) { box.hidden = true; return; }
    }, Math.max(0, cfg.video.delaySeconds) * 1000);
    box.querySelector('.video-ad-close').addEventListener('click', () => {
      box.hidden = true;
      box.querySelector('.ad').innerHTML = '';
      session.set('tzc:video-closed', '1');
    });
  }

  /* ---------- Full-screen interstitial ---------- */

  function setupInterstitial() {
    const dlg = document.getElementById('interstitial');
    const ic = cfg.interstitial;
    if (!dlg || !ic.enabled) return;
    const forced = new URLSearchParams(location.search).get('preview') === 'interstitial';
    const last = Number(local.get('tzc:interstitial-at') || 0);
    if (!forced && Date.now() - last < ic.frequencyHours * 3600 * 1000) return;

    const closeBtn = dlg.querySelector('.interstitial-close');
    let returnFocus = null;
    let timer = null;

    function close() {
      if (closeBtn.disabled) return;
      dlg.hidden = true;
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKey);
      clearInterval(timer);
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        // Keep focus inside the dialog.
        const items = [...dlg.querySelectorAll('button, a[href], iframe, [tabindex]:not([tabindex="-1"])')]
          .filter((n) => !n.disabled && n.offsetParent !== null);
        if (!items.length) { e.preventDefault(); return; }
        const first = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastItem.focus(); }
        else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); first.focus(); }
      }
    }

    function open() {
      if (document.visibilityState !== 'visible') {
        document.addEventListener('visibilitychange', open, { once: true });
        return;
      }
      returnFocus = document.activeElement;
      dlg.hidden = false;
      if (!fill(dlg.querySelector('.ad'))) { dlg.hidden = true; return; }
      document.body.classList.add('is-locked');
      local.set('tzc:interstitial-at', String(Date.now()));

      let left = Math.max(0, Math.round(ic.closeAfterSeconds));
      const tick = () => {
        if (left <= 0) {
          closeBtn.disabled = false;
          closeBtn.textContent = 'Close ad';
          clearInterval(timer);
          if (dlg.contains(document.activeElement) || document.activeElement === document.body) closeBtn.focus();
          return;
        }
        closeBtn.disabled = true;
        closeBtn.textContent = `Close in ${left}`;
        left -= 1;
      };
      tick();
      timer = setInterval(tick, 1000);
      dlg.focus();
      document.addEventListener('keydown', onKey);
    }

    closeBtn.addEventListener('click', close);
    setTimeout(open, forced ? 500 : Math.max(0, ic.delaySeconds) * 1000);
  }

  function start() {
    fillVisible();
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fillVisible, 250); });
    setupVideo();
    setupInterstitial();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
