// client/src/pages/OnboardingPage.jsx
// P-04: Protected, one-time onboarding wizard — 3 steps → PATCH /api/user/profile → redirect /dashboard

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';

// ── Country list — covers the most common study abroad destinations and origins ──
const COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'China', 'Colombia',
  'Czech Republic', 'Denmark', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Malaysia',
  'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Philippines', 'Poland', 'Portugal', 'Saudi Arabia', 'Singapore', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'UAE', 'Ukraine',
  'United Kingdom', 'United States', 'Vietnam',
];

// ── City list keyed by country — add more as needed ──
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

const TOTAL_STEPS = 3;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    homeCountry: '',
    destinationCountry: '',
    destinationCity: '',
    university: '',
    travelStartDate: '',
    travelEndDate: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Updates a single field and clears its error
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset city when destination country changes
      ...(name === 'destinationCountry' ? { destinationCity: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validates only the fields relevant to the current step
  const validateStep = (currentStep) => {
    const e = {};
    if (currentStep === 1) {
      if (!formData.homeCountry) e.homeCountry = 'Please select your home country.';
    }
    if (currentStep === 2) {
      if (!formData.destinationCountry) e.destinationCountry = 'Please select a destination country.';
      if (!formData.destinationCity) e.destinationCity = 'Please select a city.';
    }
    if (currentStep === 3) {
      if (!formData.university.trim()) e.university = 'Please enter your university name.';
      if (!formData.travelStartDate) e.travelStartDate = 'Please select a start date.';
      if (!formData.travelEndDate) e.travelEndDate = 'Please select an end date.';
      if (formData.travelStartDate && formData.travelEndDate &&
          formData.travelStartDate >= formData.travelEndDate) {
        e.travelEndDate = 'End date must be after start date.';
      }
    }
    return e;
  };

  // Validates current step — advances if valid, stops if not
  const handleNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((prev) => prev + 1);
  };

  // Saves all profile fields + sets onboardingComplete: true → redirects to /dashboard
  const handleSubmit = async () => {
    const stepErrors = validateStep(3);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const updated = await updateProfile({
        ...formData,
        university: formData.university.trim(),
        onboardingComplete: true,
      });
      // Sync AuthContext so ProtectedRoute sees onboardingComplete: true
      const token = localStorage.getItem('token');
      login(token, {
        ...user,
        ...updated,
        onboardingComplete: true,
      });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const cities = CITIES_BY_COUNTRY[formData.destinationCountry] || [];
  const progressPercent = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-12">

      {/* Logo */}
      <span className="text-amber-400 font-bold tracking-widest text-sm uppercase mb-10">
        Study Abroad Buddy
      </span>

      <div className="w-full max-w-md">

        {/* ── Progress bar ──────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Step {step} of {TOTAL_STEPS}
            </p>
            <p className="text-slate-600 text-xs">{Math.round(progressPercent)}% complete</p>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s < step
                    ? 'bg-amber-400 text-slate-950'
                    : s === step
                    ? 'bg-amber-400/20 border border-amber-400 text-amber-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-600'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                <span className="text-slate-600 text-xs hidden sm:block">
                  {s === 1 ? 'Origin' : s === 2 ? 'Destination' : 'Details'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card ──────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {/* Server error */}
          {serverError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {serverError}
            </div>
          )}

          {/* ── STEP 1: Home country ────────────────────────── */}
          {step === 1 && (
            <div>
              <StepHeading
                emoji="🏠"
                title="Where are you from?"
                subtitle="We'll use this to personalise your visa guide."
              />
              <SelectField
                id="homeCountry"
                label="Home country"
                name="homeCountry"
                value={formData.homeCountry}
                onChange={handleChange}
                options={COUNTRIES}
                placeholder="Select your country"
                error={errors.homeCountry}
              />
            </div>
          )}

          {/* ── STEP 2: Destination ─────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <StepHeading
                emoji="✈️"
                title="Where are you heading?"
                subtitle="Your guides will be tailored to this destination."
              />
              <SelectField
                id="destinationCountry"
                label="Destination country"
                name="destinationCountry"
                value={formData.destinationCountry}
                onChange={handleChange}
                options={COUNTRIES}
                placeholder="Select a country"
                error={errors.destinationCountry}
              />
              <SelectField
                id="destinationCity"
                label="City"
                name="destinationCity"
                value={formData.destinationCity}
                onChange={handleChange}
                options={cities}
                placeholder={formData.destinationCountry ? 'Select a city' : 'Select a country first'}
                error={errors.destinationCity}
                disabled={!formData.destinationCountry}
              />
            </div>
          )}

          {/* ── STEP 3: University + dates ──────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <StepHeading
                emoji="🎓"
                title="A few more details"
                subtitle="Almost done — just your university and travel dates."
              />

              {/* University */}
              <div>
                <label htmlFor="university" className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  University name
                </label>
                <input
                  id="university"
                  name="university"
                  type="text"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="e.g. TU Berlin"
                  className={`w-full bg-slate-950 border text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors ${
                    errors.university
                      ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400'
                      : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400'
                  }`}
                />
                {errors.university && (
                  <p className="mt-1.5 text-red-400 text-xs">{errors.university}</p>
                )}
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  id="travelStartDate"
                  label="Start date"
                  name="travelStartDate"
                  value={formData.travelStartDate}
                  onChange={handleChange}
                  error={errors.travelStartDate}
                />
                <DateField
                  id="travelEndDate"
                  label="End date"
                  name="travelEndDate"
                  value={formData.travelEndDate}
                  onChange={handleChange}
                  error={errors.travelEndDate}
                  min={formData.travelStartDate || undefined}
                />
              </div>
            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((prev) => prev - 1)}
                className="flex-1 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm hover:border-slate-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20"
              >
                {loading ? 'Saving…' : 'Go to my dashboard →'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────

// Step heading with emoji, title, and subtitle
const StepHeading = ({ emoji, title, subtitle }) => (
  <div className="mb-6">
    <span className="text-3xl">{emoji}</span>
    <h2 className="text-2xl font-extrabold text-white mt-2 mb-1">{title}</h2>
    <p className="text-slate-400 text-sm">{subtitle}</p>
  </div>
);

// Labelled select with placeholder + error state
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

export default OnboardingPage;