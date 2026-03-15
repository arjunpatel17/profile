/**
 * Main Application Logic
 * Handles navigation, search, scroll controls, animations, and modals.
 */
(function () {
  'use strict';

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // ---- Active nav link on scroll ----
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const sectionIds = Array.from(navLinks).map(link => link.dataset.section);
  const sectionElements = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  sectionElements.forEach(section => navObserver.observe(section));

  // ---- Smooth scroll for nav links ----
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Card Row Scroll Buttons ----
  document.querySelectorAll('.scroll-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rowId = btn.dataset.row;
      const row = document.getElementById(rowId);
      if (!row) return;
      const scrollAmount = row.clientWidth * 0.6;
      const direction = btn.classList.contains('scroll-left') ? -1 : 1;
      row.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
    });
  });

  // ---- Skill Bar Animation ----
  const skillFills = document.querySelectorAll('.skill-fill');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fills = entry.target.querySelectorAll('.skill-fill');
        fills.forEach(fill => {
          const level = fill.getAttribute('data-level');
          fill.style.width = level + '%';
        });
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  const skillsSection = document.getElementById('skills');
  if (skillsSection) skillObserver.observe(skillsSection);

  // ---- Fade-in Animation on Scroll ----
  const animateElements = document.querySelectorAll('.card, .skill-category, .contact-link');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animateElements.forEach(el => fadeObserver.observe(el));

  // ---- Search ----
  const searchBtn = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');

  // Searchable data from the page
  const searchData = [
    { title: 'Senior Software Engineer', subtitle: 'Microsoft', tags: 'experience', section: 'experience', keywords: 'azure cloud networking sdn software defined virtual network manager ip address verifier routing appliance' },
    { title: 'R&D Software Engineer', subtitle: 'Keysight Technologies', tags: 'experience', section: 'experience', keywords: 'angular typescript node c++ koa express jenkins full stack web embedded gui' },
    { title: 'Graduate Research Assistant', subtitle: 'Georgia Tech Research Institute — ATAS Lab', tags: 'experience', section: 'experience', keywords: 'dsp signal processing matlab labview research noise reduction beamforming cross correlation' },
    { title: 'Electrical Engineer', subtitle: 'Enercon Services', tags: 'experience', section: 'experience', keywords: 'power systems arc flash battery sizing skm load flow voltage drop' },
    { title: 'Hardware Engineering Intern', subtitle: 'GE Intelligent Platforms', tags: 'experience', section: 'experience', keywords: 'fpga sbc hardware mentor graphics pcb military arm sensor processing' },
    { title: 'Energy Management Intern', subtitle: 'GE', tags: 'experience', section: 'experience', keywords: 'qms quality management system spc process control' },
    { title: 'Engineering Intern', subtitle: 'Strong Systems International', tags: 'experience', section: 'experience', keywords: 'rf transmitter sta devices hardware testing control systems' },
    { title: 'M.S. Electrical & Computer Engineering', subtitle: 'Georgia Institute of Technology', tags: 'education', section: 'education', keywords: 'masters graduate dsp control systems' },
    { title: 'B.S. Electrical Engineering', subtitle: 'Georgia Institute of Technology', tags: 'education', section: 'education', keywords: 'bachelors undergraduate senior design' },
    { title: 'B.S. Electrical Engineering', subtitle: 'Southern Polytechnic State University', tags: 'education', section: 'education', keywords: 'undergraduate transfer spsu' },
    { title: 'Angular / TypeScript / JavaScript', subtitle: 'Frontend Development', tags: 'skill', section: 'skills', keywords: 'angular react html css scss web frontend' },
    { title: 'Node.js / Express / KOA', subtitle: 'Backend Development', tags: 'skill', section: 'skills', keywords: 'backend server rest api' },
    { title: 'Docker / Kubernetes / Azure', subtitle: 'DevOps & Cloud', tags: 'skill', section: 'skills', keywords: 'container deployment cloud infrastructure' },
    { title: 'C / C++ / FPGA / VHDL', subtitle: 'Engineering & Embedded', tags: 'skill', section: 'skills', keywords: 'embedded hardware microcontroller' },
    { title: 'Electronic Chess Board', subtitle: 'Senior Design Project — Team Lead', tags: 'project', section: 'projects', keywords: 'circuit microcontroller embedded chess' },
    { title: 'Behavioral Robotics', subtitle: 'LEGO Bot with TI MSP432', tags: 'project', section: 'projects', keywords: 'robot rtos msp432 sensors autonomous' },
    { title: 'Personal Portfolio (Angular)', subtitle: 'Full-Stack Web Application on AKS', tags: 'project', section: 'projects', keywords: 'angular docker kubernetes azure nginx portfolio' },
    { title: 'DSP Research — GTRI', subtitle: 'Signal Processing Algorithms', tags: 'project', section: 'projects', keywords: 'signal processing matlab python research defense' },
  ];

  function openSearch() {
    searchOverlay.classList.add('active');
    setTimeout(() => searchInput.focus(), 100);
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
    searchResults.innerHTML = '';
    document.body.style.overflow = '';
  }

  searchBtn.addEventListener('click', openSearch);
  searchClose.addEventListener('click', closeSearch);
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearch();
      closeAnalytics();
    }
    // Ctrl/Cmd + K to open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    const results = searchData.filter(item => {
      const haystack = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
      return query.split(/\s+/).every(word => haystack.includes(word));
    });

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><p style="color: var(--text-muted);">No results found.</p></div>';
      return;
    }

    searchResults.innerHTML = results.map(item => `
      <div class="search-result-item" data-section="${escapeAttr(item.section)}">
        <span class="result-tag">${escapeHtml(item.tags)}</span>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.subtitle)}</p>
      </div>
    `).join('');

    // Click to scroll to section
    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const section = document.getElementById(el.dataset.section);
        if (section) {
          closeSearch();
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });

  // ---- Analytics Modal ----
  const analyticsBtn = document.getElementById('analyticsBtn');
  const analyticsModal = document.getElementById('analyticsModal');
  const analyticsClose = document.getElementById('analyticsClose');

  function openAnalytics() {
    analyticsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.apAnalytics) window.apAnalytics.renderDashboard();
  }

  function closeAnalytics() {
    analyticsModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  analyticsBtn.addEventListener('click', openAnalytics);
  analyticsClose.addEventListener('click', closeAnalytics);
  analyticsModal.addEventListener('click', (e) => {
    if (e.target === analyticsModal) closeAnalytics();
  });

  // ---- Contact Form ----
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (!name || !email || !message) return;

      const btn = contactForm.querySelector('.btn-primary');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;

      fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(contactForm)
      })
      .then(response => {
        if (response.ok) {
          btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
          btn.style.background = '#27ae60';
          contactForm.reset();
        } else {
          btn.innerHTML = '<i class="fas fa-times"></i> Failed to Send';
          btn.style.background = '#e74c3c';
        }
      })
      .catch(() => {
        btn.innerHTML = '<i class="fas fa-times"></i> Failed to Send';
        btn.style.background = '#e74c3c';
      })
      .finally(() => {
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      });

      if (window.__appInsights) {
        window.__appInsights.trackEvent({ name: 'ContactFormSubmission' });
      }
    });
  }

  // ---- Parallax subtle effect on hero ----
  const hero = document.getElementById('hero');
  window.addEventListener('scroll', () => {
    if (!hero) return;
    const scrollPos = window.scrollY;
    const heroHeight = hero.offsetHeight;
    if (scrollPos < heroHeight) {
      const opacity = 1 - (scrollPos / heroHeight) * 0.5;
      hero.querySelector('.hero-content').style.opacity = Math.max(opacity, 0.3);
      hero.querySelector('.hero-content').style.transform = `translateY(${scrollPos * 0.15}px)`;
    }
  }, { passive: true });

  // ---- Utility ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  // ---- Card Detail Modal ----
  const cardModal = document.getElementById('cardModal');
  const cardModalClose = document.getElementById('cardModalClose');
  const cardModalBody = document.getElementById('cardModalBody');

  function openCardModal(card) {
    const imageEl = card.querySelector('.card-image');
    const bgStyle = imageEl ? imageEl.getAttribute('style') : '';

    // Get icon or logo from the card
    const iconEl = card.querySelector('.card-icon i');
    const logoEl = card.querySelector('.card-logo');
    let heroContent = '';
    if (logoEl) {
      heroContent = '<img src="' + escapeAttr(logoEl.src) + '" alt="" class="card-modal-logo">';
    } else if (iconEl) {
      heroContent = '<div class="card-modal-icon"><i class="' + escapeAttr(iconEl.className) + '"></i></div>';
    }

    // Get badge and tag
    const badgeEl = card.querySelector('.card-badge');
    const tagEl = card.querySelector('.card-tag');
    const badge = badgeEl ? '<span class="card-modal-badge">' + escapeHtml(badgeEl.textContent) + '</span>' : '';
    const tag = tagEl ? '<span class="card-modal-tag">' + escapeHtml(tagEl.textContent) + '</span>' : '';

    // Get text info
    const title = card.querySelector('.card-info h3');
    const subtitle = card.querySelector('.card-subtitle');
    const date = card.querySelector('.card-date');

    // Get expanded details
    const expanded = card.querySelector('.card-expanded');
    const listItems = expanded ? expanded.querySelectorAll('li') : [];
    const techSpans = expanded ? expanded.querySelectorAll('.card-tech span') : [];

    let detailsHtml = '';
    if (listItems.length > 0) {
      detailsHtml += '<div class="modal-details"><h3>Details</h3><ul>';
      listItems.forEach(li => { detailsHtml += '<li>' + li.innerHTML + '</li>'; });
      detailsHtml += '</ul></div>';
    }

    let techHtml = '';
    if (techSpans.length > 0) {
      techHtml = '<div class="modal-tech">';
      techSpans.forEach(span => { techHtml += '<span>' + escapeHtml(span.textContent) + '</span>'; });
      techHtml += '</div>';
    }

    cardModalBody.innerHTML =
      '<div class="card-modal-hero" ' + bgStyle + '>' +
        heroContent + badge + tag +
      '</div>' +
      '<div class="card-modal-body">' +
        '<h2>' + (title ? escapeHtml(title.textContent) : '') + '</h2>' +
        '<p class="modal-subtitle">' + (subtitle ? escapeHtml(subtitle.textContent) : '') + '</p>' +
        (date ? '<p class="modal-date"><i class="far fa-calendar-alt"></i> ' + escapeHtml(date.textContent) + '</p>' : '') +
        detailsHtml +
        techHtml +
      '</div>';

    cardModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCardModal() {
    cardModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  cardModalClose.addEventListener('click', closeCardModal);
  cardModal.addEventListener('click', (e) => {
    if (e.target === cardModal) closeCardModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCardModal();
  });

  // Attach click to all cards
  document.querySelectorAll('.card[data-category]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking a link inside the card
      if (e.target.closest('a')) return;
      openCardModal(card);
    });
  });

})();
