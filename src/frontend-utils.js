export function safeCatalogReturn(value, origin = 'http://localhost') {
  try {
    const url = new URL(value || '/', origin);
    return url.origin === origin && url.pathname === '/' ? `${url.pathname}${url.search}` : '/';
  } catch {
    return '/';
  }
}

export function isPositiveWholeNumber(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

export function confirmationView(status) {
  if (status === 'Cancelled') return {
    tone: 'cancelled', eyebrow: 'Order cancelled', title: 'This order will not be prepared.',
    showCollection: false, message: 'The item quantities have been restored to stock.',
  };
  return {
    tone: 'confirmed', eyebrow: 'Order placed', title: 'We’ll see you at pickup.',
    showCollection: true, message: '',
  };
}
