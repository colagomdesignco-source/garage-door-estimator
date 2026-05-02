// Garage Door Estimator — Glass Options Patch v6

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

      // ── Fix 2: Use MutationObserver to ALWAYS remove Plain glass card ───
      // This fires every time the DOM changes, so it catches re-renders too
      function removePlainGlassCard() {
        document.querySelectorAll('.glass-card').forEach(function (card) {
          if (card.onclick && card.onclick.toString().indexOf("'plain'") !== -1) {
            card.remove();
          }
          // Also catch by text content
          const name = card.querySelector('.glass-name');
          if (name && name.textContent.trim().toLowerCase() === 'plain') {
            card.remove();
          }
        });
      }

      // Run immediately
      removePlainGlassCard();

      // Watch for any DOM changes and re-remove if it comes back
      const observer = new MutationObserver(function () {
        removePlainGlassCard();
      });
      observer.observe(document.body, { childList: true, subtree: true });

    }, 300);
  });

})();
