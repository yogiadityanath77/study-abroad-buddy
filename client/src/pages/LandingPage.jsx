// client/src/pages/LandingPage.jsx
// P-01: Public landing page — hero + 3 feature cards. Static, no API calls.

import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
          Study Abroad Buddy
        </span>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-28 flex flex-col items-center text-center">

        {/* Pill badge */}
        <span className="mb-6 inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          AI-powered study abroad assistant
        </span>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 max-w-3xl">
          Your move abroad,{' '}
          <span className="text-amber-400">without the stress.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-slate-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed">
          Personalised visa steps, health prep, culture tips, and housing
          advice — all in one place, all tuned to your destination.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/register"
            className="bg-amber-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
          >
            Create free account
          </Link>
          <Link
            to="/login"
            className="border border-slate-700 text-slate-300 font-semibold px-8 py-3.5 rounded-xl text-base hover:border-slate-500 hover:text-white transition-colors"
          >
            Log in
          </Link>
        </div>

        {/* Social proof line */}
        <p className="mt-8 text-slate-600 text-sm">
          Trusted by students heading to 40+ countries
        </p>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8">
        <div className="border-t border-slate-800" />
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 py-24">
        <p className="text-center text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">
          What's inside
        </p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-14 text-white">
          Everything you need before you land
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard
            emoji="🛂"
            title="Visa guide"
            description="Step-by-step visa requirements, required documents, processing times, and embassy links — auto-loaded for your home country and destination."
            accent="from-amber-400/10"
          />
          <FeatureCard
            emoji="🏥"
            title="Health prep"
            description="Recommended vaccines, food and water safety, travel insurance tips, and local emergency contacts based on where you're headed."
            accent="from-sky-400/10"
          />
          <FeatureCard
            emoji="🌍"
            title="Culture & housing"
            description="Local customs, transport, SIM cards, accommodation types, rent ranges, and the best platforms to find your new home abroad."
            accent="from-emerald-400/10"
          />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        © {new Date().getFullYear()} Study Abroad Buddy
      </footer>

    </div>
  );
};

// ── Sub-component: feature card ──────────────────────────────
const FeatureCard = ({ emoji, title, description, accent }) => (
  <div className={`bg-gradient-to-b ${accent} to-slate-900 border border-slate-800 rounded-2xl p-7 hover:border-slate-600 transition-colors`}>
    <div className="text-3xl mb-4">{emoji}</div>
    <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;