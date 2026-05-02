// Garage Door Estimator — Glass Options Patch v2
// Fixes:
//   1. Plain glass showing wrong image (Cascade)
//   2. Live preview not matching selected color/panel style
//   3. Insert thumbnails not reflecting selected door color
// Add before </body>:  <script src="glass-fix.js"></script>

(function () {

  // ── Wait until page JS is fully loaded ───────────────────────────────────
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {

    // ── Fix 1: Delete corrupt PHOTOS entries ──────────────────────────────
    // These keys had wrong base64 data (Cascade/Stockton/Frosted images)
    if (typeof PHOTOS !== 'undefined') {
      delete PHOTOS.short_white_plain;
      delete PHOTOS.long_almond_plain;
      delete PHOTOS.long_white_plain;
    }

    // ── Fix 2: Patch updatePreview to use correct door+color+glass image ──
    if (typeof updatePreview === 'function') {
      const _origUpdate = updatePreview;
      window.updatePreview = function () {
        _origUpdate.apply(this, arguments);
        fixPreviewImage();
      };
    }

    // ── Fix 3: Patch renderInsertCards ────────────────────────────────────
    if (typeof renderInsertCards === 'function') {
      const _origRender = renderInsertCards;
      window.renderInsertCards = function () {
        _origRender.apply(this, arguments);
        fixInsertCards();
      };
    }

    // ── Helper: fix the live preview image ───────────────────────────────
    function fixPreviewImage() {
      if (typeof state === 'undefined' || typeof PHOTOS === 'undefined') return;

      const img = document.querySelector('.preview-door-img');
      if (!img) return;

      const panel  = state.panelStyle  || '';
      const color  = state.color       || '';
      const insert = state.windowInsert || 'plain';

      if (!panel || !color) return;

      const exactKey = panel + '_' + color + '_' + insert;
      const baseKey  = panel + '_' + color;

      let src = null;
      if (insert !== 'plain' && PHOTOS[exactKey]) {
        src = PHOTOS[exactKey];
      } else if (PHOTOS[baseKey]) {
        src = PHOTOS[baseKey];
      }

      if (src && img.src !== src) {
        img.src = src;
      }
    }

    // ── Helper: fix Plain insert card thumbnail ───────────────────────────
    function fixInsertCards() {
      const cards = document.querySelectorAll('.insert-card');
      cards.forEach(function (card) {
        const nameEl  = card.querySelector('.insert-name');
        const isPlain = nameEl && nameEl.textContent.trim().toLowerCase().startsWith('plain');

        if (isPlain) {
          const existingImg = card.querySelector('img');
          const thumb = card.querySelector('.insert-thumb');
          if (existingImg && thumb) {
            existingImg.remove();
            if (!thumb.querySelector('svg')) {
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.setAttribute('viewBox', '0 0 96 64');
              svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              svg.style.cssText = 'width:90px;height:56px;display:block;background:#eef3f0;border-radius:4px;';
              svg.innerHTML =
                '<rect x="6"  y="10" width="22" height="44" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>' +
                '<rect x="33" y="10" width="22" height="44" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>' +
                '<rect x="60" y="10" width="22" height="44" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>';
              thumb.appendChild(svg);
            }
          }
        }

        if (typeof state !== 'undefined') {
          const nameText    = nameEl ? nameEl.textContent.trim().toLowerCase() : '';
          const cardInsertId = card.dataset.insertId || card.getAttribute('data-id') || nameText;
          card.classList.toggle('selected', state.windowInsert === cardInsertId);
        }
      });
    }

    // ── Run once on load, then on every click ────────────────────────────
    setTimeout(function () {
      fixPreviewImage();
      fixInsertCards();

      document.addEventListener('click', function (e) {
        const card = e.target.closest('.insert-card, .glass-card, .door-card, .color-tile');
        if (card) {
          setTimeout(function () {
            fixPreviewImage();
            fixInsertCards();
          }, 50);
        }
      });
    }, 300);

  });

})();
