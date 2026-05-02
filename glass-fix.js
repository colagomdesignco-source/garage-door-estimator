// Garage Door Estimator — Glass Options Patch v4

(function () {

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    setTimeout(function () {

      // ── Fix 1: Patch getWindowPhotoKey so Plain shows base door (no overlay) ──
      if (typeof getWindowPhotoKey === 'function') {
        const _orig = getWindowPhotoKey;
        window.getWindowPhotoKey = function (style, color, insertStyle, glassType) {
          if (!insertStyle || insertStyle === '' || insertStyle === 'plain') {
            let panel;
            if (style === 'raised-long' || style === 'carriage-long') panel = 'long';
            else if (style === 'raised-short' || style === 'carriage-short') panel = 'short';
            else panel = 'skyline';
            const col = (color === 'almond') ? 'almond' : (color === 'black') ? 'black' : 'white';
            const baseKey = panel + '_' + col;
            if (typeof PHOTOS !== 'undefined' && PHOTOS[baseKey]) return baseKey;
          }
          return _orig(style, color, insertStyle, glassType);
        };
      }

      // ── Fix 2: Remove "Plain (no insert)" card from Window Insert Style ──
      function removePlainInsertCard() {
        const cards = document.querySelectorAll('.insert-card');
        cards.forEach(function (card) {
          const nameEl = card.querySelector('.insert-name');
          if (nameEl && nameEl.textContent.trim().toLowerCase().startsWith('plain')) {
            card.remove();
          }
        });
      }

      // ── Fix 3: Fix preview insert overlay sizing ──────────────────────
      function fixPreviewOverlay() {
        const insertImg = document.querySelector('.preview-insert-img');
        if (insertImg) {
          insertImg.style.cssText = [
            'position:absolute',
            'top:0',
            'left:0',
            'width:100%',
            'height:100%',
            'object-fit:cover',
            'object-position:top center',
            'pointer-events:none',
            'display:block',
          ].join(';');
        }
      }

      // ── Fix 4: Patch renderInsertCards to auto-remove Plain card ─────
      if (typeof renderInsertCards === 'function') {
        const _orig = renderInsertCards;
        window.renderInsertCards = function () {
          _orig.apply(this, arguments);
          removePlainInsertCard();
          fixPreviewOverlay();
        };
      }

      // Run immediately
      removePlainInsertCard();
      fixPreviewOverlay();

      // Re-run after any click (in case cards are re-rendered)
      document.addEventListener('click', function (e) {
        if (e.target.closest('.insert-card, .glass-card, .door-card, .color-tile')) {
          setTimeout(function () {
            removePlainInsertCard();
            fixPreviewOverlay();
          }, 80);
        }
      });

    }, 400);
  });

})();
