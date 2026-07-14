/* wel-tabs — APG tabs custom element (docs/components/tabs.md, T-47;
   delivery per ADR-0011). The authored light DOM is heading+section
   pairs — a complete document fragment that IS the no-JS baseline.
   Upgrade generates everything hand-authoring gets wrong: the
   role=tablist strip, role=tab/aria-selected/aria-controls on the
   headings, role=tabpanel/aria-labelledby/tabindex on the sections,
   roving tabindex, arrow-key navigation with wrap, Home/End.
   activation=auto (default) selects on arrow focus per APG — our
   panels render instantly; manual moves focus only, Enter/Space
   selects. selected-index is reflected on change and settable at any
   time; wel-tab-change bubbles after each change (not cancelable —
   the attribute is the source of truth). Enhanced: the indicator
   morphs between tabs via a view transition, named only on the
   changing group for only the transition's duration (--wel-tabs-vt),
   so parallel tab groups never collide; skipped under reduced motion
   (the CSS group duration also rides --wel-motion). */

let seq = 0;

class WelTabs extends HTMLElement {
  static observedAttributes = ['selected-index'];

  connectedCallback() {
    if (this._tabs) return;
    const tabs = [];
    const panels = [];
    for (const h of [...this.children]) {
      if (/^H[2-4]$/.test(h.tagName) && h.nextElementSibling?.matches('section')) {
        tabs.push(h);
        panels.push(h.nextElementSibling);
      }
    }
    if (!tabs.length) return;
    this._tabs = tabs;
    this._panels = panels;

    const n = ++seq;
    const list = document.createElement('div');
    list.setAttribute('role', 'tablist');
    const label = this.getAttribute('aria-label');
    if (label) list.setAttribute('aria-label', label);

    tabs.forEach((tab, i) => {
      const panel = panels[i];
      tab.id ||= `wel-tab-${n}-${i}`;
      panel.id ||= `wel-panel-${n}-${i}`;
      tab.setAttribute('role', 'tab'); // a tab is not a heading post-upgrade
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0; // reachable even when its first content isn't focusable
      list.append(tab);
      tab.addEventListener('click', () => this._select(i));
      tab.addEventListener('keydown', (e) => this._key(e, i));
    });
    this.prepend(list);
    this._apply(this._clamp(this.getAttribute('selected-index'))); // no event on setup
  }

  _clamp(v) {
    return Math.max(0, Math.min(+v || 0, this._tabs.length - 1));
  }

  _key(e, i) {
    const n = this._tabs.length;
    const j = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }[e.key];
    if (j !== undefined) {
      e.preventDefault();
      this._tabs[j].focus();
      if (this.getAttribute('activation') !== 'manual') this._select(j);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._select(i); // no-op redundancy in auto mode
    }
  }

  _apply(j) {
    this._i = j;
    this._tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === j);
      tab.tabIndex = i === j ? 0 : -1;
      this._panels[i].hidden = i !== j;
    });
    this.setAttribute('selected-index', j);
  }

  _select(j) {
    j = this._clamp(j);
    const prev = this._i;
    if (j === prev) return;
    const commit = () => {
      this._apply(j);
      this.dispatchEvent(new CustomEvent('wel-tab-change', {
        bubbles: true,
        detail: { index: j, previousIndex: prev, tab: this._tabs[j], panel: this._panels[j] },
      }));
    };
    if (document.startViewTransition
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.style.setProperty('--wel-tabs-vt', 'wel-tab-indicator');
      const clean = () => this.style.removeProperty('--wel-tabs-vt');
      // then(clean, clean), not finally: a rapid re-selection skips the
      // transition and finally() would re-throw that as an unhandled
      // rejection; ready rejects on skip too. Commit runs either way.
      const vt = document.startViewTransition(commit);
      vt.ready.catch(() => {});
      vt.finished.then(clean, clean);
    } else commit();
  }

  attributeChangedCallback(_, old, val) {
    if (!this._tabs || val === old) return;
    const j = this._clamp(val);
    // Re-reflect an out-of-range value so the attribute stays truthful.
    if (j === this._i) { if (String(j) !== val) this.setAttribute('selected-index', j); }
    else this._select(j);
  }

  get selectedIndex() { return this._i; } // convenience mirror, never the only path
  set selectedIndex(j) { this._select(j); }
}

customElements.define('wel-tabs', WelTabs);
