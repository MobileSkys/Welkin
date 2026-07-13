/* wel-dialog — declarative opening for `.dialog` via [data-dialog-open]
   (docs/components/dialog.md, T-65; delivery per ADR-0011). <dialog> is
   Core: showModal() brings top layer, focus trap, inert background, Esc,
   and focus return; closing is declarative (form method="dialog").
   Opening is the one gap — Invoker Commands (command/commandfor) will
   close it, but are pre-Baseline (ADR-0012), so this module is deleted
   when they graduate. It is the spec's documented inline 3-liner plus
   late-added-DOM handling: one delegated listener at the root, so
   invokers inserted after load work with no re-scan and no observer.
   data-dialog-modal="false" on the invoker opens non-modally (show()). */

const BOUND = Symbol();

/** Bind the delegated opener on root, once. */
export default function upgrade(root = document) {
  if (root[BOUND]) return;
  root[BOUND] = true;

  root.addEventListener('click', (e) => {
    const invoker = e.target.closest?.('[data-dialog-open]');
    if (!invoker) return;
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
