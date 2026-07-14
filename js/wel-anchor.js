/* wel-anchor — JS tethering for `[popover]` where CSS anchor positioning
   is unsupported (docs/components/popover-menu.md, T-66; delivery per
   ADR-0011). Presentation only: Core popovers are fully functional as the
   designed centred panel; this module moves them next to their invoker
   for projects that want tethering everywhere. Detect and yield (08):
   where the engine supports anchor positioning the module no-ops — the
   Enhanced CSS owns placement — and it is deleted when the feature
   graduates (ADR-0012). One capture-phase toggle listener positions any
   [popover] with a popovertarget invoker, so late-added DOM needs no
   re-scan. Config is what the CSS already reads: data-placement
   (block-end default; .tooltip defaults block-start to match its
   stylesheet) and the component offset token, resolved through a real
   property so clamp()/vi expressions come back as px. Mirrors
   position-try flip: the box swaps sides when the preferred side lacks
   room, then clamps to the viewport. */

const BOUND = Symbol();
const open = new Set();

function place(pop) {
  if (!pop.isConnected) { open.delete(pop); return; }
  const invoker = document.querySelector(`[popovertarget="${CSS.escape(pop.id)}"]`);
  if (!invoker) return;

  // Resolve the gap via margin-top: computed margins are always px, so
  // untyped tokens (clamp, vi) resolve for free. Then take the box over.
  pop.style.margin = 'var(--wel-popover-offset, var(--wel-tooltip-offset, 0.25rem))';
  const gap = parseFloat(getComputedStyle(pop).marginTop) || 0;
  pop.style.margin = '0';
  pop.style.position = 'fixed'; // top-layer containing block is the viewport
  pop.style.inset = 'auto';     // UA popover style is inset: 0

  const a = invoker.getBoundingClientRect();
  const p = pop.getBoundingClientRect();
  const vw = innerWidth;
  const vh = innerHeight;
  const rtl = getComputedStyle(pop).direction === 'rtl';
  const logical = pop.dataset.placement
    || (pop.classList.contains('tooltip') ? 'block-start' : 'block-end');
  const side = {
    'block-start': 'top',
    'inline-start': rtl ? 'right' : 'left',
    'inline-end': rtl ? 'left' : 'right',
  }[logical] || 'bottom';

  const above = a.top - gap - p.height;
  const below = a.bottom + gap;
  const before = a.left - gap - p.width;
  const after = a.right + gap;
  let top;
  let left;
  if (side === 'top' || side === 'bottom') {
    const preferTop = side === 'top' ? above >= 0 : below + p.height > vh && above >= 0;
    top = preferTop ? above : below;
    left = a.left + (a.width - p.width) / 2; // anchor-center
  } else {
    const preferLeft = side === 'left' ? before >= 0 : after + p.width > vw && before >= 0;
    left = preferLeft ? before : after;
    top = a.top + (a.height - p.height) / 2;
  }
  pop.style.top = `${Math.min(Math.max(top, gap), vh - p.height - gap)}px`;
  pop.style.left = `${Math.min(Math.max(left, gap), vw - p.width - gap)}px`;
}

function onToggle(e) {
  const pop = e.target;
  if (!pop.matches?.('[popover]') || !pop.id) return;
  if (e.newState === 'open') { place(pop); open.add(pop); }
  else open.delete(pop);
}

const refresh = () => { for (const pop of open) place(pop); };

/** Bind the capture-phase tether on root, once. */
export default function upgrade(root = document) {
  if (CSS.supports('anchor-name: --wel-a')) return; // yield to the platform
  if (root[BOUND]) return;
  root[BOUND] = true;

  // toggle does not bubble; capture still reaches the root.
  root.addEventListener('toggle', onToggle, true);
  // The invoker moves under scroll/resize while the box is fixed.
  addEventListener('scroll', refresh, { capture: true, passive: true });
  addEventListener('resize', refresh);
}

upgrade();
