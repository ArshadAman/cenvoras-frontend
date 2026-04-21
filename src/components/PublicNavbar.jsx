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

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 ${className}`}>
        <div className="w-full max-w-7xl">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-black/40 via-black/50 to-black/40 px-6 py-4 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300">
            {/* Logo */}
            <Link to="/" className="flex items-center transition-all duration-300 hover:opacity-90 active:scale-95">
              <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-auto w-[120px] object-contain sm:w-[140px]" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 text-sm md:flex">
              {links.map((item, idx) => (
                <div key={idx} className="relative group">
                  {renderLink(item, 'font-medium text-gray-300 transition-all duration-300 hover:text-white relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-400 after:to-blue-600 after:transition-all after:duration-300 group-hover:after:w-full')}
                </div>
              ))}
            </div>

            {/* Desktop Auth Links */}
            <div className="hidden items-center gap-3 md:flex">
              {authLinks ? (
                <>
                  <Link to="/login" className="px-6 py-2 text-sm font-semibold text-gray-300 transition-all duration-300 hover:text-white rounded-lg hover:bg-white/5">
                    Log In
                  </Link>
                  <Link to="/signup" className="px-6 py-2 text-sm font-bold text-black bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95">
                    Get Started
                  </Link>
                </>
              ) : null}
            </div>

            {/* Mobile Menu Button & Sign Up */}
            <div className="flex items-center gap-3 md:hidden">
              {authLinks ? (
                <Link to="/signup" className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg transition-all duration-300 active:scale-95">
                  Sign Up
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all duration-300 hover:bg-white/20 active:scale-95"
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
              >
                <div className="relative h-5 w-5 flex items-center justify-center">
                  <Bars3Icon className={`absolute h-5 w-5 transition-all duration-300 ${menuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                  <XMarkIcon className={`absolute h-5 w-5 transition-all duration-300 ${menuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`absolute left-4 right-4 top-20 origin-top rounded-2xl bg-gradient-to-b from-black/60 via-black/50 to-black/40 backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-300 md:hidden ${
              menuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'
            }`}
            style={{
              transformOrigin: 'top center',
            }}
          >
            <div className="flex flex-col gap-0 p-4">
              {links.map((item, idx) => (
                <div key={idx} className="border-b border-white/5 last:border-b-0 py-0">
                  {renderLink(
                    item,
                    'block px-4 py-3 text-sm font-medium text-gray-300 transition-all duration-300 rounded-lg hover:bg-white/10 hover:text-white active:scale-95',
                    () => setMenuOpen(false)
                  )}
                </div>
              ))}

              {authLinks ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-center text-sm font-semibold text-gray-300 transition-all duration-300 rounded-lg hover:bg-white/10 hover:text-white active:scale-95"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-3 text-center text-sm font-bold text-black bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/40 active:scale-95"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-20 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}