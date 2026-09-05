import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Cenvora';
const DEFAULT_DESCRIPTION = 'Cenvora is billing and inventory software for modern businesses, combining sales, stock, customers, localized taxes, and reporting in one platform.';
const DEFAULT_KEYWORDS = 'billing software, inventory software, business management software, ERP for businesses';
const DEFAULT_IMAGE = '/cenvora-logo-backgrond-removed.png';

const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) {
    return String(import.meta.env.VITE_SITE_URL).replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  return '';
};

const resolveUrl = (value) => {
  if (!value) {
    return `${getBaseUrl()}/`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const baseUrl = getBaseUrl();
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${normalizedPath}`;
};

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath,
  noindex = false,
  ogType = 'website',
  image = DEFAULT_IMAGE,
  structuredData = null,
}) {
  const location = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    const managedNodes = [];
    const pageTitle = title ? `${title} | Cenvora` : SITE_NAME;
    const canonicalUrl = resolveUrl(canonicalPath || location.pathname || '/');
    const imageUrl = resolveUrl(image);

    const appendNode = (node) => {
      node.dataset.seoManaged = 'true';
      document.head.appendChild(node);
      managedNodes.push(node);
    };

    const addMeta = (attributes) => {
      const meta = document.createElement('meta');
      Object.entries(attributes).forEach(([key, value]) => meta.setAttribute(key, value));
      appendNode(meta);
    };

    const addLink = (attributes) => {
      const link = document.createElement('link');
      Object.entries(attributes).forEach(([key, value]) => link.setAttribute(key, value));
      appendNode(link);
    };

    document.title = pageTitle;

    addMeta({ name: 'description', content: description });
    if (keywords) {
      addMeta({ name: 'keywords', content: Array.isArray(keywords) ? keywords.join(', ') : keywords });
    }
    addMeta({ name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });
    addMeta({ property: 'og:title', content: pageTitle });
    addMeta({ property: 'og:description', content: description });
    addMeta({ property: 'og:type', content: ogType });
    addMeta({ property: 'og:url', content: canonicalUrl });
    addMeta({ property: 'og:image', content: imageUrl });
    addMeta({ property: 'og:site_name', content: SITE_NAME });
    addMeta({ name: 'twitter:card', content: 'summary_large_image' });
    addMeta({ name: 'twitter:title', content: pageTitle });
    addMeta({ name: 'twitter:description', content: description });
    addMeta({ name: 'twitter:image', content: imageUrl });

    addLink({ rel: 'canonical', href: canonicalUrl });

    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      appendNode(script);
    }

    return () => {
      managedNodes.forEach((node) => node.remove());
      document.title = previousTitle;
    };
  }, [title, description, keywords, canonicalPath, noindex, ogType, image, structuredData, location.pathname]);

  return null;
}