# Portfolio Colomb Amani

Portfolio React + TypeScript, animé avec Framer Motion, palette noir / orange / bleu, avec espace public et dashboard d'administration.

## Prérequis
- Node.js 22.12+ recommandé
- npm
- Un projet Supabase pour activer l'authentification et la persistance en ligne.

## Lancer localement
1. Décompressez le projet et ouvrez le dossier dans VS Code.
2. Dans le terminal :
   ```bash
   npm install
   ```
3. Copiez `.env.example` vers `.env` et renseignez les paramètres.
4. Lancez :
   ```bash
   npm run dev
   ```
5. Ouvrez l'adresse indiquée (par défaut http://localhost:5173).

## Configurer Supabase (important)
1. Créez un projet dans Supabase.
2. Ouvrez SQL Editor et exécutez `supabase/schema.sql`.
   Pour une base déjà installée, exécutez `supabase/creative_works_migration.sql` afin d'ajouter la table, les droits de stockage des images et vidéos et le défilement des réalisations.
3. Dans Authentication > Users, créez votre utilisateur administrateur.
4. Dans SQL Editor, exécutez ensuite la commande ci-dessous en remplaçant l'e-mail :
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'votre-email@example.com';
   ```
5. Copiez l'URL du projet et la clé **publishable/anon** dans `.env`.
6. Ne mettez JAMAIS la clé `service_role` dans le frontend.

Sans variables Supabase, le portfolio public utilise des données de démonstration. L'administration exige Supabase configuré et un compte inscrit dans `admin_users`.

## Fonctionnalités
- Page publique responsive avec sections profil, compétences, services, projets, contact.
- Dashboard protégé par Supabase Auth et contrôle de rôle `admin_users`.
- CRUD des compétences, services, projets et réalisations graphiques/vidéo.
- Formulaire de contact stocké en base.
- Réseaux sociaux et contacts configurables dans `.env`.
- Animations réduites automatiquement si l'utilisateur le demande dans son système.

## Avant la mise en production
- Remplacez les exemples et liens par vos informations réelles.
- Configurez un captcha ou une protection anti-spam pour le formulaire.
- Configurez un domaine, les métadonnées SEO et les politiques de sauvegarde.
- Testez les politiques RLS avec un compte visiteur et un compte admin.
