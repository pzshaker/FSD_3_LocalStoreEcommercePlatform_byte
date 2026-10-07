export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = Object.assign(new Error(data?.error?.message || 'The request failed. Try again.'), { status: response.status, code: data?.error?.code });
    if (response.status === 401 && path.startsWith('/owner/') && path !== '/owner/session') window.dispatchEvent(new CustomEvent('owner-session-expired'));
    throw error;
  }
  return data;
}
