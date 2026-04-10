// client/src/pages/CulturePage.jsx
// P-07: Protected culture guide — accordion sections, destination-specific

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGuide } from '../api/guide';

// ── Accordion item — open/close a single section ──
const AccordionItem = ({ emoji, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
      open ? 'border-slate-600 bg-slate-900' : 'border-slate-800 bg-slate-900'
    }`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        <span className={`text-slate-400 text-lg font-light transition-transform duration-300 ${
          open ? 'rotate-45' : 'rotate-0'
        }`}>
          +
        </span>
      </button>

      {/* Accordion body */}
      <div className={`transition-all duration-300 ease-in-out ${
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-6 pb-5 pt-1 border-t border-slate-800 text-slate-300 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const CulturePage = () => {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetches culture guide for the logged-in user's destination country
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const data = await getGuide('culture');
        setGuide(data);
      } catch (err) {
        setError('Could not load your culture guide. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            {'<- Dashboard'}
          </Link>
          <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
            Study Abroad Buddy
          </span>
          <Link
            to="/chat"
            className="text-slate-400 hover:text-amber-400 text-sm transition-colors"
          >
            {'AI chat ->'}
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">
            Culture guide
          </p>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            🌍 Local culture and life
          </h1>
          {guide && (
            <p className="text-slate-400 text-sm">
              Everything you need to know about living in{' '}
              <span className="text-slate-300 font-medium">
                {guide.destination.city !== 'Not set'
                  ? `${guide.destination.city}, ${guide.destination.country}`
                  : guide.destination.country}
              </span>
            </p>
          )}
        </div>

        {guide && (
          <>
            {/* ── ACCORDION SECTIONS ──────────────────────── */}
            <div className="space-y-3">

              <AccordionItem emoji="🤝" title="Social norms" defaultOpen={true}>
                <p>{guide.content.socialNorms}</p>
              </AccordionItem>

              <AccordionItem emoji="💰" title="Tipping culture">
                <p>{guide.content.tipping}</p>
              </AccordionItem>

              <AccordionItem emoji="🚌" title="Getting around">
                <p>{guide.content.transport}</p>
              </AccordionItem>

              <AccordionItem emoji="🍜" title="Food and drink">
                <p>{guide.content.food}</p>
              </AccordionItem>

              <AccordionItem emoji="📱" title="SIM cards and connectivity">
                <p>{guide.content.simCards}</p>
              </AccordionItem>

            </div>

            {/* ── PLACEHOLDER NOTICE ──────────────────────── */}
            {guide.content.notes && (
              <div className="bg-slate-900 border border-dashed border-slate-700/50 rounded-2xl px-6 py-4 flex items-start gap-3">
                <span className="text-amber-400 text-lg shrink-0">⚠️</span>
                <p className="text-slate-500 text-sm">{guide.content.notes}</p>
              </div>
            )}

            {/* ── ASK AI CTA ──────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold mb-0.5">
                  Questions about local life?
                </p>
                <p className="text-slate-400 text-sm">
                  Ask the culture AI agent — it knows your destination inside out.
                </p>
              </div>
              <Link
                to="/chat"
                className="shrink-0 border border-slate-700 hover:border-emerald-400/40 text-slate-300 hover:text-emerald-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
              >
                {'Ask AI agent ->'}
              </Link>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

// Full-screen loading state
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Loading your culture guide…</p>
    </div>
  </div>
);

export default CulturePage;