document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     01 — LENIS SMOOTH SCROLL
     ========================================================= */

  let lenis = null;

  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      infinite: false
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    /* Smooth anchor navigation */

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);

        if (!target) return;

        e.preventDefault();

        lenis.scrollTo(target, {
          offset: 0,
          duration: 1.2
        });
      });
    });
  }

  /* =========================================================
     03 — TRANSFORMATION — BEFORE / AFTER SLIDER
     ========================================================= */

  const transformSlider = document.querySelector("#transformSlider");
  const transformAfter = document.querySelector("#transformAfter");
  const transformHandle = document.querySelector("#transformHandle");

  if (transformSlider && transformAfter && transformHandle) {

    let isDragging = false;

    function updateSlider(clientX) {
      const rect = transformSlider.getBoundingClientRect();

      let position =
        ((clientX - rect.left) / rect.width) * 100;

      // Keep slider inside the frame
      position = Math.max(0, Math.min(100, position));

      // Reveal AFTER image
      transformAfter.style.clipPath =
        `inset(0 0 0 ${position}%)`;

      // Move divider
      transformHandle.style.left =
        `${position}%`;
    }

    /* -----------------------------------------
       Mouse
       ----------------------------------------- */

    transformSlider.addEventListener("mousedown", (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });


    /* -----------------------------------------
       Touch
       ----------------------------------------- */

    transformSlider.addEventListener(
      "touchstart",
      (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;

        updateSlider(e.touches[0].clientX);
      },
      { passive: true }
    );

    window.addEventListener("touchend", () => {
      isDragging = false;
    });


    /* -----------------------------------------
       Prevent image dragging
       ----------------------------------------- */

    const transformImages =
      transformSlider.querySelectorAll("img");

    transformImages.forEach((img) => {
      img.setAttribute("draggable", "false");

      img.addEventListener("dragstart", (e) => {
        e.preventDefault();
      });
    });


    /* -----------------------------------------
       Prevent browser image/text selection
       ----------------------------------------- */

    transformSlider.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });


    /* -----------------------------------------
       Initial position
       ----------------------------------------- */

    updateSlider(
      transformSlider.getBoundingClientRect().left +
      transformSlider.getBoundingClientRect().width * 0.5
    );
  }

  /* =========================================================
     02 — NAVBAR
     Full width at top → compact when scrolling
     ========================================================= */

  const navWrap = document.getElementById("navWrap");

  if (navWrap) {
    const updateNavbar = () => {
      if (window.scrollY > 60) {
        navWrap.classList.add("scrolled");
      } else {
        navWrap.classList.remove("scrolled");
      }
    };

    updateNavbar();

    window.addEventListener(
      "scroll",
      updateNavbar,
      { passive: true }
    );
  }

  /* =========================================================
     03 — MOBILE NAVIGATION
     ========================================================= */

  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");

  if (navBurger && navLinks) {

    navBurger.addEventListener("click", () => {
      const isOpen = navBurger.classList.toggle("active");

      navLinks.classList.toggle("open", isOpen);

      navBurger.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

      document.body.classList.toggle(
        "nav-open",
        isOpen
      );
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navBurger.classList.remove("active");
        navLinks.classList.remove("open");

        navBurger.setAttribute(
          "aria-expanded",
          "false"
        );

        document.body.classList.remove("nav-open");
      });
    });
  }

  /* =========================================================
     04 — HERO INTRO ANIMATION
     ========================================================= */

  if (typeof gsap !== "undefined") {

    const heroTimeline = gsap.timeline({
      defaults: {
        ease: "power3.out"
      }
    });

    const heroElements = document.querySelectorAll(
      ".reveal-hero"
    );

    if (heroElements.length) {

      gsap.set(heroElements, {
        opacity: 0,
        y: 30
      });

      heroTimeline.to(heroElements, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        delay: 0.25
      });
    }

    /* Hero video subtle entrance */

    const heroVideo = document.querySelector(
      ".hero-video-media"
    );

    if (heroVideo) {

      gsap.fromTo(
        heroVideo,
        {
          scale: 1.04
        },
        {
          scale: 1.015,
          duration: 2.2,
          ease: "power2.out"
        }
      );
    }

    /* =======================================================
       HERO VIDEO PARALLAX
       ======================================================= */

    if (
      heroVideo &&
      typeof ScrollTrigger !== "undefined"
    ) {

      gsap.to(heroVideo, {
        yPercent: 4,
        ease: "none",

        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }

    /* =======================================================
       HERO CONTENT SCROLL
       ======================================================= */

    const heroContent = document.querySelector(
      ".hero-content"
    );

    if (
      heroContent &&
      typeof ScrollTrigger !== "undefined"
    ) {

      gsap.to(heroContent, {
        y: -60,
        scale: 0.97,
        opacity: 0.15,
        ease: "none",

        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  /* =========================================================
     07 — THE MERIDIAN DIFFERENCE
     Scroll-driven compressed/parallax animation
     ========================================================= */

  if (
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined"
  ) {
    const differenceSection =
      document.querySelector("#difference");

    const mantraLines =
      document.querySelectorAll(
        "#differenceMantra .mantra-line"
      );

    if (
      differenceSection &&
      mantraLines.length
    ) {

      /* -------------------------------------------------------
         Initial state
         ------------------------------------------------------- */

      gsap.set(mantraLines, {
        opacity: 0.25,
        y: 12
      });

      mantraLines.forEach((line) => {
        line.classList.remove("active");
      });


      /* -------------------------------------------------------
         Scroll-driven timeline
         ------------------------------------------------------- */

      const differenceTimeline =
        gsap.timeline();


      mantraLines.forEach((line, index) => {

        differenceTimeline.to(
          line,
          {
            opacity: 1,
            y: 0,
            duration: 2,
            ease: "power2.out",

            onStart: () => {
              line.classList.add("active");
            },

            onReverseComplete: () => {
              line.classList.remove("active");
            }
          },

          index
        );

      });


      /* -------------------------------------------------------
         ScrollTrigger
         ------------------------------------------------------- */

      ScrollTrigger.create({

        trigger: differenceSection,

        /*
         * START:
         * Section reaches 15% of viewport.
         */

        start: "top 15%",

        /*
         * END:
         * Section moves up to roughly 1% of viewport.
         *
         * This compresses the animation into a short
         * scroll distance.
         */

        end: "top 1%",

        /*
         * Animation follows the scroll.
         */

        scrub: 0.01,

        animation: differenceTimeline

      });

    }
  }

  /* =========================================================
     05 — GENERIC REVEAL ANIMATIONS
     ========================================================= */

  if (
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined"
  ) {

    gsap.utils.toArray(".reveal-up").forEach((element) => {

      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",

          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true
          }
        }
      );
    });

    gsap.utils.toArray(".reveal-fade").forEach((element) => {

      gsap.fromTo(
        element,
        {
          opacity: 0
        },
        {
          opacity: 1,
          duration: 1,

          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true
          }
        }
      );
    });

    /* =======================================================
       SCALE-IN IMAGES
       ======================================================= */

    gsap.utils.toArray(".image-reveal").forEach((element) => {

      gsap.fromTo(
        element,
        {
          scale: 1.08,
          opacity: 0
        },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",

          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            once: true
          }
        }
      );
    });
  }

  /* =========================================================
     06 — COUNTERS
     ========================================================= */

  if (
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined"
  ) {

    document
      .querySelectorAll("[data-count]")
      .forEach((counter) => {

        const target = parseInt(
          counter.dataset.count,
          10
        );

        if (Number.isNaN(target)) return;

        const value = {
          current: 0
        };

        ScrollTrigger.create({
          trigger: counter,
          start: "top 90%",
          once: true,

          onEnter: () => {

            gsap.to(value, {
              current: target,
              duration: 1.5,
              ease: "power2.out",

              onUpdate: () => {
                counter.textContent =
                  Math.round(value.current);
              }
            });
          }
        });
      });
  }

  /* =========================================================
   06 — METHODOLOGY / PROCESS
   ========================================================= */

  if (
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined"
  ) {
    const processSection = document.querySelector("#process");
    const processInteractive = document.querySelector("#processInteractive");
    const processTrackFill = document.querySelector("#processTrackFill");
    const processNodes = document.querySelectorAll(".process-node");

    if (
      processSection &&
      processInteractive &&
      processTrackFill &&
      processNodes.length
    ) {

      /* -------------------------------------------------------
         Initial state
         ------------------------------------------------------- */

      // Start the progress line at 0%
      gsap.set(processTrackFill, {
        scaleX: 0,
        transformOrigin: "left center"
      });

      // First step is visible initially
      processNodes.forEach((node, index) => {
        if (index === 0) {
          node.classList.add("active");
        } else {
          node.classList.remove("active");
        }
      });


      /* -------------------------------------------------------
         Create the one-time animation
         ------------------------------------------------------- */

      const processTimeline = gsap.timeline({
        paused: true
      });


      /*
       * Progress line
       *
       * Moves from left → right once.
       */

      processTimeline.to(
        processTrackFill,
        {
          scaleX: 1,
          duration: 2.2,
          ease: "power2.inOut"
        },
        0
      );


      /*
       * Activate the methodology steps progressively.
       *
       * 01 → 02 → 03 → 04
       */

      processNodes.forEach((node, index) => {

        // Don't deactivate Step 1 at the beginning
        if (index === 0) return;

        processTimeline.call(
          () => {
            node.classList.add("active");
          },
          [],
          0.45 + (index - 1) * 0.55
        );

      });


      /* -------------------------------------------------------
         Trigger animation when methodology becomes visible
         ------------------------------------------------------- */

      ScrollTrigger.create({
        trigger: processSection,

        start: "top 70%",

        once: true,

        onEnter: () => {
          processTimeline.play();
        }
      });
    }
  }

  /* =========================================================
     07 — FAQ ACCORDION
     ========================================================= */

  document
    .querySelectorAll(".faq-q")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const item = button.closest(".faq-item");

        if (!item) return;

        const answer = item.querySelector(".faq-a");
        const isOpen =
          button.getAttribute("aria-expanded") === "true";

        /* Close other FAQ items */

        document
          .querySelectorAll(".faq-item")
          .forEach((otherItem) => {

            if (otherItem === item) return;

            const otherButton =
              otherItem.querySelector(".faq-q");

            const otherAnswer =
              otherItem.querySelector(".faq-a");

            if (!otherButton || !otherAnswer) return;

            otherButton.setAttribute(
              "aria-expanded",
              "false"
            );

            otherItem.classList.remove("active");

            otherAnswer.style.maxHeight = null;
          });

        /* Toggle current */

        if (isOpen) {

          button.setAttribute(
            "aria-expanded",
            "false"
          );

          item.classList.remove("active");

          answer.style.maxHeight = null;

        } else {

          button.setAttribute(
            "aria-expanded",
            "true"
          );

          item.classList.add("active");

          answer.style.maxHeight =
            answer.scrollHeight + "px";
        }
      });
    });

  /* =========================================================
     08 — ACTIVE NAVIGATION
     ========================================================= */

  if (
    typeof ScrollTrigger !== "undefined"
  ) {

    const sections = document.querySelectorAll(
      "section[id]"
    );

    const navItems = document.querySelectorAll(
      ".nav-link"
    );

    sections.forEach((section) => {

      ScrollTrigger.create({
        trigger: section,
        start: "top 45%",
        end: "bottom 45%",

        onEnter: () => {
          setActiveNav(section.id);
        },

        onEnterBack: () => {
          setActiveNav(section.id);
        }
      });
    });

    function setActiveNav(id) {

      navItems.forEach((link) => {

        const href =
          link.getAttribute("href");

        if (href === `#${id}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }
  }

  /* =========================================================
     09 — CONTACT FORM
     ========================================================= */

  const contactForm =
    document.querySelector("#contactForm");

  if (contactForm) {

    contactForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const submitButton =
          contactForm.querySelector(
            'button[type="submit"]'
          );

        if (!submitButton) return;

        const originalText =
          submitButton.textContent;

        submitButton.disabled = true;

        submitButton.textContent =
          "Sending...";

        /*
         * Keep your existing form submission
         * logic here if you already have one.
         */

        setTimeout(() => {

          submitButton.textContent =
            "Message sent ✓";

          setTimeout(() => {

            submitButton.disabled = false;

            submitButton.textContent =
              originalText;

          }, 2500);

        }, 1000);
      }
    );
  }

  /* =========================================================
     10 — EXTERNAL / SAME-PAGE LINKS
     ========================================================= */

  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {

      link.addEventListener("click", (event) => {

        const href =
          link.getAttribute("href");

        if (
          !href ||
          href === "#" ||
          typeof lenis === "undefined" ||
          !lenis
        ) {
          return;
        }

        const target =
          document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        lenis.scrollTo(target, {
          duration: 1.2,
          offset: 0
        });
      });
    });

  /* =========================================================
     11 — PAGE LOADED
     ========================================================= */

  document.documentElement.classList.add(
    "js-ready"
  );

});