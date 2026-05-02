// Garage Door Estimator — Glass Options Patch v5

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

      // ── Fix 1: Patch getWindowPhotoKey so Plain shows base door photo ────
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

      // ── Fix 2: Remove "Plain" card from Glass Type section ───────────────
      // The glass-card with "Plain" text should not appear — Plain is
      // already handled by Window Insert Style → "Plain (no insert)"
      function removePlainGlassCard() {
        const glassCards = document.querySelectorAll('.glass-card');
        glassCards.forEach(function (card) {
          const name = card.querySelector('.glass-name');
          if (name && name.textContent.trim().toLowerCase() === 'plain') {
            card.remove();
          }
        });
      }

      // ── Fix 3: Fix glass overlay to only cover window strip ──────────────
      // The overlay already uses height:18% which is correct.
      // But the tint layer inside needs to not bleed outside the strip.
      // We patch updateGlassOverlay to ensure correct positioning.
      if (typeof updateGlassOverlay === 'function') {
        const _orig = updateGlassOverlay;
        window.updateGlassOverlay = function (wrapperId) {
          _orig(wrapperId);
          // After original runs, fix any overlay that's too tall
          const wrapper = document.getElementById(wrapperId);
          if (!wrapper) return;
          const overlay = wrapper.querySelector('.glass-strip-overlay');
          if (overlay) {
            overlay.style.height = '22%';
            overlay.style.top = '0';
            overlay.style.overflow = 'hidden';
          }
        };
      }

      // Run fixes immediately
      removePlainGlassCard();

      // Re-run after clicks (glass cards may be re-rendered)
      document.addEventListener('click', function (e) {
        if (e.target.closest('.glass-card, .door-card, .color-tile, .insert-card')) {
          setTimeout(removePlainGlassCard, 80);
        }
      });

    }, 400);
  });

})();
