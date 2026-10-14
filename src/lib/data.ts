import { supabase } from './supabase'

export type Skill = { id: string; name: string; category: string; description: string; level: number; icon: string; published: boolean; sort_order?: number }
export type Service = { id: string; title: string; description: string; icon: string; published: boolean; sort_order?: number }

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  image_urls?: string[];
  technologies: string[];
  live_url: string;
  github_url: string;
  featured: boolean;
  published: boolean;
};


export const demoSkills: Skill[] = [
  { id: 's1', name: 'JavaScript', category: 'Développement web', description: 'Interfaces interactives et logique applicative.', level: 78, icon: 'Code2', published: true },
  { id: 's2', name: 'React', category: 'Développement web', description: 'Applications web modernes et composants réutilisables.', level: 65, icon: 'Atom', published: true },
  { id: 's3', name: 'Flutter & Dart', category: 'Développement mobile', description: 'Interfaces mobiles multiplateformes.', level: 62, icon: 'Smartphone', published: true },
  { id: 's4', name: 'Supabase', category: 'Backend', description: 'Base de données, authentification et API.', level: 60, icon: 'Database', published: true },
]
export const demoServices: Service[] = [
  { id: 'v1', title: 'Développement web', description: 'Des sites rapides, responsives et pensés pour convertir vos visiteurs en clients.', icon: 'Globe', published: true },
  { id: 'v2', title: 'Applications web & SaaS', description: 'Des outils métier et plateformes sur mesure qui simplifient votre activité.', icon: 'Layers', published: true },
  { id: 'v3', title: 'Applications mobiles', description: 'Des expériences mobiles intuitives, conçues autour des besoins des utilisateurs.', icon: 'Smartphone', published: true },
  { id: 'v4', title: 'Solutions digitales', description: 'Intégration, automatisation et accompagnement pour faire évoluer vos idées.', icon: 'Workflow', published: true },
]
export const demoProjects: Project[] = [
  { id: 'p1', title: 'EasyPressing', description: 'Concept de plateforme de gestion pour pressing : clients, commandes et suivi des opérations.', category: 'SaaS', image_url: '', technologies: ['React', 'Supabase', 'TypeScript'], live_url: '', github_url: '', featured: true, published: true },
  { id: 'p2', title: 'DigitalMercy Hub', description: 'Espace numérique destiné à organiser et valoriser des services digitaux.', category: 'Web app', image_url: '', technologies: ['React', 'TypeScript'], live_url: '', github_url: '', featured: true, published: true },
  { id: 'p3', title: 'Application mobile', description: 'Prototype d’application mobile avec authentification et espace utilisateur.', category: 'Mobile', image_url: '', technologies: ['Flutter', 'Dart', 'Firebase'], live_url: '', github_url: '', featured: false, published: true },
]

export async function fetchCollection<T>(table: 'skills' | 'services' | 'projects', fallback: T[]): Promise<T[]> {
  if (!supabase) return fallback
  const query = supabase.from(table).select('*')
  const { data, error } = table === 'projects'
    ? await query.order('created_at', { ascending: false })
    : await query.order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as T[]
}

export async function saveRecord(table: 'skills' | 'services' | 'projects', record: Record<string, unknown> & { id?: string }) {
  if (!supabase) throw new Error('Configurez Supabase dans le fichier .env pour activer la sauvegarde en ligne.')
  const payload = { ...record, updated_at: new Date().toISOString() }
  const result = record.id
    ? await supabase.from(table).update(payload).eq('id', record.id).select().single()
    : await supabase.from(table).insert(payload).select().single()
  if (result.error) throw result.error
  return result.data
}

export async function deleteRecord(table: 'skills' | 'services' | 'projects', id: string) {
  if (!supabase) throw new Error('Configurez Supabase dans le fichier .env.')
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
