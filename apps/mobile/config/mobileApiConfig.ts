export function getJibunkaigiApiBaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL?.trim();
  if (!value) return null;
  return value.replace(/\/+$/, '');
}

export function isGeminiProxyConfigured(): boolean {
  return Boolean(getJibunkaigiApiBaseUrl());
}
