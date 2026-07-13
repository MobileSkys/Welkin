/* table-sort — client-side sorting upgrader for `.table[data-sortable]`
   (docs/components/table.md, T-50; delivery per ADR-0011). Rung-3 JS by
   necessity: CSS cannot read or compare cell content, and visual-only
   reordering would desynchronise visual and AT order.

   Each `th[data-sort]` gets its content wrapped in a real <button>
   (keyboard + AT for free); a pre-existing server sort link is enhanced in
   place instead, so its URL stays the no-JS fallback. Activation cycles
   aria-sort ascending ⇄ descending (exactly one th carries it — ALL sort
   state lives in aria-sort; no injected classes). A cancelable `wel-sort`
   event fires before reordering: preventDefault() to sort server-side.
   Late-added tables upgrade via MutationObserver. No-JS baseline: a
   plain, complete, readable table. */

const UPGRADED = Symbol();

const value = (row, i) => {
  const cell = row.cells[i];
  return cell ? (cell.getAttribute('data-sort-value') ?? cell.textContent.trim()) : '';
};

const comparators = {
  number: (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0),
  date: (a, b) => (Date.parse(a) || 0) - (Date.parse(b) || 0),
  text: (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
};

function activate(table, th) {
  const direction = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
  const columnIndex = th.cellIndex;

  const proceed = table.dispatchEvent(new CustomEvent('wel-sort', {
    bubbles: true,
    cancelable: true,
    detail: { columnIndex, direction },
  }));

  for (const other of table.querySelectorAll('th[aria-sort]')) {
    if (other !== th) other.removeAttribute('aria-sort');
  }
  th.setAttribute('aria-sort', direction);

  if (!proceed) return; // the app sorts server-side instead

  const compare = comparators[th.getAttribute('data-sort')] || comparators.text;
  const sign = direction === 'ascending' ? 1 : -1;
  for (const tbody of table.tBodies) {
    [...tbody.rows]
      .sort((a, b) => sign * compare(value(a, columnIndex), value(b, columnIndex)))
      .forEach((row) => tbody.append(row));
  }
}

function upgradeTable(table) {
  if (table[UPGRADED]) return;
  table[UPGRADED] = true;

  for (const th of table.querySelectorAll('th[data-sort]')) {
    let control = th.querySelector('a[href]');
    if (!control) {
      control = document.createElement('button');
      control.type = 'button';
      control.append(...th.childNodes);
      th.append(control);
    }
    control.addEventListener('click', (e) => {
      e.preventDefault();
      activate(table, th);
    });
  }
}

/** Upgrade every `[data-sortable]` table under root, now and later. */
export default function upgrade(root = document) {
  for (const table of root.querySelectorAll('table[data-sortable]')) upgradeTable(table);

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('table[data-sortable]')) upgradeTable(node);
        for (const table of node.querySelectorAll?.('table[data-sortable]') ?? []) upgradeTable(table);
      }
    }
  }).observe(root === document ? document.documentElement : root, { childList: true, subtree: true });
}

upgrade();
