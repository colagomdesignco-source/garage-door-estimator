// Garage Door Estimator — Glass Options Patch v3
// Precise fix for getWindowPhotoKey returning wrong image for Plain glass

(function () {

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {

    // Wait for the page's own JS to finish defining everything
    setTimeout(function () {

      // ── Fix 1: Patch getWindowPhotoKey ──────────────────────────────────
      // The original function tries to look up short_white_plain etc in PHOTOS,
      // but those entries had corrupt data and were deleted.
      // Now when Plain is selected, we return the base door photo (no overlay).
      if (typeof getWindowPhotoKey === 'function') {
        const _orig = getWindowPhotoKey;
        window.getWindowPhotoKey = function (style, color, insertStyle, glassType) {

          // If plain/no insert selected, return just the base door photo key
          if (!insertStyle || insertStyle === '' || insertStyle === 'plain') {
            // Map style to panel
            let panel;
            if (style === 'raised-long' || style === 'carriage-long') panel = 'long';
            else if (style === 'raised-short' || style === 'carriage-short') panel = 'short';
            else panel = 'skyline';

            const col = (color === 'almond') ? 'almond' : (color === 'black') ? 'black' : 'white';

            // Return the base door key (no insert suffix) so the plain door shows
            const baseKey = panel + '_' + col;
            if (typeof PHOTOS !== 'undefined' && PHOTOS[baseKey]) {
              return baseKey;
            }
          }

          // For all other inserts, use the original function
          return _orig(style, color, insertStyle, glassType);
        };
      }

      // ── Fix 2: Fix Plain insert card showing wrong photo thumbnail ──────
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
                svg.style.cssText = 'width:90px;height:56px;display:block;background:#eef3f0;border-radius:4px;';
                svg.innerHTML =
                  '<rect x="6"  y="10" width="22" height="44" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>' +
                  '<rect x="33" y="10" width="22" height="44" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>' +
                  '<rect x="60" y="10" width="22" height="44" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>';
                thumb.appendChild(svg);
              }
            }
          }
        });
      }

      // Run on load and after any card click
      fixInsertCards();

      document.addEventListener('click', function (e) {
        if (e.target.closest('.insert-card, .glass-card, .door-card, .color-tile')) {
          setTimeout(fixInsertCards, 80);
        }
      });

    }, 400);

  });

})();
