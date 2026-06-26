// ============================================
// LANTERN & CO. — Interactions & GSAP animation
// ============================================

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Hero entrance ----------
  const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTimeline
    .from('.hero-eyebrow', { opacity: 0, y: 16, duration: 0.6 })
    .from('.hero-title .line', {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.12
    }, '-=0.3')
    .from('.hero-sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.35')
    .from('.hero-actions .btn', { opacity: 0, y: 16, duration: 0.5, stagger: 0.08 }, '-=0.3')
    .from('.hero-stats', { opacity: 0, y: 24, duration: 0.6 }, '-=0.2')
    .from('.nav', { opacity: 0, y: -20, duration: 0.5 }, 0.1);

  // ---------- Hero blob ambient drift ----------
  gsap.to('.blob-1', { x: 30, y: 20, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.blob-2', { x: -20, y: -30, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.blob-3', { x: 20, y: -20, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // ---------- Stat counters ----------
  document.querySelectorAll('.stat-num').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          textContent: target,
          duration: 1.4,
          ease: 'power2.out',
          snap: { textContent: 1 },
          onUpdate: function () {
            el.textContent = Math.ceil(el.textContent);
          }
        });
      }
    });
  });

  // ---------- Generic scroll reveal ----------
  gsap.utils.toArray('.reveal-up').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: (i % 4) * 0.08,
          ease: 'power3.out'
        });
      }
    });
  });

  // ---------- Section title / sub reveal ----------
  gsap.utils.toArray('.section').forEach((section) => {
    const title = section.querySelector('.section-title');
    const sub = section.querySelector('.section-sub');
    const eyebrow = section.querySelector('.eyebrow');
    if (!title) return;

    gsap.set([eyebrow, title, sub].filter(Boolean), { opacity: 0, y: 24 });

    ScrollTrigger.create({
      trigger: title,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to([eyebrow, title, sub].filter(Boolean), {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out'
        });
      }
    });
  });

  // ---------- Project tabs ----------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.project-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach((panel) => {
        if (panel.dataset.panel === target) {
          panel.classList.add('active');
          gsap.fromTo(
            panel.querySelectorAll('.project-card'),
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
          );
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // ---------- Mobile nav burger (simple toggle, no full menu markup yet) ----------
  const burger = document.getElementById('navBurger');
  if (burger) {
    burger.addEventListener('click', () => {
      const links = document.querySelector('.nav-links');
      links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
      if (links.style.display === 'flex') {
        links.style.position = 'absolute';
        links.style.top = '64px';
        links.style.left = '20px';
        links.style.right = '20px';
        links.style.flexDirection = 'column';
        links.style.background = 'rgba(255,255,255,0.9)';
        links.style.backdropFilter = 'blur(18px)';
        links.style.padding = '20px';
        links.style.borderRadius = '18px';
        links.style.gap = '16px';
        links.style.boxShadow = '0 8px 32px rgba(28,28,30,0.1)';
      }
    });
  }

  // ---------- Contact form (front-end only — no backend wired yet) ----------
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      note.textContent = 'Thanks — this is a demo form, so nothing was actually sent yet.';
      gsap.fromTo(note, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    });
  }

  // ---------- Card tilt (service + team cards only) ----------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none)').matches;

  if (!prefersReducedMotion && !isCoarsePointer) {
    const maxTilt = 10; // degrees

    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        const tiltX = (py - 0.5) * -maxTilt;
        const tiltY = (px - 0.5) * maxTilt;

        card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px) scale(1.02)`;
        card.style.setProperty('--glare-x', `${px * 100}%`);
        card.style.setProperty('--glare-y', `${py * 100}%`);
        card.classList.add('hovering');
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.classList.remove('hovering');
      });
    });
  }

  // ---------- Nav background on scroll ----------
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: (self) => {
      const nav = document.querySelector('.nav');
      if (self.direction === 1 && window.scrollY > 80) {
        nav.style.boxShadow = '0 8px 28px rgba(28,28,30,0.1)';
      } else if (window.scrollY <= 80) {
        nav.style.boxShadow = '';
      }
    }
  });

});
