// client/src/pages/HealthPage.jsx
// P-08: Protected health guide — vaccines checklist, food/water safety, insurance tips, emergency contacts

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGuide } from '../api/guide';

const HealthPage = () => {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedVaccines, setCheckedVaccines] = useState([]);

  // Fetches health guide for the logged-in user's destination + travel start date
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const data = await getGuide('health');
        setGuide(data);
      } catch (err) {
        setError('Could not load your health guide. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, []);

  // Toggles a vaccine item in the local checked list
  const toggleVaccine = (vaccine) => {
    setCheckedVaccines((prev) =>
      prev.includes(vaccine) ? prev.filter((v) => v !== vaccine) : [...prev, vaccine]
    );
  };

  const checkedCount = checkedVaccines.length;
  const totalVaccines = guide?.content?.vaccines?.length ?? 0;
  const allChecked = totalVaccines > 0 && checkedCount === totalVaccines;

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
            Health guide
          </p>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            🏥 Health and safety
          </h1>
          {guide && (
            <p className="text-slate-400 text-sm">
              Personalised health prep for{' '}
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
            {/* ── VACCINES CHECKLIST ──────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-white font-bold text-lg">Recommended vaccines</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tick each one off as you get them
                  </p>
                </div>
                {/* Progress pill */}
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                  allChecked
                    ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {checkedCount} / {totalVaccines}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: totalVaccines > 0 ? `${(checkedCount / totalVaccines) * 100}%` : '0%' }}
                />
              </div>

              {/* Vaccine items */}
              <ul className="space-y-2">
                {guide.content.vaccines.map((vaccine) => {
                  const checked = checkedVaccines.includes(vaccine);
                  return (
                    <li key={vaccine}>
                      <button
                        onClick={() => toggleVaccine(vaccine)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                          checked
                            ? 'bg-emerald-400/5 border-emerald-400/20 text-slate-400 line-through'
                            : 'bg-slate-800/50 border-slate-700 text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        {/* Checkbox circle */}
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                          checked
                            ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                            : 'border-slate-600'
                        }`}>
                          {checked && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm">{vaccine}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {allChecked && (
                <div className="mt-4 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm px-4 py-3 rounded-xl text-center font-medium">
                  ✓ All vaccines sorted — great work!
                </div>
              )}

              {/* Doctor disclaimer — always shown, per health agent spec */}
              <div className="mt-4 bg-sky-400/5 border border-sky-400/20 rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="text-sky-400 shrink-0 text-sm">💉</span>
                <p className="text-sky-300/80 text-xs leading-relaxed">
                  Consult a doctor before travelling. Vaccine requirements may vary based
                  on your personal health history and recent travel.
                </p>
              </div>
            </div>

            {/* ── INFO CARDS ROW ───────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Food and water safety */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🍽️</span>
                  <h2 className="text-white font-bold text-sm">Food {'&'} water safety</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {guide.content.foodWaterSafety}
                </p>
              </div>

              {/* Insurance tips */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🛡️</span>
                  <h2 className="text-white font-bold text-sm">Travel insurance</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {guide.content.insuranceTips}
                </p>
              </div>

            </div>

            {/* ── EMERGENCY CONTACTS ──────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">🚨</span>
                <h2 className="text-white font-bold">Emergency contacts</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(guide.content.emergencyContacts).map(([service, number]) => (
                  <div
                    key={service}
                    className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-center"
                  >
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1 capitalize">
                      {service}
                    </p>
                    <p className="text-white font-extrabold text-xl tracking-wide">
                      {number}
                    </p>
                  </div>
                ))}
              </div>
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
                  Health questions about your trip?
                </p>
                <p className="text-slate-400 text-sm">
                  Ask the health AI agent — it knows your destination and travel dates.
                </p>
              </div>
              <Link
                to="/chat"
                className="shrink-0 border border-slate-700 hover:border-sky-400/40 text-slate-300 hover:text-sky-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
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
      <p className="text-slate-500 text-sm">Loading your health guide…</p>
    </div>
  </div>
);

export default HealthPage;