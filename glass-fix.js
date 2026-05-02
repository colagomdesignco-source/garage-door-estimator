// Garage Door Estimator — Glass Options Patch
// Fixes: 1) Plain glass showing Cascade image  2) Insert selection highlight typo
// Apply by adding this line before </body> in index.html:
//   <script src="glass-fix.js"></script>

(function () {
  // ── Fix 1: Remove corrupt PHOTOS entries ──────────────────────────────────
  // These three keys were embedded with the wrong base64 image data
  // (Cascade, Stockton, and frosted glass respectively).
  // Deleting them lets the renderer fall through to the SVG placeholder below.
  function patchPhotos() {
    if (typeof PHOTOS !== 'undefined') {
      delete PHOTOS.short_white_plain;
      delete PHOTOS.long_almond_plain;
      delete PHOTOS.long_white_plain;
    }
  }

  // ── Fix 2: Patch renderInsertCards to fix typo + add plain SVG thumb ──────
  function patchRenderInsertCards() {
    if (typeof renderInsertCards !== 'function') return;

    const original = renderInsertCards;

    window.renderInsertCards = function () {
      original.apply(this, arguments);

      // After cards are rendered, fix selection highlight (state.insertStyle → state.windowInsert)
      // and replace any wrong plain thumbnails with the SVG placeholder.
      const cards = document.querySelectorAll('.insert-card');
      cards.forEach(card => {
        const id = card.dataset.insertId || card.getAttribute('data-insert-id');

        // Fix selection highlight
        if (typeof state !== 'undefined' && id) {
          card.classList.toggle('selected', state.windowInsert === id);
        }

        // Fix plain thumbnail
        if (id === 'plain') {
          const img = card.querySelector('img');
          if (img) {
            // Replace bad image with SVG placeholder
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 96 64');
            svg.style.cssText = 'width:100%;height:64px;display:block;background:#eef3f0;';
            svg.innerHTML = `
              <rect x="6"  y="14" width="20" height="36" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>
              <rect x="32" y="14" width="20" height="36" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>
              <rect x="58" y="14" width="20" height="36" rx="2" fill="#f6fafa" stroke="#b8c6c0" stroke-width="1.2"/>
            `;
            img.replaceWith(svg);
          }
        }
      });
    };
  }

  // ── Wait for page to be ready, then apply patches ─────────────────────────
  function applyPatches() {
    patchPhotos();
    patchRenderInsertCards();

    // Re-render insert cards if the function is available
    if (typeof renderInsertCards === 'function') {
      renderInsertCards();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    applyPatches();
  }
})();
