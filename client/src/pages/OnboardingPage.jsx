// client/src/pages/OnboardingPage.jsx
// P-04: Protected, one-time onboarding wizard — 3 steps → PATCH /api/user/profile → redirect /dashboard

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';

// ── Home countries — full list, students come from anywhere ──
const HOME_COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'China', 'Colombia',
  'Czech Republic', 'Denmark', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Malaysia',
  'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Philippines', 'Poland', 'Portugal', 'Saudi Arabia', 'Singapore', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'UAE', 'Ukraine',
  'United Kingdom', 'United States', 'Vietnam',
];

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

  // Updates a single field and clears its error.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'destinationCountry' ? { destinationCity: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Receives a yyyy-MM-dd string from ThreePartDateField and updates formData.
  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validates only the fields relevant to the current step.
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
      if (!formData.travelStartDate) e.travelStartDate = 'Please select a departure date.';
      if (!formData.travelEndDate) e.travelEndDate = 'Please select a return date.';
      if (formData.travelStartDate && formData.travelEndDate &&
          new Date(formData.travelEndDate) <= new Date(formData.travelStartDate)) {
        e.travelEndDate = 'Return date must be after departure date.';
      }
    }
    return e;
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((prev) => prev + 1);
  };

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
      const token = localStorage.getItem('token');
      login(token, { ...user, ...updated, onboardingComplete: true });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cities = CITIES_BY_COUNTRY[formData.destinationCountry] || [];
  const progressPercent = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-12">

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
                options={HOME_COUNTRIES}
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
                options={DESTINATION_COUNTRIES}
                placeholder="Select a country"
                error={errors.destinationCountry}
              />
              {/* Helper note explaining the limited list */}
              {!formData.destinationCountry && (
                <p className="text-slate-600 text-xs -mt-2">
                  Currently supporting 8 top study destinations.
                </p>
              )}
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

              {/* Departure date */}
              <ThreePartDateField
                label="Departure date"
                name="travelStartDate"
                value={formData.travelStartDate}
                onChange={handleDateChange}
                error={errors.travelStartDate}
              />

              {/* Return date */}
              <ThreePartDateField
                label="Return date"
                name="travelEndDate"
                value={formData.travelEndDate}
                onChange={handleDateChange}
                error={errors.travelEndDate}
              />

            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((prev) => prev - 1)}
                className="flex-1 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm hover:border-slate-500 hover:text-white transition-colors"
              >
                {'← Back'}
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20"
              >
                {'Next →'}
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

const StepHeading = ({ emoji, title, subtitle }) => (
  <div className="mb-6">
    <span className="text-3xl">{emoji}</span>
    <h2 className="text-2xl font-extrabold text-white mt-2 mb-1">{title}</h2>
    <p className="text-slate-400 text-sm">{subtitle}</p>
  </div>
);

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
  // Parse the incoming yyyy-MM-dd value into parts so the dropdowns
  // are pre-filled when the component mounts with an existing date (e.g. ProfilePage).
  const fromValue = (v) => {
    if (!v) return { day: '', month: '', year: '' };
    const parts = v.split('-');
    return {
      year:  parts[0] || '',
      month: parts[1] || '',
      day:   parts[2] || '',
    };
  };

  // Local state holds the three parts independently.
  // This is what was missing — without local state, partial selections
  // are lost on every re-render because the parent value is '' until all three are set.
  const [parts, setParts] = useState(() => fromValue(value));

  // When the parent value changes externally (e.g. profile page reset),
  // sync local state back.
  useEffect(() => {
    setParts(fromValue(value));
  }, [value]);

  const handlePart = (part, val) => {
    const updated = { ...parts, [part]: val };
    setParts(updated);
    // Only call parent onChange once all three parts are filled.
    if (updated.year && updated.month && updated.day) {
      onChange(name, `${updated.year}-${updated.month}-${updated.day}`);
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
          value={parts.day}
          onChange={(e) => handlePart('day', e.target.value)}
          className={`${selectClass(!!error)} ${parts.day ? 'text-white' : 'text-slate-500'}`}
        >
          <option value="" disabled>DD</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={parts.month}
          onChange={(e) => handlePart('month', e.target.value)}
          className={`${selectClass(!!error)} ${parts.month ? 'text-white' : 'text-slate-500'}`}
        >
          <option value="" disabled>MM</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={parts.year}
          onChange={(e) => handlePart('year', e.target.value)}
          className={`${selectClass(!!error)} ${parts.year ? 'text-white' : 'text-slate-500'}`}
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

export default OnboardingPage;