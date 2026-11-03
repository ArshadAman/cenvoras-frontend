import React from 'react';

/**
 * BrandLogo component that automatically switches between light and dark versions.
 * Uses CSS classes (block dark:hidden / hidden dark:block) for instant zero-flicker
 * theme-awareness without layout shift.
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional custom CSS classes for sizing and layout
 * @param {boolean} [props.iconOnly] - If true, displays the standalone emblem/app icon instead of the full wordmark
 * @param {string} [props.alt] - Alt text for accessibility
 */
export default function BrandLogo({ className = '', iconOnly = false, alt = 'Cenvora', ...rest }) {
  if (iconOnly) {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src="/pwa-192x192.png"
          alt={alt}
          className="block h-full w-full object-contain select-none pointer-events-none dark:hidden"
          {...rest}
        />
        <img
          src="/pwa-dark-192x192.png"
          alt={alt}
          className="hidden h-full w-full object-contain select-none pointer-events-none dark:block"
          {...rest}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src="/cenvora-logo-light.png"
        alt={alt}
        className="block h-full w-auto max-w-full object-contain select-none pointer-events-none dark:hidden"
        {...rest}
      />
      <img
        src="/cenvora-logo-dark.png"
        alt={alt}
        className="hidden h-full w-auto max-w-full object-contain select-none pointer-events-none dark:block"
        {...rest}
      />
    </span>
  );
}
