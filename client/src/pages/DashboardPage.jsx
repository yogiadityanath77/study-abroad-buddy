// client/src/pages/DashboardPage.jsx
// P-05: Protected dashboard — welcome card, checklist progress, 4 module nav cards, AI chat button

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfile, getChecklist, updateChecklist } from '../api/user';
import { useAuth } from '../context/AuthContext';

// ── Formats a JS Date or ISO string to "12 Jan 2025" ──
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ── Days until a future date, returns null if date has passed ──
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checklist state — fetched separately so the dashboard renders immediately
  // while the agent generates the list on first load (can take a few seconds).
  const [checklistItems, setChecklistItems] = useState([]);
  const [ticked, setTicked] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState('');

  // Loads full profile from DB on mount — AuthContext only holds minimal user data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        setError('Could not load your profile. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetches checklist in parallel with profile — separate loading state
  // so the rest of the dashboard is usable while the list loads.
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const data = await getChecklist();
        setChecklistItems(data.checklistItems || []);
        setTicked(data.checklist || []);
      } catch (err) {
        setChecklistError('Could not load checklist.');
      } finally {
        setChecklistLoading(false);
      }
    };
    fetchChecklist();
  }, []);

  // Optimistically toggles an item ticked/unticked and persists to DB.
  // Reverts to previous state if the server call fails.
  const handleToggle = async (item) => {
    const newTicked = ticked.includes(item)
      ? ticked.filter((i) => i !== item)
      : [...ticked, item];
    setTicked(newTicked);
    try {
      await updateChecklist(newTicked);
    } catch (err) {
      setTicked(ticked);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Drive progress bar from real data once checklist has loaded,
  // fall back to 0/0 while loading so the bar renders empty rather than full.
  const checkedCount = ticked.length;
  const totalItems = checklistItems.length;
  const progressPercent = totalItems > 0
    ? Math.min(Math.round((checkedCount / totalItems) * 100), 100)
    : 0;
  const countdown = daysUntil(profile?.travelStartDate);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
            Study Abroad Buddy
          </span>
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {profile?.name ?? user?.name}
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-400 text-sm transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ── WELCOME CARD ────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 relative">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">
                Welcome back
              </p>
              <h1 className="text-3xl font-extrabold text-white mb-2">
                Hey, {profile?.name?.split(' ')[0] ?? 'there'} 👋
              </h1>
              <p className="text-slate-400 text-sm">
                You're heading to{' '}
                <span className="text-white font-semibold">
                  {profile?.destinationCity && profile?.destinationCountry
                    ? `${profile.destinationCity}, ${profile.destinationCountry}`
                    : profile?.destinationCountry ?? '—'}
                </span>
              </p>
              <p className="text-slate-500 text-sm mt-0.5">
                Departure:{' '}
                <span className="text-slate-300">{formatDate(profile?.travelStartDate)}</span>
                {' · '}
                Return:{' '}
                <span className="text-slate-300">{formatDate(profile?.travelEndDate)}</span>
              </p>
              {profile?.university && (
                <p className="text-slate-500 text-sm mt-0.5">
                  🎓 <span className="text-slate-300">{profile.university}</span>
                </p>
              )}
            </div>

            {/* Countdown pill */}
            {countdown && (
              <div className="shrink-0 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-6 py-4 text-center">
                <p className="text-amber-400 text-3xl font-extrabold leading-none">{countdown}</p>
                <p className="text-amber-400/70 text-xs mt-1 uppercase tracking-wider">days to go</p>
              </div>
            )}
          </div>

          {/* ── Checklist progress bar (inside welcome card, unchanged position) ── */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-400 text-sm font-medium">Pre-departure checklist</p>
              <p className="text-slate-500 text-xs">
                {checklistLoading ? '…' : `${checkedCount} / ${totalItems} complete`}
              </p>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs mt-2">
              {checklistLoading
                ? 'Generating your personalised checklist…'
                : progressPercent === 100
                  ? "🎉 All done — you're ready to go!"
                  : `${progressPercent}% — keep going, you're getting there.`}
            </p>
          </div>
        </div>

        {/* ── CHECKLIST ITEMS ─────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-white font-semibold">Pre-departure checklist</p>
            {!checklistLoading && totalItems > 0 && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                checkedCount === totalItems
                  ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                  : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
              }`}>
                {checkedCount}/{totalItems}
              </span>
            )}
          </div>

          {/* Loading state — spinner + skeleton rows */}
          {checklistLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-amber-400/70 mb-4">
                <div className="w-4 h-4 border-2 border-amber-400/50 border-t-transparent rounded-full animate-spin" />
                Generating your personalised checklist…
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-11 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Error state */}
          {checklistError && !checklistLoading && (
            <p className="text-red-400 text-sm">{checklistError}</p>
          )}

          {/* Checklist items */}
          {!checklistLoading && !checklistError && checklistItems.length > 0 && (
            <ul className="space-y-2">
              {checklistItems.map((item) => {
                const isChecked = ticked.includes(item);
                return (
                  <li key={item}>
                    <button
                      onClick={() => handleToggle(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                        isChecked
                          ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-amber-400/30 hover:bg-amber-400/5'
                      }`}
                    >
                      {/* Circle checkbox */}
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-emerald-400 border-emerald-400'
                          : 'border-slate-600'
                      }`}>
                        {isChecked && (
                          <svg className="w-3 h-3 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm leading-snug ${isChecked ? 'line-through opacity-50' : ''}`}>
                        {item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── MODULE CARDS ────────────────────────────────── */}
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-4">
            Your guides
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModuleCard
              to="/visa"
              emoji="🛂"
              title="Visa guide"
              description="Requirements, documents, processing times"
              accent="hover:border-amber-400/40 hover:shadow-amber-400/5"
            />
            <ModuleCard
              to="/health"
              emoji="🏥"
              title="Health guide"
              description="Vaccines, insurance, emergency contacts"
              accent="hover:border-sky-400/40 hover:shadow-sky-400/5"
            />
            <ModuleCard
              to="/culture"
              emoji="🌍"
              title="Culture guide"
              description="Norms, transport, food, SIM cards"
              accent="hover:border-emerald-400/40 hover:shadow-emerald-400/5"
            />
            <ModuleCard
              to="/housing"
              emoji="🏠"
              title="Housing guide"
              description="Accommodation types, rent, platforms"
              accent="hover:border-rose-400/40 hover:shadow-rose-400/5"
            />
          </div>
        </div>

        {/* ── AI CHAT CTA ─────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold mb-0.5">Got a question?</p>
            <p className="text-slate-400 text-sm">
              Ask the AI assistant anything about your trip — visa, packing, budgets, housing.
            </p>
          </div>
          <Link
            to="/chat"
            className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20 whitespace-nowrap"
          >
            Open AI chat →
          </Link>
        </div>

      </main>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────

// Module nav card — links to a guide page
const ModuleCard = ({ to, emoji, title, description, accent }) => (
  <Link
    to={to}
    className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg ${accent} group`}
  >
    <span className="text-2xl">{emoji}</span>
    <div>
      <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
        {title}
      </p>
      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{description}</p>
    </div>
    <span className="text-slate-600 text-xs mt-auto group-hover:text-slate-400 transition-colors">
      View guide →
    </span>
  </Link>
);

// Full-screen loading state while profile fetches
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Loading your dashboard…</p>
    </div>
  </div>
);

export default DashboardPage;