// client/src/pages/RegisterPage.jsx
// P-03: Public register page — name + email + password + confirm → POST /api/auth/register → redirect /onboarding

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Updates a single field and clears that field's inline error
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  // Client-side validation — returns an errors object, empty if all valid
  const validate = () => {
  const newErrors = {};
  if (!formData.name.trim()) newErrors.name = 'Name is required';
  if (formData.name.trim().length > 0 && formData.name.trim().length < 2) {
    newErrors.name = 'Name must be at least 2 characters';
  }
  if (!formData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Please enter a valid email address';
  }
  if (!formData.password) newErrors.password = 'Password is required';
  if (formData.password && formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }
  if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
  if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
  }
  return newErrors;
};

  // Validates, calls registerUser(), stores JWT + user, navigates to /onboarding
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(formData.name.trim(), formData.email.trim(), formData.password);
      login(data.token, data.user);
      navigate('/onboarding');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Checks password match live once confirmPassword has been touched
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── LEFT PANEL — decorative ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden">

        {/* Background glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
          Study Abroad Buddy
        </span>

        {/* Steps preview */}
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-6">
            What happens next
          </p>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Create your account', desc: 'Takes about 30 seconds.' },
              { step: '02', title: 'Tell us where you\'re going', desc: 'Home country, destination, university, dates.' },
              { step: '03', title: 'Get your personalised guides', desc: 'Visa steps, health prep, culture tips — all tailored to you.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 items-start">
                <span className="text-amber-400 font-extrabold text-sm mt-0.5 w-6 shrink-0">{step}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-slate-600 text-xs">Free forever for students.</p>
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
          <h1 className="text-3xl font-extrabold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-8">
            Already have one?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Log in
            </Link>
          </p>

          {/* Server error banner */}
          {serverError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name */}
            <FormField
              id="name"
              label="Full name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ada Lovelace"
              autoComplete="name"
              error={errors.name}
            />

            {/* Email */}
            <FormField
              id="email"
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              autoComplete="email"
              error={errors.email}
            />

            {/* Password */}
            <FormField
              id="password"
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              error={errors.password}
              hint="At least 6 characters"
            />

            {/* Confirm password */}
            <div>
              <FormField
                id="confirmPassword"
                label="Confirm password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
              {/* Live match indicator — only shown when confirmPassword has content and no error */}
              {passwordsMatch && !errors.confirmPassword && (
                <p className="mt-1.5 text-emerald-400 text-xs font-medium">✓ Passwords match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-amber-400/20"
            >
              {loading ? 'Creating account…' : 'Create account'}
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

// ── Sub-component: reusable labelled input with inline error ──
const FormField = ({ id, label, type, name, value, onChange, placeholder, autoComplete, error, hint }) => (
  <div>
    <label htmlFor={id} className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={`w-full bg-slate-900 border text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors ${
        error
          ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400'
          : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
      }`}
    />
    {error && <p className="mt-1.5 text-red-400 text-xs">{error}</p>}
    {hint && !error && <p className="mt-1.5 text-slate-600 text-xs">{hint}</p>}
  </div>
);

export default RegisterPage;