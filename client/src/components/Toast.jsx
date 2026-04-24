// client/src/components/Toast.jsx
// Inline status pill — matches the Toast sub-component used in ProfilePage.
// Renders as a small badge next to a heading, NOT a fixed-position popup.
// type: 'success' | 'error'

const Toast = ({ text, type }) => (
  <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
    type === 'success'
      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
      : 'bg-red-400/10 border-red-400/20 text-red-400'
  }`}>
    {type === 'success' ? '✓' : '✕'} {text}
  </span>
);

export default Toast;