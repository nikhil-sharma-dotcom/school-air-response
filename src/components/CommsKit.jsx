// PATH: src/components/CommsKit.jsx
import { useEffect, useRef, useState } from 'react';
import { TEMPLATES } from '../rules/templates.js';
import { TIER_COLORS, TIER_LABELS } from './constants.js';

const LANGS = [
  { id: 'en', label: 'EN' },
  { id: 'hi', label: 'हिन्दी' },
];

function renderMessage(tier, lang, schoolName) {
  const fn = TEMPLATES[tier]?.[lang] ?? TEMPLATES.green.en;
  try {
    return fn(schoolName ?? '');
  } catch {
    return TEMPLATES.green.en(schoolName ?? '');
  }
}

export default function CommsKit({ tier, schoolName, lang, onLangChange }) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const textRef = useRef(null);

  const message = renderMessage(tier, lang, schoolName);
  const color = TIER_COLORS[tier] ?? TIER_COLORS.green;

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  function fallbackCopy() {
    const el = textRef.current;
    if (!el) return;
    el.focus();
    el.select();
    try {
      if (document.execCommand('copy')) setCopied(true);
    } catch {
      // Text stays selected so the user can press Ctrl/Cmd+C.
    }
  }

  function handleCopy() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => setCopied(true), fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-200">Message to families</h2>
        <div className="flex overflow-hidden rounded-lg border border-slate-700" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lang === l.id}
              onClick={() => onLangChange(l.id)}
              className={`px-3 py-1 text-sm transition ${
                lang === l.id ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span
          className="rounded px-1.5 py-0.5 font-bold tracking-wide text-slate-950"
          style={{ backgroundColor: color }}
        >
          {TIER_LABELS[tier] ?? 'GREEN'}
        </span>
        template
      </div>

      <textarea
        ref={textRef}
        readOnly
        lang={lang}
        value={message}
        rows={5}
        className="mt-2 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm leading-relaxed text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-600"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-white"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={() => setToast(true)}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          Send to parents
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 shadow-xl"
        >
          Demo only — message not sent (SMS integration out of scope)
        </div>
      )}
    </section>
  );
}
