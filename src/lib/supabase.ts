
import { createClient } from '@supabase/supabase-js'

// URL de base du projet Supabase
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined

// Clé publique du projet
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Vérifie que les informations sont présentes
export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  !url.includes('YOUR_PROJECT') &&
  !url.includes('/rest/v1')
)

// Crée le client seulement si la configuration est valide
export const supabase =
  isSupabaseConfigured && url && key
    ? createClient(url.replace(/\/+$/, ''), key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null
