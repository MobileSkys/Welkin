/* wel-dialog — declarative opening for `.dialog` via [data-dialog-open]
   (docs/components/dialog.md, T-65; delivery per ADR-0011). <dialog> is
   Core: showModal() brings top layer, focus trap, inert background, Esc,
   and focus return; closing is declarative (form method="dialog").
   Opening was the one gap. Invoker Commands (<button commandfor="id"
   command="show-modal">) close it natively and are Baseline Newly
   Available (web-features `invoker-commands`, 2025-12-12; T-140), so the
   recommended markup needs no JS at all and this module DETECTS AND
   YIELDS (docs/08, doc 03 @supports rule 4): a button carrying
   `commandfor` is never touched when the engine implements the feature.
   Detection: `commandForElement` is the IDL attribute that reflects
   `commandfor` on HTMLButtonElement, so its presence on the prototype means
   the engine acts on the attribute itself
   (https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/commandForElement).
   What stays is the legacy [data-dialog-open] path (older markup, and
   engines without invokers): one delegated listener at the root, so
   invokers inserted after load work with no re-scan and no observer.
   data-dialog-modal="false" on the invoker opens non-modally (show()).
   This module is deleted when invokers reach Widely Available (ADR-0012). */

const BOUND = Symbol();
const NATIVE = 'commandForElement' in HTMLButtonElement.prototype;

/** Bind the delegated opener on root, once. */
export default function upgrade(root = document) {
  if (root[BOUND]) return;
  root[BOUND] = true;

  root.addEventListener('click', (e) => {
    const invoker = e.target.closest?.('[data-dialog-open]');
    // Yield: the engine already handles any commandfor button itself.
    if (!invoker || (NATIVE && invoker.hasAttribute('commandfor'))) return;
    const dialog = document.getElementById(invoker.dataset.dialogOpen || '');
    // Skip anything already open: showModal() on an open dialog throws,
    // and a server-rendered in-flow panel (`open` attribute) must not be
    // re-modal-ised out from under the user.
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    if (invoker.dataset.dialogModal === 'false') dialog.show();
    else dialog.showModal();
  });
}

upgrade();
