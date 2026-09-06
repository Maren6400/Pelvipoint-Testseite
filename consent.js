/* ═══════════════════════════════════════════════
   PELVIPOINT — Consent-Management (zentral)
   Gilt für alle Seiten: consent.js + consent.css einbinden.
   Aktuell sind Statistik/Marketing/Externe Medien inaktiv
   (keine GA_ID/FB_ID hinterlegt, keine Embeds vorhanden) –
   die Kategorien sind aber startklar, sobald das dazukommt.
   ═══════════════════════════════════════════════ */
'use strict';

(function () {
  var STORAGE_KEY = 'pp_consent_v1';
  var GA_ID = ''; /* z.B. 'G-XXXXXXXXXX', sobald Google Analytics eingesetzt wird */
  var FB_ID = ''; /* z.B. Meta-Pixel-ID, sobald eingesetzt */

  /* ── Consent lesen/schreiben ── */

  function readConsent() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    if (!raw) return null;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return null; }
    if (!data || typeof data !== 'object') return null;
    if (data.consentVersion !== 1) return null;
    if (typeof data.statistics !== 'boolean') return null;
    if (typeof data.marketing !== 'boolean') return null;
    if (typeof data.externalMedia !== 'boolean') return null;
    if (typeof data.timestamp !== 'string') return null;
    return {
      consentVersion: 1,
      necessary: true,
      statistics: data.statistics,
      marketing: data.marketing,
      externalMedia: data.externalMedia,
      timestamp: data.timestamp
    };
  }

  function writeConsent(choice) {
    var consent = {
      consentVersion: 1,
      necessary: true,
      statistics: !!choice.statistics,
      marketing: !!choice.marketing,
      externalMedia: !!choice.externalMedia,
      timestamp: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch (e) {}
    return consent;
  }

  /* ── Tracker-Loader ── */

  function loadGA4() {
    if (!GA_ID || window.__ppGA4Loaded) return;
    window.__ppGA4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function loadMetaPixel() {
    if (!FB_ID || window.__ppMetaLoaded) return;
    window.__ppMetaLoaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', FB_ID);
    fbq('track', 'PageView');
  }

  function revealMediaEmbeds() {
    document.querySelectorAll('[data-pp-media-embed]').forEach(function (el) {
      if (el.__ppEmbedded) return;
      var src = el.getAttribute('data-media-src');
      if (!src) return;
      el.__ppEmbedded = true;
      var title = el.getAttribute('data-media-title') || 'Video';
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = title;
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      el.innerHTML = '';
      el.appendChild(iframe);
    });
  }

  function applyTrackers(consent) {
    if (!consent) return;
    if (consent.statistics) loadGA4();
    if (consent.marketing) loadMetaPixel();
    if (consent.externalMedia) revealMediaEmbeds();
  }

  /* ── Dialog-UI ── */

  var els = {};
  var state = { mode: 'initial', view: 'simple', consentBeforeOpen: null };

  function buildDialog() {
    if (document.getElementById('pp-consent-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'pp-consent-overlay';
    overlay.className = 'pp-consent-overlay';
    overlay.hidden = true;

    overlay.innerHTML =
      '<div class="pp-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="pp-consent-title">' +
        '<div class="pp-consent-view" data-view="simple">' +
          '<h2 id="pp-consent-title">Datenschutz-Einstellungen</h2>' +
          '<p>Wir verwenden notwendige Technologien für den Betrieb dieser Website. Mit deiner Einwilligung verwenden wir außerdem Dienste für Statistik, Marketing und externe Medien. Du kannst deine Auswahl jederzeit ändern.</p>' +
          '<div class="pp-consent-actions">' +
            '<button type="button" class="pp-btn pp-btn-outline" data-action="necessary-only">Nur notwendige</button>' +
            '<button type="button" class="pp-btn pp-btn-text" data-action="open-settings">Einstellungen auswählen</button>' +
            '<button type="button" class="pp-btn pp-btn-primary" data-action="accept-all">Alle akzeptieren</button>' +
          '</div>' +
        '</div>' +
        '<div class="pp-consent-view" data-view="details" hidden>' +
          '<div class="pp-consent-details-head">' +
            '<h2 id="pp-consent-details-title">Datenschutz-Einstellungen</h2>' +
            '<button type="button" class="pp-consent-close" data-action="close" aria-label="Schließen">&times;</button>' +
          '</div>' +
          '<div class="pp-consent-category">' +
            '<div class="pp-consent-category-head">' +
              '<span class="pp-consent-category-title">Notwendig</span>' +
              '<span class="pp-consent-locked">Immer aktiv</span>' +
            '</div>' +
            '<p>Erforderlich, damit die Website funktioniert (z.B. Kontaktformular). Kann nicht deaktiviert werden.</p>' +
          '</div>' +
          '<div class="pp-consent-category">' +
            '<div class="pp-consent-category-head">' +
              '<label class="pp-consent-category-title" for="pp-consent-statistics">Statistik</label>' +
              '<button type="button" class="pp-consent-switch" id="pp-consent-statistics" role="switch" aria-checked="false" aria-label="Statistik">' +
                '<span class="pp-consent-switch-knob"></span>' +
              '</button>' +
            '</div>' +
            '<p>Steuert Google Analytics zur anonymisierten Reichweitenmessung (aktuell nicht im Einsatz).</p>' +
          '</div>' +
          '<div class="pp-consent-category">' +
            '<div class="pp-consent-category-head">' +
              '<label class="pp-consent-category-title" for="pp-consent-marketing">Marketing</label>' +
              '<button type="button" class="pp-consent-switch" id="pp-consent-marketing" role="switch" aria-checked="false" aria-label="Marketing">' +
                '<span class="pp-consent-switch-knob"></span>' +
              '</button>' +
            '</div>' +
            '<p>Steuert Meta Pixel und ähnliche Marketing-Dienste (aktuell nicht im Einsatz).</p>' +
          '</div>' +
          '<div class="pp-consent-category">' +
            '<div class="pp-consent-category-head">' +
              '<label class="pp-consent-category-title" for="pp-consent-external-media">Externe Medien</label>' +
              '<button type="button" class="pp-consent-switch" id="pp-consent-external-media" role="switch" aria-checked="false" aria-label="Externe Medien">' +
                '<span class="pp-consent-switch-knob"></span>' +
              '</button>' +
            '</div>' +
            '<p>Steuert eingebettete externe Inhalte, z.B. Videos von Drittanbietern (aktuell nicht im Einsatz).</p>' +
          '</div>' +
          '<div class="pp-consent-actions">' +
            '<button type="button" class="pp-btn pp-btn-text" data-action="back" hidden>Zurück</button>' +
            '<button type="button" class="pp-btn pp-btn-primary" data-action="save">Auswahl speichern</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    els.overlay = overlay;
    els.dialog = overlay.querySelector('.pp-consent-dialog');
    els.simpleView = overlay.querySelector('[data-view="simple"]');
    els.detailsView = overlay.querySelector('[data-view="details"]');
    els.backBtn = overlay.querySelector('[data-action="back"]');
    els.closeBtn = overlay.querySelector('[data-action="close"]');
    els.switches = {
      statistics: overlay.querySelector('#pp-consent-statistics'),
      marketing: overlay.querySelector('#pp-consent-marketing'),
      externalMedia: overlay.querySelector('#pp-consent-external-media')
    };

    overlay.querySelector('[data-action="accept-all"]').addEventListener('click', function () {
      finishInitial({ statistics: true, marketing: true, externalMedia: true });
    });
    overlay.querySelector('[data-action="necessary-only"]').addEventListener('click', function () {
      finishInitial({ statistics: false, marketing: false, externalMedia: false });
    });
    overlay.querySelector('[data-action="open-settings"]').addEventListener('click', function () {
      showView('details');
    });
    els.backBtn.addEventListener('click', function () {
      showView('simple');
    });
    els.closeBtn.addEventListener('click', function () {
      closeDialog();
    });
    overlay.querySelector('[data-action="save"]').addEventListener('click', onSave);

    Object.keys(els.switches).forEach(function (key) {
      els.switches[key].addEventListener('click', function () {
        var pressed = this.getAttribute('aria-checked') === 'true';
        this.setAttribute('aria-checked', String(!pressed));
      });
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && state.mode !== 'initial') closeDialog();
    });

    overlay.addEventListener('keydown', onDialogKeydown);
  }

  function setSwitch(key, value) {
    els.switches[key].setAttribute('aria-checked', String(!!value));
  }
  function getSwitch(key) {
    return els.switches[key].getAttribute('aria-checked') === 'true';
  }

  function showView(view) {
    state.view = view;
    els.simpleView.hidden = view !== 'simple';
    els.detailsView.hidden = view !== 'details';
    els.backBtn.hidden = !(view === 'details' && state.mode === 'initial');
    els.closeBtn.hidden = !(view === 'details' && state.mode !== 'initial');
    focusFirst();
  }

  function focusFirst() {
    var visible = state.view === 'simple' ? els.simpleView : els.detailsView;
    var focusable = visible.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function lockScroll(lock) {
    document.documentElement.classList.toggle('pp-consent-lock', lock);
  }

  function openDialog(mode, view) {
    buildDialog();
    state.mode = mode;
    state.consentBeforeOpen = readConsent();
    var current = state.consentBeforeOpen || { statistics: false, marketing: false, externalMedia: false };
    setSwitch('statistics', current.statistics);
    setSwitch('marketing', current.marketing);
    setSwitch('externalMedia', current.externalMedia);
    els.overlay.hidden = false;
    lockScroll(true);
    showView(view);
  }

  function closeDialog() {
    if (!els.overlay) return;
    els.overlay.hidden = true;
    lockScroll(false);
  }

  function finishInitial(choice) {
    var consent = writeConsent(choice);
    applyTrackers(consent);
    closeDialog();
  }

  function onSave() {
    var choice = {
      statistics: getSwitch('statistics'),
      marketing: getSwitch('marketing'),
      externalMedia: getSwitch('externalMedia')
    };
    var before = state.consentBeforeOpen;
    var consent = writeConsent(choice);

    var revoked =
      (before && before.statistics && !consent.statistics) ||
      (before && before.marketing && !consent.marketing) ||
      (before && before.externalMedia && !consent.externalMedia);

    closeDialog();

    if (revoked) {
      window.location.reload();
      return;
    }
    applyTrackers(consent);
  }

  function onDialogKeydown(e) {
    if (e.key === 'Escape') {
      if (state.view === 'details') {
        if (state.mode === 'initial') {
          showView('simple');
        } else {
          closeDialog();
        }
      }
      return;
    }
    if (e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e) {
    var visible = state.view === 'simple' ? els.simpleView : els.detailsView;
    var focusables = Array.prototype.slice.call(
      visible.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.hidden && el.offsetParent !== null; });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function wireFooterLinks() {
    document.querySelectorAll('.pp-open-consent').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openDialog('reopen', 'details');
      });
    });
  }

  function wireMediaPlaceholders() {
    document.querySelectorAll('[data-pp-media-embed]').forEach(function (el) {
      var btn = el.querySelector('.pp-media-allow-btn');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var current = readConsent() || { statistics: false, marketing: false, externalMedia: false };
        var consent = writeConsent({
          statistics: current.statistics,
          marketing: current.marketing,
          externalMedia: true
        });
        applyTrackers(consent);
      });
    });
  }

  /* ── Start ── */

  var initialConsent = readConsent();
  applyTrackers(initialConsent);
  wireMediaPlaceholders();
  wireFooterLinks();

  if (!initialConsent) {
    openDialog('initial', 'simple');
  }
})();
