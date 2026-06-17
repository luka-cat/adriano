/* ============================================
   Adriano — app.js
   Senior Developer Quality
   ============================================ */

'use strict';

// ===== STATE =====
const state = {
  cart: JSON.parse(localStorage.getItem('adriano_cart') || '[]'),
  activeCategory: 'all',
};

const WHATSAPP_NUMBER = '996700000000';

// ===== DOM HELPERS =====
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ===== PRELOADER =====
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const preloader = $('#preloader');
    if (preloader) preloader.classList.add('hidden');
  }, 200);
});

// ===== AOS INIT =====
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({
    duration: 700,
    once: true,
    easing: 'ease-out-cubic',
    offset: 60,
  });

  initHeader();
  initHero();
  initMenuFilter();
  initCart();
  initBranches();
  initDelivery();
  initMobileNav();
  initRipple();
  renderCart();
});

// ===== HEADER =====
function initHeader() {
  const header = $('#header');
  const burger = $('#burger-btn');
  const mobileMenu = $('#mobile-menu');

  // Scroll class
  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('active');
    });
    $$('.mm-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('active');
      });
    });
  }

  // Smooth scroll for nav links
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ===== HERO =====
function initHero() {
  // Parallax
  const heroBg = $('#hero-bg');
  const aboutBg = $('#about-bg');

  const handleParallax = () => {
    const sy = window.scrollY;
    if (heroBg) {
      heroBg.style.transform = `translateY(${sy * 0.35}px)`;
    }
    if (aboutBg) {
      const aboutSection = $('#about');
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        const offset = (window.innerHeight - rect.top) * 0.2;
        aboutBg.style.transform = `translateY(${-offset}px)`;
      }
    }
  };
  window.addEventListener('scroll', handleParallax, { passive: true });

  // Floating coffee beans
  const beansContainer = $('#beans');
  if (beansContainer) {
    const beanEmojis = ['☕', '🫘', '🍂', '✦'];
    for (let i = 0; i < 12; i++) {
      const bean = document.createElement('span');
      bean.className = 'bean';
      bean.textContent = beanEmojis[Math.floor(Math.random() * beanEmojis.length)];
      bean.style.left = `${Math.random() * 95}%`;
      bean.style.fontSize = `${12 + Math.random() * 18}px`;
      bean.style.animationDuration = `${8 + Math.random() * 12}s`;
      bean.style.animationDelay = `${Math.random() * -14}s`;
      beansContainer.appendChild(bean);
    }
  }

  // GSAP hero animations
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-title', {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.3,
    });
  }
}

// ===== MENU FILTER =====
function initMenuFilter() {
  const tabs = $$('.cat-tab');
  const cards = $$('.menu-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      state.activeCategory = cat;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter cards with animation
      cards.forEach((card, i) => {
        const cardCat = card.dataset.cat;
        const show = cat === 'all' || cardCat === cat;

        if (show) {
          card.style.display = 'flex';
          card.style.animation = 'none';
          card.offsetHeight; // reflow
          card.style.animation = `fadeInCard 0.4s ease ${i % 6 * 60}ms both`;
        } else {
          card.style.display = 'none';
        }
      });

      // Refresh AOS
      setTimeout(() => AOS.refresh(), 100);
    });
  });

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInCard {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);

  // Add to cart buttons
  $$('.card-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.name;
      const price = parseInt(btn.dataset.price);
      const img = btn.dataset.img;
      addToCart({ name, price, img });
      animateAddToCart(btn);
    });
  });
}

// ===== CART =====
function initCart() {
  const cartBtn = $('#cart-btn');
  const cartBtnMob = $('#cart-btn-mobile');
  const cartClose = $('#cart-close');
  const cartOverlay = $('#cart-overlay');
  const sidebar = $('#cart-sidebar');

  const open = () => {
    sidebar.classList.add('open');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    sidebar.classList.remove('open');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (cartBtn) cartBtn.addEventListener('click', open);
  if (cartBtnMob) cartBtnMob.addEventListener('click', open);
  if (cartClose) cartClose.addEventListener('click', close);
  if (cartOverlay) cartOverlay.addEventListener('click', close);

  // WhatsApp send
  const sendBtn = $('#whatsapp-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      sendToWhatsApp();
    });
  }
}

function addToCart(item) {
  const existing = state.cart.find(c => c.name === item.name);
  if (existing) {
    existing.qty++;
  } else {
    state.cart.push({ ...item, qty: 1 });
  }
  saveCart();
  renderCart();
  updateCartBadge();
}

function removeFromCart(name) {
  const idx = state.cart.findIndex(c => c.name === name);
  if (idx === -1) return;
  if (state.cart[idx].qty > 1) {
    state.cart[idx].qty--;
  } else {
    state.cart.splice(idx, 1);
  }
  saveCart();
  renderCart();
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem('adriano_cart', JSON.stringify(state.cart));
}

function renderCart() {
  const container = $('#cart-items');
  const emptyEl = $('#cart-empty');
  const footer = $('#cart-footer');
  const totalEl = $('#cart-total-price');

  if (!container) return;

  // Remove old items (keep empty message)
  $$('.cart-item', container).forEach(el => el.remove());

  if (state.cart.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (footer) footer.style.display = 'block';

  let total = 0;
  state.cart.forEach(item => {
    total += item.price * item.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="ci-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="ci-info">
        <h4>${item.name}</h4>
        <p>${item.price} сом × ${item.qty}</p>
      </div>
      <div class="ci-controls">
        <button class="ci-btn ci-minus" data-name="${item.name}" aria-label="Уменьшить">−</button>
        <span class="ci-qty">${item.qty}</span>
        <button class="ci-btn ci-plus" data-name="${item.name}" aria-label="Увеличить">+</button>
      </div>
    `;
    container.appendChild(el);
  });

  if (totalEl) totalEl.textContent = `${total.toLocaleString('ru')} сом`;

  // Bind controls
  $$('.ci-minus', container).forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.name));
  });
  $$('.ci-plus', container).forEach(btn => {
    btn.addEventListener('click', () => addToCart({ name: btn.dataset.name, price: state.cart.find(c => c.name === btn.dataset.name)?.price, img: state.cart.find(c => c.name === btn.dataset.name)?.img }));
  });
}

function updateCartBadge() {
  const total = state.cart.reduce((s, c) => s + c.qty, 0);
  const badge = $('#cart-count');
  const badgeMob = $('#cart-count-mob');
  [badge, badgeMob].forEach(el => {
    if (!el) return;
    el.textContent = total;
    if (total > 0) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  });
}

function sendToWhatsApp() {
  if (state.cart.length === 0) return;

  let orderText = '🛒 *Заказ из Adriano:*\n\n';
  let total = 0;

  state.cart.forEach(item => {
    orderText += `• ${item.name} × ${item.qty} = ${item.price * item.qty} сом\n`;
    total += item.price * item.qty;
  });
  orderText += `\n💰 *Итого: ${total.toLocaleString('ru')} сом*`;
  orderText += '\n\nПожалуйста, подтвердите заказ и уточните адрес доставки.';

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function animateAddToCart(btn) {
  btn.style.transform = 'scale(0.8) rotate(45deg)';
  btn.style.background = '#4CAF50';
  const icon = btn.querySelector('i');
  if (icon) icon.className = 'fa-solid fa-check';

  setTimeout(() => {
    btn.style.transform = '';
    btn.style.background = '';
    if (icon) icon.className = 'fa-solid fa-plus';
  }, 700);

  // Badge bounce
  const badge = $('#cart-count');
  if (badge) {
    badge.style.transform = 'scale(1.5)';
    setTimeout(() => { badge.style.transform = ''; }, 300);
  }
}

// ===== BRANCHES =====
function initBranches() {
  const triggers = [
    '#branches-trigger',
    '#branches-trigger-mob',
    '#branches-trigger-footer',
    '#branches-trigger-bnav',
  ];

  const overlay = $('#branches-overlay');
  const sidebar = $('#branches-sidebar');
  const closeBtn = $('#branches-close');

  const open = () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    requestGeolocation();
  };

  const close = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  triggers.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) overlay.addEventListener('click', close);
}

function requestGeolocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      highlightNearestBranch(userLat, userLng);
    },
    () => { /* Permission denied - no problem */ }
  );
}

function highlightNearestBranch(userLat, userLng) {
  const cards = $$('.branch-card');
  let nearestCard = null;
  let minDist = Infinity;

  cards.forEach(card => {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    const dist = calcDistance(userLat, userLng, lat, lng);
    if (dist < minDist) {
      minDist = dist;
      nearestCard = card;
    }
  });

  if (nearestCard) {
    nearestCard.classList.add('nearest-branch');
    const tag = nearestCard.querySelector('.branch-tag.nearest');
    if (tag) tag.style.display = 'inline-block';
    // Scroll into view
    setTimeout(() => {
      nearestCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  }
}

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===== DELIVERY =====
function initDelivery() {
  const whatsappBtn = $('#whatsapp-order-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Здравствуйте! Хочу сделать заказ из Adriano.')}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
}

// ===== MOBILE BOTTOM NAV =====
function initMobileNav() {
  const bnavItems = $$('.bnav-item');
  window.addEventListener('scroll', () => {
    const sections = ['#menu', '#delivery'];
    sections.forEach(sel => {
      const sec = document.querySelector(sel);
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        bnavItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === sel) item.classList.add('active');
        });
      }
    });
  }, { passive: true });
}

// ===== RIPPLE =====
function initRipple() {
  $$('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ===== INIT ON LOAD =====
updateCartBadge();