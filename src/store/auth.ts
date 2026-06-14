import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, FinancialProfile } from '../types';
import { MOCK_USER, MOCK_PROFILE } from '../lib/mockdb';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: FinancialProfile | null;
  loading: boolean;
  isMock: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: FinancialProfile | null) => void;
  loginMock: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  isMock: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  loginMock: () => set({ user: MOCK_USER, profile: MOCK_PROFILE, isMock: true }),

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  fetchUser: async () => {
    const { session } = get();
    if (!session?.user) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (data) set({ user: data as User });
  },

  fetchProfile: async () => {
    const { session } = get();
    if (!session?.user) return;
    const { data } = await supabase
      .from('financial_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    if (data) set({ profile: data as FinancialProfile });
  },
}));
