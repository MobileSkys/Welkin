/* wel-toast-region — queued live-region toast manager
   (docs/components/toast.md, T-49; delivery per ADR-0011). The API is
   the DOM: appending a <wel-toast> child raises a toast; push() is a
   convenience that builds exactly that child. Adoption (observer, so
   fragment swaps and server flashes are first-class) sets the
   politeness role per tone — alert for warning/danger, else status —
   BEFORE the toast turns visible so appearing announces it, and adds
   the dismiss button. FIFO queue past `max`; timers (duration attr,
   default 6000, 0 = persistent, danger forced persistent — WCAG
   2.2.1) pause on hover and focus-within. Exit waits the
   [data-closing] CSS fade, then the stack reflows via a view
   transition, skipped under reduced motion. Focus is never stolen. */

let seq = 0;

class WelToastRegion extends HTMLElement {
  connectedCallback() {
    if (this._on) return;
    this._on = true;
    this.setAttribute('role', 'region'); // aria-label is the host's job
    for (const t of this.querySelectorAll('wel-toast')) this._adopt(t);
    new MutationObserver((ms) => {
      for (const m of ms) {
        for (const t of m.addedNodes) if (t.tagName === 'WEL-TOAST') this._adopt(t);
        for (const t of m.removedNodes) {
          if (t.tagName === 'WEL-TOAST' && !('closing' in t.dataset)) {
            clearTimeout(t._id);
            this._emit('wel-toast-dismiss', { toast: t, reason: 'api' });
            this._flow();
          }
        }
      }
    }).observe(this, { childList: true });

    this.addEventListener('pointerenter', () => { this._h = 1; this._pause(); });
    this.addEventListener('focusin', () => { this._f = 1; this._pause(); });
    this.addEventListener('pointerleave', () => { this._h = 0; this._resume(); });
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget)) { this._f = 0; this._resume(); }
    });
  }

  /** Convenience mirror of `append(<wel-toast>)` (ADR-0011). */
  push(message, o = {}) {
    const t = document.createElement('wel-toast');
    if (o.tone) t.dataset.tone = o.tone;
    if (o.duration != null) t.setAttribute('duration', o.duration);
    t.textContent = message;
    this.append(t);
    return t;
  }

  _adopt(t) {
    if (t._ok) return;
    t._ok = 1;
    const tone = t.dataset.tone;
    t.setAttribute('role', tone === 'warning' || tone === 'danger' ? 'alert' : 'status');
    if (t.getAttribute('dismissible') !== 'false') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'button';
      b.dataset.variant = 'ghost';
      b.dataset.size = 'sm';
      b.setAttribute('aria-label', this.getAttribute('dismiss-label') || 'Dismiss');
      b.textContent = '✕';
      b.addEventListener('click', () => this._dismiss(t, 'dismiss'));
      t.append(b);
    }
    t.hidden = true; // queued; _flow unhides in FIFO order
    t.style.viewTransitionName = `wel-t${++seq}`;
    t.style.viewTransitionClass = 'wel-toast';
    this._flow();
  }

  _flow() {
    let n = +this.getAttribute('max') || 3;
    for (const t of this.children) {
      if (t.tagName !== 'WEL-TOAST' || 'closing' in t.dataset) continue;
      if (!t.hidden) n--;
      else if (n > 0) {
        n--;
        t.hidden = false; // turning visible announces the live region
        t._rem = t.dataset.tone === 'danger' ? 0 // errors never evaporate
          : +(t.getAttribute('duration') ?? this.getAttribute('duration') ?? 6000);
        if (t._rem && !this._h && !this._f) this._run(t);
        this._emit('wel-toast-show', { toast: t });
      }
    }
  }

  _run(t) {
    t._at = Date.now();
    t._id = setTimeout(() => this._dismiss(t, 'timeout'), t._rem);
  }

  _pause() {
    for (const t of this.children) {
      if (t._id) { clearTimeout(t._id); t._id = 0; t._rem -= Date.now() - t._at; }
    }
  }

  _resume() {
    if (this._h || this._f) return;
    for (const t of this.children) {
      if (!t.hidden && !('closing' in t.dataset) && t._rem > 0 && !t._id) this._run(t);
    }
  }

  _dismiss(t, reason) {
    if ('closing' in t.dataset) return;
    clearTimeout(t._id);
    const hadFocus = t.contains(document.activeElement);
    t.dataset.closing = ''; // CSS fades; wait its duration, then remove
    setTimeout(() => {
      const go = () => { t.remove(); this._flow(); };
      if (document.startViewTransition
          && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // ready rejects (AbortError) when a rapid follow-up dismissal
        // skips this transition — expected, swallow it
        document.startViewTransition(go).ready.catch(() => {});
      } else go();
      this._emit('wel-toast-dismiss', { toast: t, reason });
      if (hadFocus) {
        this.querySelector('wel-toast:not([hidden], [data-closing]) button')?.focus();
      }
    }, (parseFloat(getComputedStyle(t).transitionDuration) || 0) * 1000);
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  }
}

customElements.define('wel-toast-region', WelToastRegion);
