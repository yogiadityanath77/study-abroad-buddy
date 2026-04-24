// client/src/components/ProgressBar.jsx
// Horizontal progress bar — matches the inline implementation in VisaPage and HealthPage.
// percent: 0–100 (number)
// colour: Tailwind bg class for the fill — defaults to amber, pass 'bg-sky-400' for health
// Turns green automatically when percent hits 100.

const ProgressBar = ({ percent = 0, colour = 'bg-amber-400' }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          clamped === 100 ? 'bg-emerald-400' : colour
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default ProgressBar;