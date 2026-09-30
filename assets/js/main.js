/* Drone スカイドロシー — interactions (vanilla, no deps) */
(() => {
  const d = document, root = d.documentElement;
  root.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  d.addEventListener('DOMContentLoaded', () => {
    /* Header solid on scroll + altimeter + mobile CTA */
    const header = d.querySelector('.site-header');
    const alt = d.querySelector('.altimeter');
    const altLabel = alt && alt.querySelector('b');
    const hudAlt = d.querySelector('[data-hud-alt]');
    const mcta = d.querySelector('.m-cta');
    let ticking = false;
    const onScroll = () => {
      const y = scrollY, max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
      const p = Math.min(1, y / max);
      header && header.classList.toggle('is-solid', y > 40);
      if (alt) {
        alt.style.setProperty('--p', (p * 100).toFixed(2) + '%');
        altLabel.textContent = 'ALT ' + Math.round(p * 150) + 'm';
      }
      if (hudAlt) hudAlt.textContent = Math.round(30 + Math.min(y, 900) / 10) + 'm';
      mcta && mcta.classList.toggle('is-show', y > innerHeight * .6);
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
    onScroll();

    /* Mobile drawer */
    const btn = d.querySelector('.menu-btn');
    if (btn) {
      const toggle = (open) => {
        d.body.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', open);
        btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      };
      btn.addEventListener('click', () => toggle(!d.body.classList.contains('menu-open')));
      d.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
      d.querySelectorAll('.drawer a').forEach(a => a.addEventListener('click', () => toggle(false)));
    }

    /* Reveal on scroll */
    const rv = d.querySelectorAll('.rv');
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }), { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(el => io.observe(el));
    } else rv.forEach(el => el.classList.add('is-in'));

    /* Count-up */
    d.querySelectorAll('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count); if (reduce) { el.textContent = to.toLocaleString(); return; }
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io.disconnect();
        const t0 = performance.now(), dur = 1400;
        const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
      io.observe(el);
    });

    /* Lite YouTube */
    d.querySelectorAll('.yt[data-id]').forEach(el => {
      const play = () => {
        const f = d.createElement('iframe');
        f.src = `https://www.youtube-nocookie.com/embed/${el.dataset.id}?autoplay=1&rel=0`;
        f.title = el.dataset.title || 'YouTube video';
        f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        el.replaceChildren(f);
      };
      el.addEventListener('click', play, { once: true });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } }, { once: true });
    });

    /* Horizontal strip buttons */
    d.querySelectorAll('[data-strip]').forEach(nav => {
      const strip = d.getElementById(nav.dataset.strip);
      nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        strip.scrollBy({ left: (b.dataset.dir === 'prev' ? -1 : 1) * strip.clientWidth * .8, behavior: 'smooth' });
      }));
    });

    /* Filter chips (gallery / news / faq) */
    d.querySelectorAll('[data-filter-group]').forEach(group => {
      const target = d.getElementById(group.dataset.filterGroup);
      group.addEventListener('click', e => {
        const chip = e.target.closest('.chip'); if (!chip) return;
        group.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === chip));
        const v = chip.dataset.value;
        target.querySelectorAll('[data-cat]').forEach(it => it.classList.toggle('is-hidden', v !== 'all' && !it.dataset.cat.split(' ').includes(v)));
      });
    });

    /* FAQ search */
    const q = d.getElementById('faq-q');
    if (q) q.addEventListener('input', () => {
      const v = q.value.trim().toLowerCase();
      d.querySelectorAll('.faq-item').forEach(it => it.classList.toggle('is-hidden', v && !it.textContent.toLowerCase().includes(v)));
    });

    /* Lightbox */
    const links = [...d.querySelectorAll('[data-lb]')];
    if (links.length) {
      const dlg = d.createElement('dialog'); dlg.className = 'lb';
      dlg.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button class="x" aria-label="閉じる">✕</button><button class="pv" aria-label="前の写真">←</button><button class="nx" aria-label="次の写真">→</button>';
      d.body.append(dlg);
      const img = dlg.querySelector('img'), cap = dlg.querySelector('figcaption');
      let i = 0;
      const show = n => { i = (n + links.length) % links.length; const a = links[i]; img.src = a.href; img.alt = a.dataset.cap || ''; cap.textContent = a.dataset.cap || ''; };
      links.forEach((a, n) => a.addEventListener('click', e => { e.preventDefault(); show(n); dlg.showModal(); }));
      dlg.querySelector('.x').onclick = () => dlg.close();
      dlg.querySelector('.pv').onclick = () => show(i - 1);
      dlg.querySelector('.nx').onclick = () => show(i + 1);
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
      dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
    }

    /* Hero video: pause when offscreen / reduced motion */
    const v = d.querySelector('.hero video');
    if (v) {
      if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
      else new IntersectionObserver(([e]) => e.isIntersecting ? v.play().catch(() => {}) : v.pause()).observe(v);
    }

    /* Contact form (static hosting): client validation + endpoint */
    const form = d.querySelector('form[data-endpoint]');
    if (form) form.addEventListener('submit', async e => {
      const ep = form.dataset.endpoint;
      if (!form.checkValidity()) return;
      if (form.email && form.email2 && form.email.value !== form.email2.value) {
        e.preventDefault(); form.email2.setCustomValidity('メールアドレスが一致しません'); form.email2.reportValidity(); form.email2.setCustomValidity(''); return;
      }
      if (!ep || ep.includes('YOUR_FORM_ID')) return; // falls back to action attr
      e.preventDefault();
      const out = form.querySelector('.form-status');
      out.textContent = '送信中…';
      try {
        const r = await fetch(ep, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        out.textContent = r.ok ? 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。' : '送信に失敗しました。お電話でお問い合わせください。';
        if (r.ok) form.reset();
      } catch { out.textContent = '通信エラーが発生しました。お電話でお問い合わせください。'; }
    });
  });
})();
