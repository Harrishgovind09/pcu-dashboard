import { createClient } from '@supabase/supabase-js';
import { createMock } from './mock.js';

export const IS_MOCK = import.meta.env.VITE_MOCK === '1';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const CONFIG_OK = IS_MOCK || Boolean(url && key);

export const supabase = IS_MOCK
  ? createMock()
  : CONFIG_OK
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;
