export const getCurrencyCode = () => {
  try {
    return (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem('user_currency')) || 'INR';
  } catch {
    return 'INR';
  }
};

export const getCountryCode = () => {
  try {
    return (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem('user_country')) || 'IN';
  } catch {
    return 'IN';
  }
};

export const getCurrencySymbol = () => {
  return getCurrencyCode() === 'AED' ? 'AED' : '₹';
};

export const formatCurrency = (amount) => {
  const currency = getCurrencyCode();
  const val = parseFloat(amount || 0);
  
  if (isNaN(val)) return currency === 'AED' ? 'AED 0.00' : '₹0.00';
  
  if (currency === 'AED') {
    return `AED ${val.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${getCurrencySymbol()}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyWithoutSymbol = (amount) => {
  const currency = getCurrencyCode();
  const val = parseFloat(amount || 0);
  
  if (isNaN(val)) return '0.00';
  
  if (currency === 'AED') {
    return val.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
