// client/src/pages/HousingPage.jsx
// P-09: Protected housing guide — accommodation types, rent ranges, search platforms, lease tips

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGuide } from '../api/guide';
import LoadingSpinner from '../components/LoadingSpinner';

// Extracts a readable hostname from a full URL for display
const getHostname = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const HousingPage = () => {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetches housing guide for the logged-in user's destination city + country
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const data = await getGuide('housing');
        setGuide(data);
      } catch (err) {
        setError('Could not load your housing guide. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your housing guide…" />;

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
            Housing guide
          </p>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            🏠 Finding your home abroad
          </h1>
          {guide && (
            <p className="text-slate-400 text-sm">
              Accommodation options and advice for{' '}
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
            {/* ── RENT RANGE BANNER ───────────────────────── */}
            <div className="bg-rose-400/5 border border-rose-400/20 rounded-2xl px-6 py-5 flex items-center gap-4">
              <span className="text-3xl shrink-0">💸</span>
              <div>
                <p className="text-rose-300/70 text-xs uppercase tracking-widest font-semibold mb-0.5">
                  Typical rent range
                </p>
                <p className="text-white font-extrabold text-xl">
                  {guide.content.rentRanges}
                </p>
              </div>
            </div>

            {/* ── ACCOMMODATION TYPES ─────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">🏢</span>
                <h2 className="text-white font-bold">Accommodation types</h2>
              </div>
              <div className="space-y-3">
                {guide.content.accommodationTypes.map((type, index) => (
                  <AccommodationRow key={index} index={index} type={type} />
                ))}
              </div>
            </div>

            {/* ── SEARCH PLATFORMS ────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔍</span>
                <h2 className="text-white font-bold">Where to search</h2>
              </div>
              <p className="text-slate-500 text-xs mb-5">
                Recommended platforms for finding student accommodation
              </p>
              <div className="space-y-2">
                {guide.content.searchPlatforms.map((url, index) => (
                  <PlatformLink key={index} url={url} />
                ))}
              </div>
            </div>

            {/* ── LEASE TIPS ──────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📝</span>
                <h2 className="text-white font-bold">Lease tips</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {guide.content.leaseTips}
              </p>
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
                  Need more specific housing advice?
                </p>
                <p className="text-slate-400 text-sm">
                  Ask the housing AI agent — it knows your city, country, and trip duration.
                </p>
              </div>
              <Link
                to="/chat"
                className="shrink-0 border border-slate-700 hover:border-rose-400/40 text-slate-300 hover:text-rose-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
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

// ── Sub-components ────────────────────────────────────────────

// Single numbered accommodation type row
const AccommodationRow = ({ index, type }) => (
  <div className="flex items-start gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
    <span className="text-rose-400 font-extrabold text-sm mt-0.5 shrink-0 w-5">
      {String(index + 1).padStart(2, '0')}
    </span>
    <p className="text-slate-200 text-sm leading-relaxed">{type}</p>
  </div>
);

// Single platform link row
const PlatformLink = ({ url }) => {
  const hostname = getHostname(url);
  const initial = hostname.charAt(0).toUpperCase();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-rose-400/40 hover:bg-rose-400/5 transition-all duration-150 group"
    >
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
          {initial}
        </span>
        <span className="text-slate-200 text-sm font-medium group-hover:text-white transition-colors">
          {hostname}
        </span>
      </div>
      <span className="text-slate-600 text-xs group-hover:text-rose-400 transition-colors">
        {'Visit ->'}
      </span>
    </a>
  );
};

export default HousingPage;
