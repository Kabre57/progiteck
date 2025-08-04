import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { ReactNode } from 'react';

// Mock API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    isAuthenticated: vi.fn(() => false),
    get: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(true);
  });

  it('should provide login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.login).toBe('function');
  });

  it('should provide logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.logout).toBe('function');
  });

  it('should provide hasRole function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.hasRole).toBe('function');
    expect(result.current.hasRole(['admin'])).toBe(false);
  });
});