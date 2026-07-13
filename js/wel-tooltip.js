/* wel-tooltip — hover/focus reveal for `.tooltip[popover]` triggers
   (docs/components/tooltip.md, T-63; delivery per ADR-0011). The Core
   toggletip needs no JS; this module adds what CSS cannot express — the
   WCAG 1.4.13 trio for hover-triggered content: dismissable (Esc, no
   focus/pointer move), hoverable (pointer may cross onto the bubble),
   persistent (stays while hovered/focused).

   Show fires after --wel-tooltip-show-delay (interaction timing read off
   the tooltip, deliberately not multiplied by --wel-motion) on
   pointerenter, immediately on focus. Hide on leaving trigger+tooltip
   (a ~100ms internal grace covers the pointer corridor across the anchor
   gap — not a token; the spec's hide-delay question stays deferred),
   on focusout, and on Esc. Where the engine supports popover="hint" the
   popover is upgraded at runtime — never in markup, because the invalid-
   value fallback (`manual`) would silently drop light dismiss and Esc. */

const UPGRADED = Symbol();
const HINT_OK = (() => {
  const d = document.createElement('div');
  try { d.popover = 'hint'; } catch { /* older engines throw on set */ }
  return d.popover === 'hint';
})();

function upgradeTrigger(trigger) {
  if (trigger[UPGRADED]) return;
  const tip = document.getElementById(trigger.getAttribute('popovertarget') || '');
  if (!tip || !tip.classList.contains('tooltip')) return;
  trigger[UPGRADED] = true;

  if (HINT_OK) tip.popover = 'hint';

  let showTimer;
  let hideTimer;
  const show = () => { try { tip.showPopover(); } catch { /* already open / disconnected */ } };
  const hide = () => { try { tip.hidePopover(); } catch { /* already closed */ } };

  const scheduleShow = () => {
    clearTimeout(hideTimer);
    // The token is a <time>: honour the unit — minifiers rewrite
    // `600ms` to `.6s`, so bare parseFloat would read 0.6 (ms).
    const raw = getComputedStyle(tip).getPropertyValue('--wel-tooltip-show-delay').trim();
    const n = parseFloat(raw);
    const delay = Number.isNaN(n) ? 600 : /[\d.]s$/.test(raw) ? n * 1000 : n;
    showTimer = setTimeout(show, delay);
  };
  const scheduleHide = () => {
    clearTimeout(showTimer);
    hideTimer = setTimeout(hide, 100);
  };
  const cancelHide = () => clearTimeout(hideTimer);

  trigger.addEventListener('pointerenter', scheduleShow);
  trigger.addEventListener('pointerleave', scheduleHide);
  tip.addEventListener('pointerenter', cancelHide);
  tip.addEventListener('pointerleave', scheduleHide);

  trigger.addEventListener('focusin', () => { clearTimeout(hideTimer); show(); });
  trigger.addEventListener('focusout', () => { clearTimeout(showTimer); hide(); });

  // Esc dismisses without moving focus — native for auto/hint popovers;
  // this keeps it true while a show is merely pending, too.
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { clearTimeout(showTimer); hide(); }
  });
}

/** Upgrade every tooltip trigger under root, now and later. */
export default function upgrade(root = document) {
  for (const t of root.querySelectorAll('[popovertarget]')) upgradeTrigger(t);

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('[popovertarget]')) upgradeTrigger(node);
        for (const t of node.querySelectorAll?.('[popovertarget]') ?? []) upgradeTrigger(t);
      }
    }
  }).observe(root === document ? document.documentElement : root, { childList: true, subtree: true });
}

upgrade();
