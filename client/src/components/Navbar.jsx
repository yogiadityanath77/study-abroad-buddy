import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Navigation links shown in the sidebar on all protected pages.
const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/visa', label: 'Visa' },
  { to: '/health', label: 'Health' },
  { to: '/culture', label: 'Culture' },
  { to: '/housing', label: 'Housing' },
  { to: '/chat', label: 'AI Chat' },
  { to: '/profile', label: 'Profile' },
];

// Sidebar navbar rendered on all protected pages.
// Highlights the active route and provides a logout button.
const Navbar = () => {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-56 shrink-0 flex flex-col h-screen sticky top-0 border-r border-slate-800 bg-slate-950 px-3 py-6">
      <Link to="/dashboard" className="text-white font-semibold text-lg px-3 mb-8">
        Study Abroad
      </Link>

      <ul className="flex flex-col gap-1 flex-1">
        {NAV_LINKS.map(({ to, label }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        onClick={handleLogout}
        className="mt-4 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors text-left"
      >
        Log out
      </button>
    </nav>
  );
};

export default Navbar;