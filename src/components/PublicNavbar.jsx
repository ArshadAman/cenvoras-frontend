import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './common/ThemeToggle';
import BrandLogo from './common/BrandLogo';

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
      <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-2 pb-6 bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent ${className}`}>
        <div className="w-full max-w-7xl">
          <div 
            className="flex items-center justify-between rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-lg transition-all duration-300"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center transition-all duration-300 hover:opacity-90 active:scale-95">
              <BrandLogo className="h-10 sm:h-11 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 text-sm md:flex">
              {links.map((item, idx) => (
                <div key={idx} className="relative group">
                  {renderLink(item, 'font-medium transition-all duration-300 hover:opacity-100 opacity-80 relative')}
                </div>
              ))}
            </div>

            {/* Desktop Actions & Theme Toggle */}
            <div className="hidden items-center gap-3 md:flex">
              <ThemeToggle />
              {authLinks ? (
                <>
                  <Link 
                    to="/login" 
                    className="btn-ghost !text-xs !py-1.5 !px-3 font-semibold"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="btn-primary !text-xs !py-2 !px-4"
                  >
                    Get Started
                  </Link>
                </>
              ) : null}
            </div>

            {/* Mobile Actions: Theme Toggle & Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              {authLinks ? (
                <Link to="/signup" className="btn-primary !text-xs !py-1.5 !px-3">
                  Sign Up
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-300 active:scale-95"
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
            className={`absolute left-4 right-4 top-20 origin-top rounded-2xl backdrop-blur-lg border shadow-2xl transition-all duration-300 md:hidden ${
              menuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible'
            }`}
            style={{
              transformOrigin: 'top center',
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex flex-col gap-0 p-4">
              {links.map((item, idx) => (
                <div key={idx} className="border-b border-[var(--border-subtle)] last:border-b-0 py-0">
                  {renderLink(
                    item,
                    'block px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-[var(--bg-primary)] active:scale-95',
                    () => setMenuOpen(false)
                  )}
                </div>
              ))}

              {authLinks ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-center text-sm font-semibold rounded-lg hover:bg-[var(--bg-primary)] active:scale-95"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary w-full text-center"
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