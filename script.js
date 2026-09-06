// ============================================
// Interactions & GSAP animation
// ============================================

gsap.registerPlugin(ScrollTrigger);

// Helper function to safely send gtag events
function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

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
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;

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
            if (el.dataset.count.includes('.')) {
              el.textContent = Number(this.targets()[0].textContent).toFixed(1);
            } else {
              el.textContent = Math.ceil(this.targets()[0].textContent);
            }
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

      // GA: Track Project Category Switch
      trackEvent('select_content', {
        content_type: 'project_tab',
        item_id: target
      });

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

  // ---------- Pricing tabs ----------
  const pricingButtons = document.querySelectorAll('.pricing-tab-btn');
  const pricingPanels = document.querySelectorAll('.pricing-panel');

  pricingButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // GA: Track Pricing Category Switch
      trackEvent('select_content', {
        content_type: 'pricing_tab',
        item_id: target
      });

      pricingButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pricingPanels.forEach(panel => {
        if (panel.dataset.panel === target) { panel.classList.add('active'); } else { panel.classList.remove('active'); }
      });
    });
  });

  // ---------- Track Pricing Card CTA Clicks ----------
  document.querySelectorAll('.price-card .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.price-card');
      const planName = card ? card.querySelector('.price-name')?.innerText.trim() : 'Unknown';
      const planPrice = card ? card.querySelector('.price-amount')?.innerText.replace(/\s+/g, ' ').trim() : '';

      trackEvent('select_item', {
        item_list_name: 'Pricing Plans',
        item_name: planName,
        price_tier: planPrice
      });
    });
  });

  // ---------- Track Outbound Portfolio / Client Links ----------
  document.querySelectorAll('.project-link').forEach((link) => {
    link.addEventListener('click', () => {
      const card = link.closest('.project-card');
      const projectName = card ? card.querySelector('h3')?.innerText.trim() : 'Unknown Project';

      trackEvent('view_item', {
        item_category: 'Portfolio',
        item_name: projectName,
        destination_url: link.href
      });
    });
  });

  // ---------- Track Direct Phone & Email Clicks ----------
  document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const isPhone = link.href.startsWith('tel:');
      trackEvent('contact', {
        method: isPhone ? 'Phone' : 'Email',
        contact_detail: link.href.replace(/^(tel:|mailto:)/, '')
      });
    });
  });

  // ---------- Mobile nav burger ----------
  const burger = document.getElementById('navBurger');
  const navLinks = document.querySelector('.nav-links');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('menu-open');
      burger.classList.toggle('active');

      if (navLinks.classList.contains('menu-open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('menu-open');
        burger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Contact form (Web3Forms Integration + GA Conversion) ----------
  const form = document.getElementById('contactForm');
  const result = document.getElementById('formNote');

  if (form) {
    const submitButton = form.querySelector('.form-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const originalBtnText = submitButton.innerText;
      submitButton.innerText = 'Sending...';
      submitButton.style.opacity = '0.7';
      submitButton.style.pointerEvents = 'none';

      const formData = new FormData(form);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
        .then(async (response) => {
          let resJson = await response.json();
          if (response.status == 200) {
            // Success
            result.style.display = "block";
            result.style.color = "#10b981";
            result.innerText = "Message sent successfully! We'll be in touch soon.";
            gsap.fromTo(result, { opacity: 0 }, { opacity: 1, duration: 0.4 });

            // GA: Key Conversion Event
            trackEvent('generate_lead', {
              event_category: 'Contact',
              event_label: object.business || 'General Inquiry'
            });

            form.reset();
          } else {
            // Form endpoint error
            result.style.display = "block";
            result.style.color = "#ef4444";
            result.innerText = resJson.message || "Something went wrong.";
            gsap.fromTo(result, { opacity: 0 }, { opacity: 1, duration: 0.4 });
          }
        })
        .catch(error => {
          result.style.display = "block";
          result.style.color = "#ef4444";
          result.innerText = "Something went wrong! Please try again later.";
          gsap.fromTo(result, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        })
        .finally(() => {
          submitButton.innerText = originalBtnText;
          submitButton.style.opacity = '1';
          submitButton.style.pointerEvents = 'auto';

          setTimeout(() => {
            gsap.to(result, {
              opacity: 0,
              duration: 0.4,
              onComplete: () => { result.style.display = "none"; }
            });
          }, 5000);
        });
    });
  }

  // ---------- Card tilt (service + team cards only) ----------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none)').matches;

  if (!prefersReducedMotion && !isCoarsePointer) {
    const maxTilt = 10;

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