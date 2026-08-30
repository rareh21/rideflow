const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("accessToken")
      : null;

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...options.headers,
      },
    },
  );

  if (!response.ok) {
    let message = "Something went wrong";

    try {
      const error = await response.json();

      if (Array.isArray(error.message)) {
        message = error.message.join(", ");
      } else if (error.message) {
        message = error.message;
      }
    } catch {
      // Ignore parsing errors
    }

    throw new Error(message);
  }

  return response.json();
}