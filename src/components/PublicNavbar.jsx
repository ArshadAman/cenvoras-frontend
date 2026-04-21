import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const renderLink = (item, className, onClick) => {
  if (item.href?.startsWith('http')) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }

  if (item.href?.startsWith('#')) {
    return (
      <a href={item.href} className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }

  return (
    <Link to={item.href || '/'} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
};

export default function PublicNavbar({ links = [], authLinks = true, className = '' }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <nav className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 ${className}`}>
      <div className="glass-nav flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 shadow-2xl sm:px-6">
        <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
          <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-auto w-[140px] object-contain sm:w-[160px]" />
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-gray-300 md:flex">
          {links.map((item) => renderLink(item, 'transition-colors hover:text-white'))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {authLinks ? (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">Log In</Link>
              <Link to="/signup" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200">Get Started</Link>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {authLinks ? (
            <Link to="/signup" className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-gray-200">Sign Up</Link>
          ) : null}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute top-[4.75rem] w-full max-w-6xl rounded-3xl border border-white/10 bg-black/95 px-4 py-4 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2 text-sm font-medium text-gray-200">
            {links.map((item) => renderLink(item, 'rounded-2xl px-4 py-3 transition-colors hover:bg-white/5 hover:text-white', () => setMenuOpen(false)))}
            {authLinks ? (
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
                <Link to="/login" className="rounded-2xl px-4 py-3 transition-colors hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link to="/signup" className="rounded-2xl bg-white px-4 py-3 text-center font-semibold text-black transition-colors hover:bg-gray-200" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}