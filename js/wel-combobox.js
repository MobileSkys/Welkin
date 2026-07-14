/* wel-combobox — APG editable combobox with list autocomplete
   (docs/components/combobox.md, T-48; delivery per ADR-0011). The
   authored light DOM is a native <input list> + <datalist> — that pair
   IS the no-JS baseline. Upgrade removes the `list` attribute (one
   suggestion UI, not two) and mirrors the datalist into a stylable
   listbox: substring filtering (filter="none" to disable), arrow-key
   navigation via aria-activedescendant — DOM focus never leaves the
   input — Enter to commit, Esc to close, focusout closes without
   committing. The datalist stays the option source and is re-read on
   every open, so options may be swapped at any time with no API.
   Committing fires native input+change on the input; there are no
   custom events — attribute state (aria-expanded, aria-selected) is
   the styleable surface. */

let seq = 0;

class WelCombobox extends HTMLElement {
  connectedCallback() {
    if (this._input) return;
    const input = this.querySelector('input[list]');
    const data = input && document.getElementById(input.getAttribute('list'));
    if (!data) return;
    this._input = input;
    this._data = data;

    const n = ++seq;
    input.removeAttribute('list');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.autocomplete = 'off';

    const list = this._list = document.createElement('ul');
    list.setAttribute('role', 'listbox');
    list.id = `wel-cb-${n}`;
    list.hidden = true;
    const label = input.id
      && document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (label) {
      label.id ||= `wel-cb-${n}-label`;
      list.setAttribute('aria-labelledby', label.id);
    }
    input.setAttribute('aria-controls', list.id);
    this.append(list);

    input.addEventListener('input', () => { if (!this._mute) this._open(); });
    input.addEventListener('click', () => { if (list.hidden) this._open(); });
    input.addEventListener('keydown', (e) => this._key(e));
    // pointerdown, not click: commit before focusout closes the list.
    list.addEventListener('pointerdown', (e) => {
      const o = e.target.closest('[role="option"]');
      if (o) { e.preventDefault(); this._commit(o); }
    });
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget)) this._close();
    });
  }

  _open() {
    const q = this.getAttribute('filter') === 'none'
      ? '' : this._input.value.trim().toLowerCase();
    const list = this._list;
    list.textContent = '';
    for (const opt of this._data.options) {
      const v = opt.value;
      if (q && !v.toLowerCase().includes(q)) continue;
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = `${list.id}-${list.children.length}`;
      li.textContent = v;
      list.append(li);
    }
    const some = list.children.length > 0;
    list.hidden = !some;
    this._input.setAttribute('aria-expanded', some);
    this._active(-1);
  }

  _active(i) {
    this._i = i;
    const opts = this._list.children;
    for (let k = 0; k < opts.length; k++) opts[k].setAttribute('aria-selected', k === i);
    const o = opts[i];
    if (o) {
      this._input.setAttribute('aria-activedescendant', o.id);
      o.scrollIntoView({ block: 'nearest' });
    } else this._input.removeAttribute('aria-activedescendant');
  }

  _key(e) {
    const open = !this._list.hidden;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { this._open(); if (e.altKey) return; }
      const n = this._list.children.length;
      if (n) this._active(((this._i ?? -1) + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Enter') {
      const o = open && this._list.children[this._i];
      if (o) { e.preventDefault(); this._commit(o); }
    } else if (e.key === 'Escape' && open) {
      // handled here → don't also close a containing dialog/popover
      e.preventDefault();
      this._close();
    }
  }

  _commit(o) {
    const input = this._input;
    input.value = o.textContent;
    this._close();
    input.focus();
    this._mute = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    this._mute = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _close() {
    this._list.hidden = true;
    this._input.setAttribute('aria-expanded', 'false');
    this._active(-1);
  }
}

customElements.define('wel-combobox', WelCombobox);
