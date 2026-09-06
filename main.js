'use strict';

/* ── LOADER ── */
(function initLoader() {
  const loader = document.getElementById('loader');
  const progress = document.getElementById('loaderProgress');
  if (!loader || !progress) return;
  document.body.style.overflow = 'hidden';
  let pct = 0;
  const t = setInterval(() => {
    pct += Math.random() * 18 + 5;
    if (pct >= 100) {
      pct = 100; progress.style.width = '100%';
      clearInterval(t);
      setTimeout(() => {
        loader.classList.add('hide');
        document.body.style.overflow = '';
        initReveal(); initCounters();
      }, 350);
    } else { progress.style.width = pct + '%'; }
  }, 55);
})();

/* ── CURSOR ── */
(function initCursor() {
  const c = document.getElementById('cursor');
  const f = document.getElementById('cursorFollower');
  if (!c || !f) return;
  let mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    c.style.left = mx + 'px'; c.style.top = my + 'px';
  });
  (function loop() {
    fx += (mx - fx) * 0.1; fy += (my - fy) * 0.1;
    f.style.left = fx + 'px'; f.style.top = fy + 'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .benefit-card, .studie-card, .faq-question').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();

/* ── NAV ── */
(function initNav() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.toggle('open');
      const spans = burger.querySelectorAll('span');
      if (links.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* aktiver Nav-Link beim Scrollen */
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      const link = nav.querySelector(`.nav-link[href="#${id}"]`);
      if (link) {
        if (scrollY >= top && scrollY < top + height) link.classList.add('active');
        else link.classList.remove('active');
      }
    });
  }, { passive: true });
})();

/* ── SCROLL REVEAL ── */
function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseInt(e.target.dataset.delay || 0);
          setTimeout(() => e.target.classList.add('revealed'), delay);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  } else {
    els.forEach(el => el.classList.add('revealed'));
  }
}

/* ── FAQ ── */
(function initFaq() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

/* ── SMOOTH SCROLL für Anchor-Links ── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();

/* ── COUNTER ANIMATION ── */
function initCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const t = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(t); }
      el.textContent = Math.round(current);
    }, 25);
  });
}

/* ── KONTAKTFORMULAR ── */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const success = document.getElementById('formSuccess');
    btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
    try {
      const data = new FormData(form);
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (res.ok) {
        form.reset();
        if (success) success.style.display = 'block';
      }
    } catch (err) {
      /* Fallback: einfach Danke-Meldung zeigen */
      if (success) success.style.display = 'block';
    } finally {
      btn.style.opacity = ''; btn.style.pointerEvents = '';
    }
  });
})();
