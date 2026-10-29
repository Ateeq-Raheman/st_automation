import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, CornerDownLeft, Zap, Type } from 'lucide-react';
import { buildNavSections } from './Sidebar';

export const OPEN_PALETTE_EVENT = 'st:open-command-palette';

// Elements on the current page that can be jumped to.
const PAGE_SELECTOR = 'main h1, main h2, main h3, main h4, main label, main th, main button, main [data-search]';

function scanPage() {
  const seen = new Set();
  const found = [];
  document.querySelectorAll(PAGE_SELECTOR).forEach((el) => {
    if (!el.offsetParent) return; // hidden
    const text = (el.getAttribute('data-search') || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 2 || text.length > 80 || seen.has(text.toLowerCase())) return;
    seen.add(text.toLowerCase());
    found.push({ text, el, tag: el.tagName.toLowerCase() });
  });
  return found;
}

function flash(el) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ring-4', 'ring-brand-red/50', 'rounded-lg', 'transition-shadow');
  setTimeout(() => el.classList.remove('ring-4', 'ring-brand-red/50'), 1800);
}

/**
 * Global search (Ctrl/Cmd+K), like Frappe's awesome bar: jump to any
 * section of the app, run a quick action, or find any heading / field label /
 * table column / button on the page you are currently viewing and scroll to it.
 */
export function CommandPalette({ userProfile, onNavigate, actions = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [pageItems, setPageItems] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setPageItems(scanPage());
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const navItems = useMemo(
    () => buildNavSections(userProfile)
      .filter((s) => s.visible)
      .flatMap((s) => s.items.filter((i) => i.visible).map((i) => ({ ...i, section: s.title }))),
    [userProfile]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (t) => !q || t.toLowerCase().includes(q);
    const out = [];
    navItems.filter((i) => match(`${i.label} ${i.section}`)).forEach((i) => out.push({
      group: 'Go to', label: i.label, hint: i.section, icon: i.icon,
      run: () => onNavigate(i.id),
    }));
    actions.filter((a) => match(a.label)).forEach((a) => out.push({
      group: 'Actions', label: a.label, icon: Zap, run: a.run,
    }));
    // Page content is only offered once something is typed, to keep the empty state tidy.
    if (q) {
      pageItems.filter((p) => match(p.text)).slice(0, 15).forEach((p) => out.push({
        group: 'On this page', label: p.text, hint: p.tag === 'button' ? 'button' : p.tag === 'label' ? 'field' : p.tag === 'th' ? 'column' : 'heading',
        icon: Type, run: () => setTimeout(() => flash(p.el), 50),
      }));
    }
    return out;
  }, [query, navItems, actions, pageItems, onNavigate]);

  useEffect(() => { setIndex(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const choose = (item) => {
    if (!item) return;
    setOpen(false);
    item.run();
  };

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[index]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  if (!open) return null;

  let lastGroup = null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-700">
          <Search className="h-4 w-4 text-brand-grey shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search pages, actions, or anything on this page…"
            className="flex-1 bg-transparent py-4 text-sm text-brand-black dark:text-slate-50 focus:outline-none"
          />
          <kbd className="text-[11px] font-bold text-brand-grey border border-gray-300 dark:border-slate-600 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-grey">No results for “{query}”.</p>
          ) : results.map((r, i) => {
            const showGroup = r.group !== lastGroup;
            lastGroup = r.group;
            const Icon = r.icon;
            return (
              <React.Fragment key={`${r.group}-${r.label}-${i}`}>
                {showGroup && <div className="px-4 pt-2 pb-1 text-[12px] font-bold uppercase tracking-wider text-brand-grey">{r.group}</div>}
                <button
                  type="button"
                  data-active={i === index}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => choose(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${i === index ? 'bg-brand-red text-white' : 'text-brand-black dark:text-slate-100'}`}
                >
                  {Icon && <Icon className={`h-4 w-4 shrink-0 ${i === index ? 'text-white' : 'text-brand-grey'}`} />}
                  <span className="flex-1 truncate font-semibold">{r.label}</span>
                  {r.hint && <span className={`text-[12px] truncate ${i === index ? 'text-white/80' : 'text-brand-grey'}`}>{r.hint}</span>}
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
