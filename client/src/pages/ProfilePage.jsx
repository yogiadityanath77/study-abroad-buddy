// client/src/pages/ProfilePage.jsx
// P-11: Protected profile + settings — edit destination/dates, change password

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

// ── Destination countries — only the 8 covered by our RAG data ──
const DESTINATION_COUNTRIES = [
  'Australia',
  'Canada',
  'France',
  'Germany',
  'Ireland',
  'Netherlands',
  'United Kingdom',
  'United States',
];

// ── Cities keyed by destination country only ──
const CITIES_BY_COUNTRY = {
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Strasbourg'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Heidelberg'],
  Ireland: ['Dublin', 'Cork', 'Galway', 'Limerick'],
  Netherlands: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Delft'],
  'United Kingdom': ['London', 'Edinburgh', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Glasgow'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Boston', 'San Francisco', 'Seattle', 'Austin'],
};

// ── Month names for the date dropdowns ──
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Converts an ISO date string to yyyy-MM-dd so the ThreePartDateField
// can parse it back into day/month/year parts on load.
const toDateValue = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const ProfilePage = () => {
  const { user, login } = useAuth();

  // ── Profile form state ──
  const [profile, setProfile] = useState({
    homeCountry: '',
    destinationCountry: '',
    destinationCity: '',
    university: '',
    travelStartDate: '',
    travelEndDate: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState('');

  // ── Password form state ──
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordToast, setPasswordToast] = useState('');
  const [passwordToastMsg, setPasswordToastMsg] = useState('');

  // Loads full profile from DB on mount and pre-fills the form.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile({
          homeCountry: data.homeCountry || '',
          destinationCountry: data.destinationCountry || '',
          destinationCity: data.destinationCity || '',
          university: data.university || '',
          // Convert ISO strings to yyyy-MM-dd so ThreePartDateField can parse them.
          travelStartDate: toDateValue(data.travelStartDate),
          travelEndDate: toDateValue(data.travelEndDate),
        });
      } catch (err) {
        setProfileToast('error');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Shows a toast for 3 seconds then clears it.
  const showToast = (setter, value) => {
    setter(value);
    setTimeout(() => setter(''), 3000);
  };

  // ── Profile form handlers ──────────────────────────────────

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'destinationCountry' ? { destinationCity: '' } : {}),
    }));
    setProfileErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Receives yyyy-MM-dd string from ThreePartDateField.
  const handleDateChange = (name, value) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
    setProfileErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validates profile fields before saving.
  const validateProfile = () => {
    const e = {};
    if (!profile.destinationCountry) e.destinationCountry = 'Please select a destination country.';
    if (!profile.destinationCity) e.destinationCity = 'Please select a city.';
    if (!profile.university.trim()) e.university = 'Please enter your university name.';
    if (!profile.travelStartDate) e.travelStartDate = 'Please select a departure date.';
    if (!profile.travelEndDate) e.travelEndDate = 'Please select a return date.';
    if (profile.travelStartDate && profile.travelEndDate &&
        new Date(profile.travelEndDate) <= new Date(profile.travelStartDate)) {
      e.travelEndDate = 'Return date must be after departure date.';
    }
    return e;
  };

  // Saves profile changes via PATCH /api/user/profile.
  const handleProfileSave = async () => {
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateProfile({
        ...profile,
        university: profile.university.trim(),
      });
      const token = localStorage.getItem('token');
      login(token, { ...user, ...updated });
      showToast(setProfileToast, 'success');
    } catch (err) {
      setPasswordToastMsg(err.message);
      showToast(setProfileToast, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password form handlers ─────────────────────────────────

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validates password fields before saving.
  const validatePasswords = () => {
    const e = {};
    if (!passwords.currentPassword) e.currentPassword = 'Please enter your current password.';
    if (!passwords.newPassword) e.newPassword = 'Please enter a new password.';
    else if (passwords.newPassword.length < 6) e.newPassword = 'New password must be at least 6 characters.';
    if (!passwords.confirmPassword) e.confirmPassword = 'Please confirm your new password.';
    else if (passwords.newPassword !== passwords.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    if (passwords.currentPassword && passwords.newPassword &&
        passwords.currentPassword === passwords.newPassword) {
      e.newPassword = 'New password must be different from your current password.';
    }
    return e;
  };

  // Sends password change request to backend.
  const handlePasswordSave = async () => {
    const errors = validatePasswords();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordSaving(true);
    try {
      await axiosInstance.patch('/api/user/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordToastMsg('Password updated successfully.');
      showToast(setPasswordToast, 'success');
    } catch (err) {
      setPasswordToastMsg(err.message);
      showToast(setPasswordToast, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const cities = CITIES_BY_COUNTRY[profile.destinationCountry] || [];

  if (profileLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            {'<- Dashboard'}
          </Link>
          <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
            Study Abroad Buddy
          </span>
          <div className="w-24" />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">
            Settings
          </p>
          <h1 className="text-3xl font-extrabold text-white">Profile</h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.name} {'·'} {user?.email}
          </p>
        </div>

        {/* ── PROFILE SECTION ─────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">Trip details</h2>
            {profileToast === 'success' && (
              <Toast text="Saved successfully" type="success" />
            )}
            {profileToast === 'error' && (
              <Toast text={passwordToastMsg || 'Failed to save'} type="error" />
            )}
          </div>

          {/* Home country — read only */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Home country
            </label>
            <div className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed">
              {profile.homeCountry || '—'}
            </div>
            <p className="text-slate-600 text-xs mt-1">
              Contact support to change your home country.
            </p>
          </div>

          {/* Destination country */}
          <SelectField
            id="destinationCountry"
            label="Destination country"
            name="destinationCountry"
            value={profile.destinationCountry}
            onChange={handleProfileChange}
            options={DESTINATION_COUNTRIES}
            placeholder="Select a country"
            error={profileErrors.destinationCountry}
          />

          {/* Destination city */}
          <SelectField
            id="destinationCity"
            label="City"
            name="destinationCity"
            value={profile.destinationCity}
            onChange={handleProfileChange}
            options={cities}
            placeholder={profile.destinationCountry ? 'Select a city' : 'Select a country first'}
            error={profileErrors.destinationCity}
            disabled={!profile.destinationCountry}
          />

          {/* University */}
          <div>
            <label htmlFor="university" className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              University
            </label>
            <input
              id="university"
              name="university"
              type="text"
              value={profile.university}
              onChange={handleProfileChange}
              placeholder="e.g. TU Berlin"
              className={`w-full bg-slate-950 border text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors ${
                profileErrors.university
                  ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400'
                  : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
              }`}
            />
            {profileErrors.university && (
              <p className="mt-1.5 text-red-400 text-xs">{profileErrors.university}</p>
            )}
          </div>

          {/* Travel dates — ThreePartDateField replaces native date inputs */}
          <ThreePartDateField
            label="Departure date"
            name="travelStartDate"
            value={profile.travelStartDate}
            onChange={handleDateChange}
            error={profileErrors.travelStartDate}
          />

          <ThreePartDateField
            label="Return date"
            name="travelEndDate"
            value={profile.travelEndDate}
            onChange={handleDateChange}
            error={profileErrors.travelEndDate}
          />

          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20"
          >
            {profileSaving ? 'Saving…' : 'Save changes'}
          </button>

        </section>

        {/* ── PASSWORD SECTION ────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">Change password</h2>
            {passwordToast === 'success' && (
              <Toast text={passwordToastMsg} type="success" />
            )}
            {passwordToast === 'error' && (
              <Toast text={passwordToastMsg} type="error" />
            )}
          </div>

          <PasswordField
            id="currentPassword"
            label="Current password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Your current password"
            error={passwordErrors.currentPassword}
          />

          <PasswordField
            id="newPassword"
            label="New password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            placeholder="Min. 6 characters"
            error={passwordErrors.newPassword}
            hint="At least 6 characters"
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            placeholder="Re-enter new password"
            error={passwordErrors.confirmPassword}
          />

          <button
            onClick={handlePasswordSave}
            disabled={passwordSaving}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors border border-slate-700"
          >
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>

        </section>

      </main>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────

const SelectField = ({ id, label, name, value, onChange, options, placeholder, error, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full bg-slate-950 border text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed ${
        value ? 'text-white' : 'text-slate-500'
      } ${
        error
          ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400'
          : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
      }`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <p className="mt-1.5 text-red-400 text-xs">{error}</p>}
  </div>
);

// Three-part date selector — Day / Month / Year dropdowns in DD/MM/YYYY order.
// Calls onChange(name, 'yyyy-MM-dd') when all three parts are selected,
// or onChange(name, '') if any part is cleared.
const ThreePartDateField = ({ label, name, value, onChange, error }) => {
  const parts = value ? value.split('-') : ['', '', ''];
  const selectedYear  = parts[0] || '';
  const selectedMonth = parts[1] || '';
  const selectedDay   = parts[2] || '';

  const handlePart = (part, val) => {
    const year  = part === 'year'  ? val : selectedYear;
    const month = part === 'month' ? val : selectedMonth;
    const day   = part === 'day'   ? val : selectedDay;
    if (year && month && day) {
      onChange(name, `${year}-${month}-${day}`);
    } else {
      onChange(name, '');
    }
  };

  const days = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => String(currentYear + i));

  const selectClass = (hasError) =>
    `bg-slate-950 border text-sm rounded-xl px-3 py-3 focus:outline-none focus:ring-1 transition-colors appearance-none w-full ${
      hasError
        ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400 text-white'
        : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
    }`;

  return (
    <div>
      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">

        {/* Day */}
        <select
          value={selectedDay}
          onChange={(e) => handlePart('day', e.target.value)}
          className={`${selectClass(!!error)} ${selectedDay ? 'text-white' : 'text-slate-500'}`}
        >
          <option value="" disabled>DD</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={selectedMonth}
          onChange={(e) => handlePart('month', e.target.value)}
          className={`${selectClass(!!error)} ${selectedMonth ? 'text-white' : 'text-slate-500'}`}
        >
          <option value="" disabled>MM</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={selectedYear}
          onChange={(e) => handlePart('year', e.target.value)}
          className={`${selectClass(!!error)} ${selectedYear ? 'text-white' : 'text-slate-500'}`}
        >
          <option value="" disabled>YYYY</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

      </div>
      {error && <p className="mt-1.5 text-red-400 text-xs">{error}</p>}
    </div>
  );
};

const PasswordField = ({ id, label, name, value, onChange, placeholder, error, hint }) => (
  <div>
    <label htmlFor={id} className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      id={id}
      name={name}
      type="password"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="new-password"
      className={`w-full bg-slate-950 border text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors ${
        error
          ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400'
          : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
      }`}
    />
    {error && <p className="mt-1.5 text-red-400 text-xs">{error}</p>}
    {hint && !error && <p className="mt-1.5 text-slate-600 text-xs">{hint}</p>}
  </div>
);

const Toast = ({ text, type }) => (
  <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
    type === 'success'
      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
      : 'bg-red-400/10 border-red-400/20 text-red-400'
  }`}>
    {type === 'success' ? '✓' : '✕'} {text}
  </span>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Loading your profile…</p>
    </div>
  </div>
);

export default ProfilePage;