/* carousel-buttons — visible prev/next controls for `.carousel` where the
   Enhanced CSS (`::scroll-button()`) is unsupported
   (docs/components/carousel.md, T-64; delivery per ADR-0011). The 2.5.7
   single-pointer alternative to swiping for fallback browsers. Detect and
   yield: where the engine supports ::scroll-button the module no-ops
   entirely — the generated CSS buttons own the job once they pass intake
   (until then such engines keep keyboard/scrollbar/swipe; the carousel
   spec documents this interim honestly) — and the module is deleted when
   the feature graduates. Opt-in: [data-carousel-buttons] on .carousel.
   Labels default to Previous/Next slide; override with
   data-carousel-prev-label / data-carousel-next-label. */

const UPGRADED = Symbol();

function upgradeCarousel(root) {
  if (root[UPGRADED]) return;
  const track = root.querySelector('.carousel-track');
  if (!track) return;
  root[UPGRADED] = true;

  const make = (dir, glyph, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'button';
    b.dataset.size = 'sm';
    b.setAttribute('aria-label', label);
    b.textContent = glyph;
    b.addEventListener('click', () => {
      // One snap stop: the distance between adjacent snap targets, or a
      // viewport's worth when there is a single slide. RTL flips the
      // physical scroll direction.
      const [a, c] = track.children;
      const step = a && c
        ? Math.abs(c.offsetLeft - a.offsetLeft)
        : track.clientWidth;
      const rtl = getComputedStyle(track).direction === 'rtl';
      track.scrollBy({ left: dir * (rtl ? -step : step), behavior: 'smooth' });
    });
    return b;
  };

  const prev = make(-1, '‹', root.dataset.carouselPrevLabel || 'Previous slide');
  const next = make(1, '›', root.dataset.carouselNextLabel || 'Next slide');

  const controls = document.createElement('div');
  controls.className = 'cluster';
  controls.append(prev, next);
  root.append(controls);

  // Mirror the UA behaviour of generated scroll buttons: disable at the
  // ends. |scrollLeft| handles the negative RTL coordinate space.
  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    const pos = Math.abs(track.scrollLeft);
    prev.disabled = pos <= 1;
    next.disabled = pos >= max - 1;
  };
  sync();
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  // Resizing changes scrollWidth/clientWidth without a scroll event —
  // the end states must follow (T-64 review). Observing the track covers
  // window and container resizes alike.
  new ResizeObserver(() => sync()).observe(track);

  return root;
}

/** Upgrade every opted-in carousel under root, now and later. */
export default function upgrade(root = document) {
  if (CSS.supports('selector(::scroll-button(*))')) return; // yield to the platform

  for (const c of root.querySelectorAll('.carousel[data-carousel-buttons]')) upgradeCarousel(c);

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('.carousel[data-carousel-buttons]')) upgradeCarousel(node);
        for (const c of node.querySelectorAll?.('.carousel[data-carousel-buttons]') ?? []) upgradeCarousel(c);
      }
    }
  }).observe(root === document ? document.documentElement : root, { childList: true, subtree: true });
}

upgrade();
