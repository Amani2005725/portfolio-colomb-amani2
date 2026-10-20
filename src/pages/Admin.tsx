
import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Boxes, Code2, Eye, FolderKanban, LayoutDashboard,
  LogOut, Plus, Save, Trash2, X, BriefcaseBusiness, AlertCircle,
  Inbox, Check, UserRound, ImagePlus, Camera, Film
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  deleteRecord, fetchCollection, saveRecord, demoProjects, demoServices,
  demoSkills, type Project, type Service, type Skill, type CreativeWork
} from '../lib/data'

type Kind = 'skills' | 'services' | 'projects' | 'creative_works'
type Section = Kind | 'overview' | 'messages' | 'profile'
type AnyRecord = Skill | Service | Project | CreativeWork

const menu: { id: Section; label: string; icon: typeof Code2 }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'skills', label: 'Compétences', icon: Code2 },
  { id: 'services', label: 'Services', icon: BriefcaseBusiness },
  { id: 'projects', label: 'Projets', icon: FolderKanban },
  { id: 'creative_works', label: 'Réalisations graphiques & vidéos', icon: Film },
  { id: 'messages', label: 'Messages', icon: Inbox },
  { id: 'profile', label: 'Profil', icon: UserRound },
]

const emptyFor = (kind: Kind): Record<string, any> =>
  kind === 'skills'
    ? { name: '', category: 'Développement web', description: '', level: 70, icon: 'Code2', published: true, sort_order: 0 }
    : kind === 'services'
      ? { title: '', description: '', icon: 'Layers', published: true, sort_order: 0 }
    : kind === 'projects' ? {
          title: '', description: '', category: 'Web app',
          image_url: '', image_urls: [], technologies: [],
          live_url: '', github_url: '', featured: false, published: true
        } : { title: '', description: '', media_url: '', media_type: 'image', category: 'Graphisme', published: true, sort_order: 0 }

const labelFor = (kind: Kind) =>
  kind === 'skills' ? 'compétence' : kind === 'services' ? 'service' : kind === 'creative_works' ? 'réalisation' : 'projet'

function safeFileName(name: string) {
  return name.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
}

async function uploadImage(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.')

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeFileName(file.name)}`

  const { error } = await supabase.storage
    .from('portfolio-images')
    .upload(path, file, {
      upsert: false,
      contentType: file.type || 'image/jpeg'
    })

  if (error) throw error

  return supabase.storage
    .from('portfolio-images')
    .getPublicUrl(path).data.publicUrl
}

export default function Admin() {
  const navigate = useNavigate()

  const [user, setUser] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [section, setSection] = useState<Section>('overview')

  const [skills, setSkills] = useState<Skill[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [creativeWorks, setCreativeWorks] = useState<CreativeWork[]>([])
  const [messages, setMessages] = useState<any[]>([])

  const [editKind, setEditKind] = useState<Kind | null>(null)
  const [editRecord, setEditRecord] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  // Profil administrateur
  const [profileName, setProfileName] = useState('Colomb Amani')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Images des projets : 5 maximum
  const [projectFiles, setProjectFiles] = useState<File[]>([])
  const [projectPreviews, setProjectPreviews] = useState<string[]>([])
  const [projectImageUrls, setProjectImageUrls] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState('')

  async function loadData() {
    if (!supabase) {
      setSkills(demoSkills)
      setServices(demoServices)
      setProjects(demoProjects)
      setCreativeWorks([])
      return
    }

    try {
      const [s, v, p, cw, m, profile] = await Promise.all([
        fetchCollection<Skill>('skills', []),
        fetchCollection<Service>('services', []),
        fetchCollection<Project>('projects', []),
        fetchCollection<CreativeWork>('creative_works', []),
        supabase.from('contact_messages')
          .select('*').order('created_at', { ascending: false }),
        supabase.from('admin_profile')
          .select('*').eq('id', 1).maybeSingle(),
      ])

      if (profile.error) throw profile.error

      setSkills(s)
      setServices(v)
      setProjects(p)
      setCreativeWorks(cw)
      setMessages(m.data ?? [])

      if (profile.data) {
        setProfileName(profile.data.full_name || 'Colomb Amani')
        setProfilePhotoUrl(profile.data.photo_url || '')
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Erreur de chargement')
    }
  }

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user.email ?? null)
      setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user.email ?? null)
        setAuthReady(true)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) void loadData()
  }, [user])

  async function signIn(e: FormEvent) {
    e.preventDefault()
    setAuthError('')

    if (!supabase) {
      setAuthError('Supabase n’est pas configuré. Suis les étapes du README.md pour activer un compte administrateur.')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError(error.message)
    } else {
      const { data: admin, error: adminError } = await supabase
        .from('admin_users').select('user_id').maybeSingle()

      if (adminError || !admin) {
        await supabase.auth.signOut()
        setAuthError('Ce compte ne possède pas le rôle administrateur. Ajoute-le dans admin_users via Supabase.')
      }
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

  function records(kind: Kind): AnyRecord[] {
    return kind === 'skills' ? skills : kind === 'services' ? services : kind === 'projects' ? projects : creativeWorks
  }

  function updateList(kind: Kind, list: AnyRecord[]) {
    if (kind === 'skills') setSkills(list as Skill[])
    else if (kind === 'services') setServices(list as Service[])
    else if (kind === 'projects') setProjects(list as Project[])
    else setCreativeWorks(list as CreativeWork[])
  }

  function clearProjectFiles() {
    projectPreviews.forEach(url => URL.revokeObjectURL(url))
    setProjectFiles([])
    setProjectPreviews([])
  }

  function startCreate(kind: Kind) {
    clearProjectFiles()
    setProjectImageUrls([])
    setMediaFile(null); setMediaPreview('')
    setEditKind(kind)
    setEditRecord(emptyFor(kind))
  }

  function startEdit(kind: Kind, record: AnyRecord) {
    clearProjectFiles()

    const data: Record<string, any> = { ...record }

    if (kind === 'projects') {
      const project = record as Project
      const urls = (
        project.image_urls?.length
          ? project.image_urls
          : project.image_url ? [project.image_url] : []
      ).slice(0, 5)

      setProjectImageUrls(urls)
      data.image_urls = urls
      data.image_url = urls[0] || ''
      data.technologies = project.technologies.join(', ')
    }
    if (kind === 'creative_works') { setMediaFile(null); setMediaPreview((record as CreativeWork).media_url) }

    setEditKind(kind)
    setEditRecord(data)
  }

  function chooseCreativeMedia(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { setNotice('Choisis une image ou une vidéo valide.'); return }
    if (mediaPreview.startsWith('blob:')) URL.revokeObjectURL(mediaPreview)
    setMediaFile(file); setMediaPreview(URL.createObjectURL(file))
    setEditRecord(current => ({ ...current, media_type: file.type.startsWith('video/') ? 'video' : 'image' }))
  }

  // Ouvrir la galerie et choisir les images du projet
  function chooseProjectImages(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''

    if (!selected.length) return

    const available = 5 - projectImageUrls.length - projectFiles.length

    if (available <= 0) {
      setNotice('Un projet peut contenir au maximum 5 images.')
      return
    }

    const accepted = selected
      .filter(file => file.type.startsWith('image/'))
      .slice(0, available)

    if (!accepted.length) {
      setNotice('Choisis un fichier image valide.')
      return
    }

    if (selected.length > available) {
      setNotice('Maximum 5 images par projet. Seules les images restantes ont été ajoutées.')
    }

    setProjectFiles(current => [...current, ...accepted])
    setProjectPreviews(current => [
      ...current,
      ...accepted.map(file => URL.createObjectURL(file))
    ])
  }

  function removeExistingProjectImage(index: number) {
    setProjectImageUrls(current => current.filter((_, i) => i !== index))
  }

  function removeNewProjectImage(index: number) {
    const preview = projectPreviews[index]
    if (preview) URL.revokeObjectURL(preview)

    setProjectFiles(current => current.filter((_, i) => i !== index))
    setProjectPreviews(current => current.filter((_, i) => i !== index))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!editKind) return

    setSaving(true)
    setNotice('')

    try {
      const payload: Record<string, any> = { ...editRecord }

      if (editKind === 'projects') {
        const urls = [...projectImageUrls]

        for (const file of projectFiles) {
          if (urls.length >= 5) break
          urls.push(await uploadImage(file, 'projects'))
        }

        payload.image_urls = urls.slice(0, 5)
        payload.image_url = payload.image_urls[0] || ''
        payload.technologies = String(payload.technologies || '')
          .split(',')
          .map((x: string) => x.trim())
          .filter(Boolean)
      }
      if (editKind === 'creative_works' && mediaFile) {
        payload.media_url = await uploadImage(mediaFile, 'creative-works')
        payload.media_type = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      }
      if (editKind === 'creative_works' && !payload.media_url) throw new Error('Ajoute une image ou une vidéo avant d’enregistrer.')

      const saved = await saveRecord(editKind, payload) as AnyRecord

      updateList(
        editKind,
        editRecord.id
          ? records(editKind).map(x => x.id === saved.id ? saved : x)
          : [saved, ...records(editKind)]
      )

      setEditKind(null)
      clearProjectFiles()
      if (mediaPreview.startsWith('blob:')) URL.revokeObjectURL(mediaPreview)
      setMediaPreview(''); setMediaFile(null)
      setNotice(`${labelFor(editKind)} enregistré avec succès.`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Impossible de sauvegarder.')
    } finally {
      setSaving(false)
    }
  }

  // Enregistrer la photo et les informations du profil
  async function saveProfile(e: FormEvent) {
    e.preventDefault()

    if (!supabase) {
      setNotice('Supabase doit être configuré pour enregistrer la photo de profil.')
      return
    }

    setProfileSaving(true)
    setNotice('')

    try {
      let photoUrl = profilePhotoUrl

      if (profileFile) {
        photoUrl = await uploadImage(profileFile, 'profile')
      }

      const { error } = await supabase
        .from('admin_profile')
        .upsert({
          id: 1,
          full_name: profileName.trim() || 'Colomb Amani',
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (error) throw error

      setProfilePhotoUrl(photoUrl)
      setProfileFile(null)

      if (profilePreview) URL.revokeObjectURL(profilePreview)
      setProfilePreview('')

      setNotice('Profil enregistré avec succès.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Impossible d’enregistrer le profil.')
    } finally {
      setProfileSaving(false)
    }
  }

  // Ouvrir la galerie pour la photo de profil
  function chooseProfileImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setNotice('Choisis un fichier image valide.')
      return
    }

    if (profilePreview) URL.revokeObjectURL(profilePreview)

    setProfileFile(file)
    setProfilePreview(URL.createObjectURL(file))
  }

  async function remove(kind: Kind, record: AnyRecord) {
    if (!confirm(`Supprimer définitivement ${'name' in record ? record.name : record.title} ?`)) return

    try {
      await deleteRecord(kind, record.id)
      updateList(kind, records(kind).filter(x => x.id !== record.id))
      setNotice('Élément supprimé.')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Suppression impossible.')
    }
  }

  async function toggleMessage(id: string, is_read: boolean) {
    if (!supabase) return

    const { error } = await supabase
      .from('contact_messages').update({ is_read }).eq('id', id)

    if (!error) {
      setMessages(messages.map(m => m.id === id ? { ...m, is_read } : m))
    }
  }

  if (!authReady) {
    return <div className="admin-loading">Chargement de l’administration…</div>
  }

  if (!user) {
    return (
      <div className="login-screen">
        <Link to="/" className="login-back">
          <ArrowLeft size={17} /> Retour au portfolio
        </Link>

        <div className="login-card">
          <div className="brand-mark login-mark">C<span>.</span></div>
          <span className="eyebrow">ESPACE PRIVÉ</span>
          <h1>Content <em>Control.</em></h1>
          <p>Connecte-toi pour gérer ton portfolio, tes projets et tes compétences.</p>

          {!isSupabaseConfigured && (
            <div className="notice warning">
              <AlertCircle size={17} /> Supabase doit être configuré avant la connexion.
            </div>
          )}

          <form onSubmit={signIn}>
            <label>
              Adresse e-mail
              <input type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@exemple.com" />
            </label>

            <label>
              Mot de passe
              <input type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ton mot de passe" />
            </label>

            {authError && <div className="form-error">{authError}</div>}

            <button className="button button-primary submit-button">
              Se connecter <ArrowLeft className="login-arrow" size={17} />
            </button>
          </form>

          <small className="login-hint">
            Crée ton utilisateur dans Supabase Auth puis autorise son ID dans admin_users.
            Aucun mot de passe par défaut.
          </small>
        </div>
      </div>
    )
  }

  const currentMenuLabel = menu.find(x => x.id === section)?.label || 'Profil'
  const currentProfileImage = profilePreview || profilePhotoUrl

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">C<span>.</span></span>
          <span>COLOMB<span className="brand-muted"> / ADMIN</span></span>
        </Link>

        <div className="admin-profile">
          {profilePhotoUrl
            ? <img src={profilePhotoUrl} alt="Photo de profil"
                className="admin-avatar" style={{ objectFit: 'cover' }} />
            : <div className="admin-avatar">CA</div>}
          <div>
            <strong>{profileName || 'Colomb Amani'}</strong>
            <small>Administrateur</small>
          </div>
          <span className="admin-online" />
        </div>

        <span className="admin-nav-label">ESPACE DE TRAVAIL</span>

        <nav>
          {menu.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id}
                className={section === item.id ? 'admin-nav active' : 'admin-nav'}
                onClick={() => setSection(item.id)}>
                <Icon size={18} />
                {item.label}
                {item.id === 'messages' && messages.filter(m => !m.is_read).length > 0 &&
                  <span className="nav-count">{messages.filter(m => !m.is_read).length}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span><Boxes size={18} /></span>
            <strong>Ton espace créatif</strong>
            <p>Gère ton contenu et fais évoluer ton portfolio.</p>
          </div>
          <button className="admin-nav" onClick={() => navigate('/')}>
            <Eye size={18} /> Voir le site
          </button>
          <button className="admin-nav logout" onClick={signOut}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">Workspace / <b>{currentMenuLabel}</b></span>
            <h1>
              {section === 'overview' ? 'Vue d’ensemble'
                : section === 'messages' ? 'Messages reçus'
                : section === 'profile' ? 'Mon profil'
                : `Gestion des ${section === 'skills' ? 'compétences' : section === 'services' ? 'services' : 'projets'}`}
            </h1>
          </div>

          <div className="admin-top-actions">
            <span className="admin-status"><span /> En ligne</span>
            <button className="admin-view-button" onClick={() => navigate('/')}>
              <Eye size={16} /> Voir le site
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice">
            <Check size={16} />{notice}
            <button onClick={() => setNotice('')}><X size={15} /></button>
          </div>
        )}

        {section === 'overview' && <>
          <div className="welcome-panel">
            <div>
              <span className="eyebrow">TON ESPACE DE CONTRÔLE</span>
              <h2>Salut Colomb <span>✳</span></h2>
              <p>Prêt à faire évoluer ton univers digital ? Voici un aperçu de ton contenu.</p>
            </div>
            <div className="welcome-symbol">C<span>.</span></div>
          </div>

          <div className="dashboard-stats">
            <Stat icon={Code2} label="Compétences" value={skills.length} detail="Éléments enregistrés" />
            <Stat icon={BriefcaseBusiness} label="Services" value={services.length} detail="Offres configurées" />
            <Stat icon={FolderKanban} label="Projets" value={projects.length} detail="Réalisations enregistrées" />
            <Stat icon={Film} label="Graphisme & vidéo" value={creativeWorks.length} detail="Médias enregistrés" />
            <Stat icon={Inbox} label="Messages non lus" value={messages.filter(m => !m.is_read).length} detail="Demandes à consulter" />
          </div>

          <div className="admin-content-card">
            <div className="card-title-row">
              <div><h2>Actions rapides</h2><p>Ajoute rapidement du nouveau contenu à ton portfolio.</p></div>
            </div>
            <div className="quick-actions">
              <button onClick={() => { setSection('skills'); startCreate('skills') }}>
                <Plus size={18} /><span><strong>Ajouter une compétence</strong><small>Enrichir ton profil technique</small></span>
              </button>
              <button onClick={() => { setSection('projects'); startCreate('projects') }}>
                <Plus size={18} /><span><strong>Ajouter un projet</strong><small>Présenter une réalisation</small></span>
              </button>
              <button onClick={() => { setSection('services'); startCreate('services') }}>
                <Plus size={18} /><span><strong>Ajouter un service</strong><small>Présenter une offre</small></span>
              </button>
              <button onClick={() => { setSection('creative_works'); startCreate('creative_works') }}>
                <Plus size={18} /><span><strong>Ajouter une réalisation</strong><small>Affiche, graphisme ou montage vidéo</small></span>
              </button>
            </div>
          </div>

          <div className="admin-content-card">
            <div className="card-title-row">
              <div><h2>Derniers projets</h2><p>Les projets actuellement enregistrés.</p></div>
              <button className="small-link" onClick={() => setSection('projects')}>
                Tout voir <ArrowLeft size={14} />
              </button>
            </div>
            <RecordList kind="projects" items={projects.slice(0, 3)} onEdit={startEdit} onDelete={remove} />
          </div>
        </>}

        {(section === 'skills' || section === 'services' || section === 'projects' || section === 'creative_works') && (
          <div className="admin-content-card">
            <div className="card-title-row">
              <div>
                <h2>{records(section).length} élément(s)</h2>
                <p>Les modifications enregistrées sont synchronisées avec le site public.</p>
              </div>
              <button className="button button-primary admin-add" onClick={() => startCreate(section)}>
                <Plus size={17} /> Ajouter
              </button>
            </div>
            <RecordList kind={section} items={records(section)} onEdit={startEdit} onDelete={remove} />
          </div>
        )}

        {section === 'profile' && (
          <div className="admin-content-card">
            <div className="card-title-row">
              <div>
                <h2>Photo de profil</h2>
                <p>Choisis une image dans la galerie de ton appareil puis enregistre les modifications.</p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="profile-edit-form">
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
                {currentProfileImage
                  ? <img src={currentProfileImage} alt="Aperçu de la photo de profil"
                      style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div className="admin-avatar"
                      style={{ width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 30 }}>CA</div>}

                <div>
                  <label htmlFor="profile-photo-input"
                    className="button button-ghost"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <Camera size={17} /> Choisir une photo
                  </label>
                  <input id="profile-photo-input" type="file" accept="image/*"
                    onChange={chooseProfileImage} style={{ display: 'none' }} />
                  <p style={{ marginTop: 8 }}>Sélectionne une image puis clique sur Enregistrer.</p>
                </div>
              </div>

              <label>Nom affiché
                <input value={profileName} onChange={e => setProfileName(e.target.value)}
                  placeholder="Colomb Amani" />
              </label>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button className="button button-primary" disabled={profileSaving}>
                  <Save size={16} />
                  {profileSaving ? 'Enregistrement…' : 'Enregistrer le profil'}
                </button>
              </div>
            </form>
          </div>
        )}

        {section === 'messages' && (
          <div className="admin-content-card">
            <div className="card-title-row">
              <div><h2>Boîte de réception</h2><p>Messages envoyés depuis le formulaire public.</p></div>
            </div>

            {messages.length === 0
              ? <div className="empty-state"><Inbox size={30} /><h3>Aucun message pour le moment</h3><p>Les demandes envoyées via le formulaire apparaîtront ici.</p></div>
              : <div className="message-list">{messages.map(m => (
                  <article className={m.is_read ? 'message-item' : 'message-item unread'} key={m.id}>
                    <div className="message-avatar">{m.name?.slice(0, 1).toUpperCase()}</div>
                    <div className="message-body">
                      <div className="message-heading">
                        <strong>{m.name}</strong>
                        <span>{new Date(m.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                      <a href={`mailto:${m.email}`}>{m.email}</a>
                      <p>{m.message}</p>
                      <div className="message-actions">
                        <button onClick={() => toggleMessage(m.id, !m.is_read)}>
                          {m.is_read ? 'Marquer non lu' : 'Marquer comme lu'}
                        </button>
                        <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: votre demande de projet')}`}>
                          Répondre par e-mail ↗
                        </a>
                      </div>
                    </div>
                  </article>
                ))}</div>}
          </div>
        )}
      </main>

      {editKind && (
        <div className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setEditKind(null)
              clearProjectFiles()
            }
          }}>
          <form className="edit-modal" onSubmit={save}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">ÉDITION DE CONTENU</span>
                <h2>{editRecord.id ? 'Modifier' : 'Ajouter'} {labelFor(editKind)}</h2>
              </div>
              <button type="button" className="icon-button"
                onClick={() => { setEditKind(null); clearProjectFiles() }}>
                <X />
              </button>
            </div>

            {editKind === 'skills' && <>
              <Field label="Nom" value={editRecord.name || ''} onChange={v => setEditRecord({ ...editRecord, name: v })} required />
              <Field label="Catégorie" value={editRecord.category || ''} onChange={v => setEditRecord({ ...editRecord, category: v })} required />
              <Field label="Description" value={editRecord.description || ''} onChange={v => setEditRecord({ ...editRecord, description: v })} />
              <Field label="Icône (Code2, Atom, Smartphone, Database…)" value={editRecord.icon || 'Code2'} onChange={v => setEditRecord({ ...editRecord, icon: v })} />
              <label>Niveau indicatif : {editRecord.level}%
                <input type="range" min="0" max="100" value={editRecord.level ?? 70}
                  onChange={e => setEditRecord({ ...editRecord, level: Number(e.target.value) })} />
              </label>
            </>}

            {editKind === 'services' && <>
              <Field label="Titre" value={editRecord.title || ''} onChange={v => setEditRecord({ ...editRecord, title: v })} required />
              <Field label="Description" value={editRecord.description || ''} onChange={v => setEditRecord({ ...editRecord, description: v })} required />
              <Field label="Icône (Globe, Layers, Smartphone…)" value={editRecord.icon || 'Layers'} onChange={v => setEditRecord({ ...editRecord, icon: v })} />
            </>}

            {editKind === 'projects' && <>
              <Field label="Nom du projet" value={editRecord.title || ''} onChange={v => setEditRecord({ ...editRecord, title: v })} required />
              <Field label="Catégorie" value={editRecord.category || ''} onChange={v => setEditRecord({ ...editRecord, category: v })} />
              <Field label="Description" value={editRecord.description || ''} onChange={v => setEditRecord({ ...editRecord, description: v })} required />

              <div style={{ margin: '14px 0' }}>
                <label htmlFor="project-images-input"
                  className="button button-ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <ImagePlus size={17} /> Ajouter des images depuis la galerie
                </label>

                <input id="project-images-input" type="file" accept="image/*" multiple
                  onChange={chooseProjectImages}
                  disabled={projectImageUrls.length + projectFiles.length >= 5}
                  style={{ display: 'none' }} />

                <p style={{ marginTop: 8 }}>
                  {projectImageUrls.length + projectFiles.length}/5 images sélectionnées (maximum 5).
                </p>

                {(projectImageUrls.length > 0 || projectPreviews.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, marginTop: 12 }}>
                    {projectImageUrls.map((url, index) => (
                      <div key={`saved-${url}-${index}`} style={{ position: 'relative' }}>
                        <img src={url} alt={`Image du projet ${index + 1}`}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }} />
                        <button type="button" title="Retirer cette image"
                          onClick={() => removeExistingProjectImage(index)}
                          style={{ position: 'absolute', top: 4, right: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {projectPreviews.map((url, index) => (
                      <div key={`new-${url}`} style={{ position: 'relative' }}>
                        <img src={url} alt={`Nouvelle image ${index + 1}`}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }} />
                        <button type="button" title="Retirer cette image"
                          onClick={() => removeNewProjectImage(index)}
                          style={{ position: 'absolute', top: 4, right: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Technologies séparées par des virgules"
                value={editRecord.technologies || ''}
                onChange={v => setEditRecord({ ...editRecord, technologies: v })} />
              <Field label="Lien de démonstration" value={editRecord.live_url || ''} onChange={v => setEditRecord({ ...editRecord, live_url: v })} />
              <Field label="Lien GitHub" value={editRecord.github_url || ''} onChange={v => setEditRecord({ ...editRecord, github_url: v })} />

              <label className="checkbox-label">
                <input type="checkbox" checked={!!editRecord.featured}
                  onChange={e => setEditRecord({ ...editRecord, featured: e.target.checked })} />
                Mettre en avant
              </label>
            </>}

            {editKind === 'creative_works' && <>
              <Field label="Titre de la réalisation" value={editRecord.title || ''} onChange={v => setEditRecord({ ...editRecord, title: v })} required />
              <Field label="Type de réalisation (Graphisme, Affiche, Montage vidéo…)" value={editRecord.category || ''} onChange={v => setEditRecord({ ...editRecord, category: v })} required />
              <Field label="Description" value={editRecord.description || ''} onChange={v => setEditRecord({ ...editRecord, description: v })} />
              <div style={{ margin: '14px 0' }}>
                <label htmlFor="creative-media-input" className="button button-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <ImagePlus size={17} /> Choisir une image ou une vidéo
                </label>
                <input id="creative-media-input" type="file" accept="image/*,video/*" onChange={chooseCreativeMedia} style={{ display: 'none' }} />
                {mediaPreview && (editRecord.media_type === 'video'
                  ? <video src={mediaPreview} controls style={{ display: 'block', width: '100%', maxHeight: 240, marginTop: 12, borderRadius: 10 }} />
                  : <img src={mediaPreview} alt="Aperçu de la réalisation" style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain', marginTop: 12, borderRadius: 10 }} />)}
                <p style={{ marginTop: 8 }}>Les images et vidéos seront affichées dans le défilement public.</p>
              </div>
            </>}

            <label className="checkbox-label">
              <input type="checkbox" checked={!!editRecord.published}
                onChange={e => setEditRecord({ ...editRecord, published: e.target.checked })} />
              Publié sur le site public
            </label>

            <div className="modal-actions">
              <button type="button" className="button button-ghost"
                onClick={() => { setEditKind(null); clearProjectFiles() }}>
                Annuler
              </button>
              <button className="button button-primary" disabled={saving}>
                <Save size={16} />{saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, detail }: {
  icon: typeof Code2
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon"><Icon size={19} /></span>
      <span className="stat-label">{label}</span>
      <strong>{value.toString().padStart(2, '0')}</strong>
      <small>{detail}</small>
    </div>
  )
}

function Field({ label, value, onChange, required = false }: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <label>{label}
      <input required={required} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function RecordList({ kind, items, onEdit, onDelete }: {
  kind: Kind
  items: AnyRecord[]
  onEdit: (kind: Kind, item: AnyRecord) => void
  onDelete: (kind: Kind, item: AnyRecord) => void
}) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <Boxes size={30} /><h3>Aucun contenu</h3>
        <p>Ajoute ton premier élément pour commencer.</p>
      </div>
    )
  }

  return (
    <div className="record-list">
      {items.map(item => {
        const title = 'name' in item ? item.name : item.title

        return (
          <div className="record-row" key={item.id}>
            <div className="record-symbol">
              {kind === 'skills' ? <Code2 size={18} />
                : kind === 'services' ? <BriefcaseBusiness size={18} />
                : kind === 'creative_works' ? <Film size={18} /> : <FolderKanban size={18} />}
            </div>
            <div className="record-main">
              <strong>{title}</strong>
              <small>{'category' in item ? item.category : 'Contenu du portfolio'}</small>
            </div>
            <span className={item.published ? 'publish-status published' : 'publish-status'}>
              <span />{item.published ? 'Publié' : 'Brouillon'}
            </span>
            <div className="record-actions">
              <button title="Modifier" onClick={() => onEdit(kind, item)}><Save size={16} /></button>
              <button title="Supprimer" onClick={() => onDelete(kind, item)}><Trash2 size={16} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
