// client/src/components/LoadingSpinner.jsx
// Full-screen loading state — matches the inline LoadingScreen used across all pages.
// Pass a custom message prop to show page-specific text (e.g. "Loading your visa guide…")

const LoadingSpinner = ({ message = 'Loading…' }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;