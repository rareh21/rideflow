const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = sessionStorage.getItem('accessToken');

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem('accessToken');

    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register')
    ) {
      const returnUrl =
        window.location.pathname + window.location.search;

      window.location.replace(
        `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
      );
    }

    throw new Error('Your session has expired. Please log in again.');
  }

  if (!response.ok) {
    let message = 'Something went wrong';

    try {
      const data = await response.json();

      if (Array.isArray(data?.message)) {
        message = data.message.join(', ');
      } else if (data?.message) {
        message = data.message;
      }
    } catch {
      // Ignore invalid/non-JSON error responses
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}