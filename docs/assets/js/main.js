// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', () => {
  // Handle anchor link clicks
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without triggering scroll
        history.pushState(null, null, href);
      }
    });
  });

  // Highlight current section in sidebar
  const sections = document.querySelectorAll('.docs-main section[id], .docs-main .api-section[id], .docs-main .example-section[id]');
  const navLinks = document.querySelectorAll('.docs-nav a[href^="#"]');

  if (sections.length > 0 && navLinks.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              const href = link.getAttribute('href');
              if (href === `#${id}`) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px'
      }
    );

    sections.forEach(section => observer.observe(section));
  }

  // Code copy buttons
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    const pre = block.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');

    button.addEventListener('click', async () => {
      const code = block.textContent;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
        button.textContent = 'Failed';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
      }
    });

    pre.style.position = 'relative';
    pre.appendChild(button);
  });

  // Mobile menu toggle
  const createMobileMenu = () => {
    const navbar = document.querySelector('.navbar .container');
    if (!navbar || window.innerWidth > 768) return;

    const navLinks = navbar.querySelector('.nav-links');
    if (!navLinks) return;

    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '☰';
    menuButton.setAttribute('aria-label', 'Toggle menu');
    menuButton.setAttribute('aria-expanded', 'false');

    menuButton.addEventListener('click', () => {
      const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('show');
    });

    navbar.insertBefore(menuButton, navLinks);
  };

  createMobileMenu();

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const menuButton = document.querySelector('.mobile-menu-button');
      if (window.innerWidth > 768 && menuButton) {
        menuButton.remove();
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) navLinks.classList.remove('show');
      } else if (window.innerWidth <= 768 && !menuButton) {
        createMobileMenu();
      }
    }, 250);
  });

  // Back to top button
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.innerHTML = '↑';
  backToTop.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Escape to close mobile menu
    if (e.key === 'Escape') {
      const navLinks = document.querySelector('.nav-links.show');
      if (navLinks) {
        navLinks.classList.remove('show');
        const menuButton = document.querySelector('.mobile-menu-button');
        if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// Add additional CSS for interactive elements
const style = document.createElement('style');
style.textContent = `
  .copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.75rem;
    background-color: rgba(163, 230, 53, 0.1);
    color: #a3e635;
    border: 1px solid rgba(163, 230, 53, 0.3);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0;
    font-weight: 500;
  }

  pre:hover .copy-button {
    opacity: 1;
  }

  .copy-button:hover {
    background-color: rgba(163, 230, 53, 0.2);
    border-color: rgba(163, 230, 53, 0.5);
  }

  .copy-button.copied {
    background-color: rgba(34, 197, 94, 0.3);
    border-color: rgba(34, 197, 94, 0.5);
    color: #22c55e;
  }

  .back-to-top {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 3rem;
    height: 3rem;
    background-color: #a3e635;
    color: #020617;
    border: none;
    border-radius: 50%;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.4);
    z-index: 999;
    font-weight: bold;
  }

  .back-to-top.show {
    opacity: 1;
    visibility: visible;
  }

  .back-to-top:hover {
    background-color: #84cc16;
    transform: translateY(-3px);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.3);
  }

  .mobile-menu-button {
    display: none;
    background: none;
    border: none;
    color: #a3e635;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  @media (max-width: 768px) {
    .mobile-menu-button {
      display: block;
    }

    .nav-links {
      display: none;
      flex-direction: column;
      width: 100%;
      gap: 0.5rem;
    }

    .nav-links.show {
      display: flex;
    }
  }
`;
document.head.appendChild(style);
