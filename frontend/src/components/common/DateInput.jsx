import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseValue(value) {
  if (!value) return null;
  const [datePart, timePart = ''] = String(value).split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh = '00', mm = '00'] = timePart.split(':');
  return { y, m: m - 1, d, hh: pad(Number(hh) || 0), mm: pad(Number(mm) || 0) };
}

function displayValue(parsed, withTime) {
  if (!parsed) return '';
  const base = `${pad(parsed.d)} ${MONTHS[parsed.m].slice(0, 3)} ${parsed.y}`;
  return withTime ? `${base}, ${parsed.hh}:${parsed.mm}` : base;
}

/**
 * ERPNext-style date picker: clicking the field opens a calendar popup
 * (month/year navigation, Today shortcut, optional time) instead of the
 * browser's native picker. Drop-in for `<input type="date|datetime-local">`:
 * `onChange` receives `{ target: { value } }` in the same string formats the
 * native inputs use (`YYYY-MM-DD` / `YYYY-MM-DDTHH:mm`).
 */
export function DateInput({
  value, onChange, type = 'date', min, max, required, disabled, placeholder, className = '', id,
}) {
  const withTime = type === 'datetime-local';
  const parsed = parseValue(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: parsed?.y ?? today.getFullYear(), m: parsed?.m ?? today.getMonth() });
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const emit = (v) => onChange?.({ target: { value: v } });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupH = popupRef.current?.offsetHeight || 340;
    const popupW = 288;
    const top = rect.bottom + popupH + 8 > window.innerHeight && rect.top > popupH + 8
      ? rect.top - popupH - 4
      : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupW - 8));
    setPos({ top, left });
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (popupRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Keep Escape from also closing a Modal underneath the popup.
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const openPopup = () => {
    if (disabled) return;
    const p = parseValue(value);
    setView({ y: p?.y ?? today.getFullYear(), m: p?.m ?? today.getMonth() });
    setOpen(true);
  };

  const shiftMonth = (delta) => {
    setView(({ y, m }) => {
      const n = m + delta;
      return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 };
    });
  };

  const isDisabledDay = (dateStr) => (min && dateStr < min.slice(0, 10)) || (max && dateStr > max.slice(0, 10));

  const pick = (dateStr) => {
    if (isDisabledDay(dateStr)) return;
    if (withTime) {
      emit(`${dateStr}T${parsed?.hh ?? '09'}:${parsed?.mm ?? '00'}`);
    } else {
      emit(dateStr);
      setOpen(false);
    }
  };

  const setTime = (hh, mm) => {
    const base = parsed ? toDateStr(parsed.y, parsed.m, parsed.d) : toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    emit(`${base}T${pad(hh)}:${pad(mm)}`);
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedStr = parsed ? toDateStr(parsed.y, parsed.m, parsed.d) : null;

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        onClick={openPopup}
        className={`flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
      >
        <span className={parsed ? '' : 'text-gray-400'}>
          {displayValue(parsed, withTime) || placeholder || (withTime ? 'Select date & time' : 'Select date')}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-brand-grey" />
      </button>
      {/* Hidden native input keeps HTML5 `required` validation working. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value || ''}
          onChange={() => {}}
          onFocus={openPopup}
          className="absolute h-0 w-0 opacity-0 pointer-events-none"
        />
      )}

      {open && createPortal(
        <div
          ref={popupRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 288 }}
          className="z-[60] rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl p-3 animate-fade-in"
        >
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-brand-grey">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-brand-black dark:text-slate-50">{MONTHS[view.m]}</span>
              <input
                type="number"
                value={view.y}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  if (y > 0 && y < 10000) setView((v) => ({ ...v, y }));
                }}
                className="w-16 bg-transparent text-sm font-bold text-brand-black dark:text-slate-50 focus:outline-none border-b border-transparent focus:border-brand-red [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button type="button" onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-brand-grey">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[12px] font-bold text-brand-grey mb-1">
            {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} />;
              const ds = toDateStr(view.y, view.m, day);
              const isSel = ds === selectedStr;
              const isToday = ds === todayStr;
              const off = isDisabledDay(ds);
              return (
                <button
                  key={ds}
                  type="button"
                  disabled={off}
                  onClick={() => pick(ds)}
                  className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                    isSel
                      ? 'bg-brand-red text-white'
                      : isToday
                      ? 'border border-brand-red text-brand-red hover:bg-red-50 dark:hover:bg-slate-700'
                      : 'text-brand-black dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700'
                  } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {withTime && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
              <span className="text-[13px] font-bold text-brand-grey">Time</span>
              <select
                value={parsed?.hh ?? '09'}
                onChange={(e) => setTime(e.target.value, parsed?.mm ?? '00')}
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm text-brand-black dark:text-slate-50"
              >
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={pad(h)}>{pad(h)}</option>)}
              </select>
              <span className="font-bold text-brand-grey">:</span>
              <select
                value={parsed?.mm ?? '00'}
                onChange={(e) => setTime(parsed?.hh ?? '09', e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm text-brand-black dark:text-slate-50"
              >
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={pad(i * 5)}>{pad(i * 5)}</option>)}
              </select>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto text-sm font-semibold text-brand-red hover:underline">
                Done
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                if (isDisabledDay(todayStr)) return;
                if (withTime) {
                  emit(`${todayStr}T${pad(today.getHours())}:${pad(Math.floor(today.getMinutes() / 5) * 5)}`);
                } else {
                  emit(todayStr);
                  setOpen(false);
                }
              }}
              className="text-sm font-semibold text-brand-red hover:underline"
            >
              Today
            </button>
            {!required && value && (
              <button
                type="button"
                onClick={() => { emit(''); setOpen(false); }}
                className="text-sm font-semibold text-brand-grey hover:text-brand-black dark:hover:text-slate-50 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
