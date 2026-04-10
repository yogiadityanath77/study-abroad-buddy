// client/src/pages/ProfilePage.jsx
// P-11: Protected profile + settings — edit destination/dates, change password

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

// ── Country + city data (same as OnboardingPage) ──────────────
const COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'China', 'Colombia',
  'Czech Republic', 'Denmark', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Malaysia',
  'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Philippines', 'Poland', 'Portugal', 'Saudi Arabia', 'Singapore', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'UAE', 'Ukraine',
  'United Kingdom', 'United States', 'Vietnam',
];

const CITIES_BY_COUNTRY = {
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  Austria: ['Vienna', 'Graz', 'Innsbruck', 'Salzburg'],
  Belgium: ['Brussels', 'Ghent', 'Leuven', 'Liège'],
  Brazil: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'],
  China: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
  Colombia: ['Bogotá', 'Medellín', 'Cali'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava'],
  Denmark: ['Copenhagen', 'Aarhus', 'Odense'],
  Finland: ['Helsinki', 'Tampere', 'Turku', 'Oulu'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Strasbourg'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Heidelberg'],
  Greece: ['Athens', 'Thessaloniki'],
  Hungary: ['Budapest', 'Debrecen', 'Pécs'],
  India: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'],
  Indonesia: ['Jakarta', 'Bali', 'Bandung', 'Yogyakarta'],
  Ireland: ['Dublin', 'Cork', 'Galway', 'Limerick'],
  Italy: ['Rome', 'Milan', 'Florence', 'Bologna', 'Turin', 'Naples'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka', 'Sapporo'],
  Malaysia: ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
  Mexico: ['Mexico City', 'Guadalajara', 'Monterrey'],
  Netherlands: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Delft'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch'],
  Nigeria: ['Lagos', 'Abuja', 'Ibadan'],
  Norway: ['Oslo', 'Bergen', 'Trondheim'],
  Pakistan: ['Karachi', 'Lahore', 'Islamabad'],
  Philippines: ['Manila', 'Cebu City', 'Davao'],
  Poland: ['Warsaw', 'Kraków', 'Wrocław', 'Poznań'],
  Portugal: ['Lisbon', 'Porto', 'Coimbra', 'Braga'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam'],
  Singapore: ['Singapore'],
  'South Korea': ['Seoul', 'Busan', 'Daegu', 'Incheon'],
  Spain: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Granada', 'Bilbao'],
  Sweden: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'],
  Switzerland: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'],
  Thailand: ['Bangkok', 'Chiang Mai', 'Phuket'],
  Turkey: ['Istanbul', 'Ankara', 'Izmir'],
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  Ukraine: ['Kyiv', 'Lviv', 'Kharkiv'],
  'United Kingdom': ['London', 'Edinburgh', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Glasgow'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Boston', 'San Francisco', 'Seattle', 'Austin'],
  Vietnam: ['Hanoi', 'Ho Chi Minh City', 'Da Nang'],
};

// Converts ISO date string to yyyy-MM-dd for date input value
const toDateInputValue = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
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
  const [profileToast, setProfileToast] = useState(''); // 'success' | 'error' | ''

  // ── Password form state ──
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordToast, setPasswordToast] = useState(''); // 'success' | 'error' | ''
  const [passwordToastMsg, setPasswordToastMsg] = useState('');

  // Loads full profile from DB on mount and pre-fills the form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile({
          homeCountry: data.homeCountry || '',
          destinationCountry: data.destinationCountry || '',
          destinationCity: data.destinationCity || '',
          university: data.university || '',
          travelStartDate: toDateInputValue(data.travelStartDate),
          travelEndDate: toDateInputValue(data.travelEndDate),
        });
      } catch (err) {
        setProfileToast('error');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Shows a toast for 3 seconds then clears it
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

  // Validates profile fields before saving
  const validateProfile = () => {
    const e = {};
    if (!profile.destinationCountry) e.destinationCountry = 'Please select a destination country.';
    if (!profile.destinationCity) e.destinationCity = 'Please select a city.';
    if (!profile.university.trim()) e.university = 'Please enter your university name.';
    if (!profile.travelStartDate) e.travelStartDate = 'Please select a start date.';
    if (!profile.travelEndDate) e.travelEndDate = 'Please select an end date.';
    if (profile.travelStartDate && profile.travelEndDate &&
        profile.travelStartDate >= profile.travelEndDate) {
      e.travelEndDate = 'End date must be after start date.';
    }
    return e;
  };

  // Saves profile changes via PATCH /api/user/profile
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
      // Sync AuthContext with updated name/email in case they changed
      const token = localStorage.getItem('token');
      login(token, { ...user, ...updated });
      showToast(setProfileToast, 'success');
    } catch (err) {
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

  // Validates password fields before saving
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

  // Sends password change request to backend
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
      const msg = err.response?.data?.message || 'Failed to update password.';
      setPasswordToastMsg(msg);
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
              <Toast text="Failed to save" type="error" />
            )}
          </div>

          {/* Home country — read only, set during onboarding */}
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
            options={COUNTRIES}
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

          {/* Travel dates */}
          <div className="grid grid-cols-2 gap-3">
            <DateField
              id="travelStartDate"
              label="Start date"
              name="travelStartDate"
              value={profile.travelStartDate}
              onChange={handleProfileChange}
              error={profileErrors.travelStartDate}
            />
            <DateField
              id="travelEndDate"
              label="End date"
              name="travelEndDate"
              value={profile.travelEndDate}
              onChange={handleProfileChange}
              error={profileErrors.travelEndDate}
              min={profile.travelStartDate || undefined}
            />
          </div>

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

// Labelled select field with error state
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

// Date input with label + error state
const DateField = ({ id, label, name, value, onChange, error, min }) => (
  <div>
    <label htmlFor={id} className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      id={id}
      name={name}
      type="date"
      value={value}
      onChange={onChange}
      min={min}
      className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors ${
        error
          ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400'
          : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
      }`}
    />
    {error && <p className="mt-1.5 text-red-400 text-xs">{error}</p>}
  </div>
);

// Password input with label, hint, error state
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

// Inline toast — auto-dismissed by parent via setTimeout
const Toast = ({ text, type }) => (
  <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
    type === 'success'
      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
      : 'bg-red-400/10 border-red-400/20 text-red-400'
  }`}>
    {type === 'success' ? '✓' : '✕'} {text}
  </span>
);

// Full-screen loading state
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Loading your profile…</p>
    </div>
  </div>
);

export default ProfilePage;