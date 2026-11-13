import { useCallback, useEffect, useState } from 'react';

export interface TherapistProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country?: string | null;
  profession?: string | null;
  emdrTrainingStatus?: string | null;
  accountTier: string;
}

const TOKEN_KEY = 'pf-emdr-auth-token';

export function useAuth() {
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = () => localStorage.getItem(TOKEN_KEY);

  const refresh = useCallback(async () => {
    const t = token();
    if (!t) {
      setTherapist(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        setTherapist(null);
      } else {
        const data = (await res.json()) as { therapist: TherapistProfile };
        setTherapist(data.therapist);
      }
    } catch {
      setTherapist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const register = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    privacyConsent: boolean;
  }) => {
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      error?: string;
      token?: string;
      therapist?: TherapistProfile;
    };
    if (!res.ok) {
      setError(data.error ?? 'Registration failed');
      return false;
    }
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    setTherapist(data.therapist ?? null);
    return true;
  };

  const login = async (email: string, password: string) => {
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as {
      error?: string;
      token?: string;
      therapist?: TherapistProfile;
    };
    if (!res.ok) {
      setError(data.error ?? 'Login failed');
      return false;
    }
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    setTherapist(data.therapist ?? null);
    return true;
  };

  const logout = async () => {
    const t = token();
    if (t) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_KEY);
    setTherapist(null);
  };

  const saveOnboarding = async (payload: {
    country: string;
    profession: string;
    emdrTrainingStatus: string;
  }) => {
    const t = token();
    if (!t) return false;
    const res = await fetch('/api/auth/onboarding', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { therapist: TherapistProfile };
    setTherapist(data.therapist);
    return true;
  };

  const authHeaders = (): HeadersInit => {
    const t = token();
    return t ? { Authorization: `Bearer ${t}`, 'content-type': 'application/json' } : {};
  };

  return {
    therapist,
    loading,
    error,
    register,
    login,
    logout,
    saveOnboarding,
    refresh,
    authHeaders,
    isAuthenticated: !!therapist,
  };
}
