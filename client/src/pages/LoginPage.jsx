// client/src/pages/LoginPage.jsx
// P-02: Public login page — email + password → POST /api/auth/login → redirect /dashboard

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Updates a single field in formData without touching the others
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(''); // clear error as user starts retyping
  };

  // Submits credentials, stores JWT + user, navigates to dashboard
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(formData.email, formData.password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── LEFT PANEL — decorative ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
          Study Abroad Buddy
        </span>

        {/* Centre quote */}
        <div>
          <p className="text-4xl font-extrabold text-white leading-snug mb-4">
            "Every great adventure<br />starts with a single form."
          </p>
          <p className="text-slate-500 text-sm">— Probably a student, somewhere</p>

          {/* Destination chips */}
          <div className="flex flex-wrap gap-2 mt-10">
            {['🇩🇪 Germany', '🇫🇷 France', '🇯🇵 Japan', '🇨🇦 Canada', '🇦🇺 Australia', '🇳🇱 Netherlands', '🇪🇸 Spain', '🇸🇬 Singapore'].map((d) => (
              <span
                key={d}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-slate-600 text-xs">
          AI-personalised guides for every destination
        </p>
      </div>

      {/* ── RIGHT PANEL — form ──────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
            Study Abroad Buddy
          </span>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <h1 className="text-3xl font-extrabold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Register free
            </Link>
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-amber-400/20"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>

          </form>

          {/* Back to landing */}
          <p className="text-center mt-6 text-slate-600 text-xs">
            <Link to="/" className="hover:text-slate-400 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;