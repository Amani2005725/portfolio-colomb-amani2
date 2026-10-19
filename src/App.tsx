import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Atom, Check, ChevronDown,
  Code2, Database, ExternalLink, Github, Globe, Layers, Linkedin, Mail, Menu,
  MessageCircle, MousePointer2, Send, Smartphone, Sparkles, Terminal, Workflow, X
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { demoProjects, demoServices, demoSkills, fetchCollection, type Project, type Service, type Skill } from './lib/data'
import Admin from './pages/Admin'

const icons: Record<string, typeof Code2> = { Code2, Atom, Smartphone, Database, Globe, Layers, Workflow, Terminal }
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'amanicolomb8@gmail.com'
const phone = import.meta.env.VITE_CONTACT_PHONE || '2250712211053'
const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '2250544153459'
const social = {
  facebook: import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/',
  linkedin: import.meta.env.VITE_LINKEDIN_URL || 'https://linkedin.com/',
  github: import.meta.env.VITE_GITHUB_URL || 'https://github.com/',
}
const reveal = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65 } } }

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Header() {
  const [open, setOpen] = useState(false)
  const links = [['À propos', '#about'], ['Compétences', '#skills'], ['Services', '#services'], ['Projets', '#projects'], ['Contact', '#contact']]
  return <header className="site-header">
    <a className="brand" href="/#home" aria-label="Retour à l'accueil"><span className="brand-mark">CA<span>.</span></span><span>COLOMB AMANI<span className="brand-muted"> / DEV</span></span></a>
    <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Ouvrir le menu">{open ? <X /> : <Menu />}</button>
    <nav className={open ? 'nav-links nav-open' : 'nav-links'}>
      {links.map(([label, href]) => <a key={href} href={`/${href}`} onClick={() => setOpen(false)}>{label}</a>)}
      <a className="nav-cta" href="/#contact">Parlons projet <ArrowUpRight size={16}/></a>
    </nav>
  </header>
}

function SectionHeading({ eyebrow, title, accent }: { eyebrow: string; title: string; accent?: string }) {
  return <motion.div className="section-heading" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .25 }}>
    <span className="eyebrow"><span className="eyebrow-dot"/>{eyebrow}</span>
    <h2>{title} {accent && <em>{accent}</em>}</h2>
  </motion.div>
}

function Home() {
  const reduceMotion = useReducedMotion()
  const [skills, setSkills] = useState<Skill[]>(demoSkills)
  const [services, setServices] = useState<Service[]>(demoServices)
  const [projects, setProjects] = useState<Project[]>(demoProjects)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', project_type: 'Site web', phone: '', message: '' })

  useEffect(() => {
    Promise.all([
      fetchCollection<Skill>('skills', demoSkills),
      fetchCollection<Service>('services', demoServices),
      fetchCollection<Project>('projects', demoProjects),
    ]).then(([a, b, c]) => { setSkills(a.filter(x => x.published)); setServices(b.filter(x => x.published)); setProjects(c.filter(x => x.published)) })
      .catch(() => { /* Keep demo content visible if the network is unavailable. */ })
  }, [])

  async function submitContact(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setError('')
    try {
      if (!supabase) throw new Error('Le formulaire en ligne sera actif après la configuration de Supabase. Vous pouvez me contacter par WhatsApp ou e-mail.')
      const { error: insertError } = await supabase.from('contact_messages').insert({ ...form, budget: '' })
      if (insertError) throw insertError
      setSent(true); setForm({ name: '', email: '', project_type: 'Site web', phone: '', message: '' })
    } catch (err) { setError(err instanceof Error ? err.message : 'Une erreur est survenue.') }
    finally { setSending(false) }
  }

  return <div id="home">
    <Header />
    <main>
      <section className="hero container">
        <div className="hero-grid" aria-hidden="true"/>
        <div className="hero-glow glow-orange" aria-hidden="true"/>
        <div className="hero-glow glow-blue" aria-hidden="true"/>
        <motion.div className="hero-content" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .12 } } }}>
          <motion.div variants={reveal} className="availability"><span className="pulse-dot"/> Disponible pour de nouveaux projets <span className="availability-arrow">↗</span></motion.div>
          <motion.p variants={reveal} className="hero-kicker">DÉVELOPPEUR WEB & MOBILE · CRÉATEUR DIGITAL</motion.p>
          <motion.h1 variants={reveal}>Je transforme<br/>les idées en <span className="gradient-text">expériences</span><br/><span className="outline-text">digitales.</span></motion.h1>
          <motion.p variants={reveal} className="hero-description">Moi, c’est Colomb Amani. Je conçois des produits numériques utiles, des applications modernes et des expériences pensées pour les humains.</motion.p>
          <motion.div variants={reveal} className="hero-actions">
            <a className="button button-primary" href="#projects">Explorer mes projets <ArrowUpRight size={18}/></a>
            <a className="button button-ghost" href="#contact"><span className="play-icon"><ArrowDownRight size={17}/></span> Démarrer une discussion</a>
          </motion.div>
          <motion.div variants={reveal} className="hero-meta"><span><span className="meta-line"/>Basé en Côte d’Ivoire</span><span>Disponible à l’international</span></motion.div>
        </motion.div>
        

{/* PHOTO DE PROFIL AVEC ANIMATION */}
<motion.div
  className="hero-art"
  initial={{ opacity: 0, scale: 0.88, rotate: 3 }}
  animate={{ opacity: 1, scale: 1, rotate: 0 }}
  transition={{ duration: 0.9, delay: 0.25 }}
>
  {/* Cercles décoratifs autour de la photo */}
  <div className="orbit orbit-one" />
  <div className="orbit orbit-two" />
  <div className="orbit orbit-three" />

  {/* Conteneur rond de la photo */}
  <div className="profile-photo-container">
    <img
      src="/photo-profil.jpeg"
      alt="Photo de profil de Colomb Amani"
      className="profile-photo"
    />
  </div>

  {/* Étiquette : programmation */}
  <div className="floating-chip chip-code">
    <Code2 size={16} />
    <span>Clean code</span>
  </div>

  {/* Étiquette : animation et interface */}
  <div className="floating-chip chip-motion">
    <Sparkles size={16} />
    <span>Motion & UI</span>
  </div>

  {/* Étiquette : développement */}
  <div className="floating-chip chip-stack">
    <Terminal size={16} />
    <span>Full-stack </span>
  </div>

  {/* Numéro décoratif */}
  <div className="art-index">
    01 <span>/ 04</span>
  </div>
</motion.div>

        <a className="scroll-cue" href="#about"><span className="scroll-icon"><ArrowDown size={16}/></span> SCROLL TO EXPLORE</a>
      </section>
         
      <section className="marquee" aria-label="Technologies"><div className="marquee-track">
        {['JAVASCRIPT','REACT','FLUTTER','SUPABASE','TYPESCRIPT','UI / UX','DIGITAL PRODUCTS','LARAVEL','POSTGRESQL',
        'FIREBASE','NODE JS','TAILWIND CSS','DJANGO','WORDPRESS','WINDEV','PYTHON'].map((x,i)=>
        <span key={i}>{x}<i>✳</i></span>)}</div></section>

      <section id="about" className="section container about-section">
        <SectionHeading eyebrow="01 / À PROPOS" title="Curieux de nature." accent="Créateur par passion."/>
        <div className="about-grid">
          <div className="about-statement"><span className="big-quote">“</span><p>La technologie prend tout son sens quand elle résout un vrai problème.</p><div className="signature">Colomb Amani <span>— Développeur & entrepreneur digital</span></div></div>
          <div className="about-copy"><p>J’aime transformer une idée en un produit numérique concret : comprendre le besoin, imaginer l’expérience, construire la solution et l’améliorer continuellement.</p><p>Mon approche combine développement, sens du détail et vision produit. Je progresse chaque jour pour créer des outils fiables, accessibles et utiles aux entreprises comme aux utilisateurs.</p><a href="#contact" className="text-link">Construisons quelque chose <ArrowUpRight size={16}/></a></div>
        </div>
        <div className="stat-row"><div><strong>01<span>+</span></strong><small>Esprit produit</small></div><div><strong>∞</strong><small>Curiosité & apprentissage</small></div><div><strong>CI<span>.</span></strong><small>Abidjan, Côte d’Ivoire</small></div></div>
      </section>

      <section id="skills" className="section section-dark">
        <div className="container"><SectionHeading eyebrow="02 / COMPÉTENCES" title="Les outils pour" accent="donner vie aux idées."/>
          <div className="skills-grid">{skills.map((skill, i) => { const Icon = icons[skill.icon] || Code2; return <motion.article className="skill-card" key={skill.id} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * .06 }}>
            <div className="skill-top"><span className="icon-tile"><Icon size={21}/></span><span className="skill-number">0{i+1}</span></div><h3>{skill.name}</h3><p>{skill.description}</p><div className="skill-category">{skill.category}</div><div className="skill-meter"><span style={{ width: `${skill.level}%` }}/></div>
          </motion.article> })}</div>
          <p className="fine-print">Les niveaux sont indicatifs et évoluent avec ma pratique. La liste est administrable.</p>
        </div>
      </section>

      <section id="services" className="section container">
        <SectionHeading eyebrow="03 / SERVICES" title="Des idées ambitieuses." accent="Des solutions concrètes."/>
        <div className="services-list">{services.map((service, i) => { const Icon = icons[service.icon] || Layers; return <motion.a href="#contact" className="service-row" key={service.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * .07 }}>
          <span className="service-index">0{i+1}</span><span className="service-icon"><Icon size={23}/></span><div className="service-text"><h3>{service.title}</h3><p>{service.description}</p></div><ArrowUpRight className="service-arrow" size={22}/>
        </motion.a> })}</div>
      </section>

      <section id="projects" className="section projects-section">
        <div className="container"><SectionHeading eyebrow="04 / SÉLECTION DE PROJETS" title="Du concret." accent="Du sens."/>
          <div className="projects-grid">{projects.map((project, i) => <motion.article className={`project-card project-card-${i % 3}`} key={project.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}>
            <div className={`project-visual visual-${i % 3}`}>
              {project.image_url ? <img src={project.image_url} alt={`Aperçu de ${project.title}`} loading="lazy"/> : <div className="project-art"><span className="project-art-orb"/><span className="project-art-grid"/><span className="project-art-label">{project.category.toUpperCase()}</span><span className="project-art-title">{project.title}<b>.</b></span><span className="project-art-code">{"{ build: 'future' }"}</span></div>}
              <span className="project-open"><ArrowUpRight size={20}/></span>
            </div>
            <div className="project-info"><div><span className="project-category">{project.category}</span><h3>{project.title}</h3></div>{project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer" aria-label={`Voir ${project.title}`}><ExternalLink size={18}/></a> : <span className="project-placeholder">Étude de projet</span>}</div>
            <p className="project-description">{project.description}</p><div className="tag-row">{project.technologies.map(t=><span key={t}>{t}</span>)}</div>
          </motion.article>)}</div>
          <p className="fine-print">Certains projets sont présentés comme études ou prototypes. Remplace les contenus de démonstration par tes réalisations publiables.</p>
        </div>
      </section>

      <section className="section container approach-section">
        <SectionHeading eyebrow="05 / MA MÉTHODE" title="Simple dans l'approche." accent="Exigeant sur le résultat."/>
        <div className="approach-grid">{[{n:'01',t:'Comprendre',d:'Clarifier le besoin, les utilisateurs et le résultat attendu.'},{n:'02',t:'Concevoir',d:'Définir une expérience claire, cohérente et facile à utiliser.'},{n:'03',t:'Construire',d:'Développer une solution propre, testable et évolutive.'},{n:'04',t:'Améliorer',d:'Mesurer, apprendre et faire évoluer le produit.'}].map((item,i)=><motion.div className="approach-item" key={item.n} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay:i*.07}}><span>{item.n}</span><h3>{item.t}</h3><p>{item.d}</p></motion.div>)}</div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container contact-grid"><div className="contact-copy"><span className="eyebrow"><span className="eyebrow-dot"/>06 / CONTACT</span><h2>Et si on créait<br/>quelque chose de<br/><em>remarquable ?</em></h2><p>Parle-moi de ton idée. Même si elle n’est pas encore complètement définie, on peut commencer par une conversation.</p>
          <div className="contact-methods"><a href={`mailto:${contactEmail}`}><span><Mail size={18}/></span><div><small>ÉCRIS-MOI</small><strong>{contactEmail}</strong></div><ArrowUpRight size={17}/></a><a href={`tel:+${phone.replace(/\D/g,'')}`}><span><Smartphone size={18}/></span><div><small>APPEL DIRECT</small><strong>+{phone.replace(/\D/g,'')}</strong></div><ArrowUpRight size={17}/></a><a href={`https://wa.me/${whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Bonjour Colomb, je souhaite discuter d’un projet.')}`} target="_blank" rel="noreferrer"><span><MessageCircle size={18}/></span><div><small>WHATSAPP</small><strong>Discutons directement</strong></div><ArrowUpRight size={17}/></a></div>
          <div className="social-links"><a href={social.facebook} target="_blank" rel="noreferrer">Facebook <ArrowUpRight size={14}/></a><a href={social.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15}/> LinkedIn</a><a href={social.github} target="_blank" rel="noreferrer"><Github size={15}/> GitHub</a></div>
        </div>
        <motion.form className="contact-form" onSubmit={submitContact} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
          <div className="form-heading"><span>FORMULAIRE DE CONTACT</span><Sparkles size={18}/></div>
          {sent ? <div className="success-state"><span><Check size={24}/></span><h3>Message envoyé !</h3><p>Merci pour ton message. Je reviendrai vers toi dès que possible.</p><button type="button" className="text-link" onClick={()=>setSent(false)}>Envoyer un autre message</button></div> : <>
            <label>Ton nom<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Comment tu t'appelles ?"/></label>
            <label>Ton e-mail<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="nom@exemple.com"/></label>
            <label>Type de projet<select value={form.project_type} onChange={e=>setForm({...form,project_type:e.target.value})}><option>Site web</option><option>Application mobile</option><option>Plateforme SaaS</option><option>Conseil digital</option><option>Autre projet</option></select></label>
            <label>Ton message<textarea required minLength={5} rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Parle-moi de ton idée..."/></label>
            {error && <p className="form-error">{error}</p>}<button className="button button-primary submit-button" disabled={sending}>{sending ? 'Envoi en cours…' : 'Envoyer mon message'} <Send size={17}/></button>
          </>}
        </motion.form></div>
      </section>
    </main>
    <footer className="site-footer container"><a className="brand" href="#home"><span className="brand-mark">C<span>.</span></span><span>AMCOL<span className="brand-muted"> / DEV</span></span></a><span>Conçu avec curiosité et beaucoup de café <span className="orange">✳</span></span><span>© {new Date().getFullYear()} Colomb Amani</span><a href="/admin" className="admin-footer-link">Admin <ArrowUpRight size={13}/></a></footer>
  </div>
}

export default function App() {
  const location = useLocation()
  return <><ScrollToTop/><AnimatePresence mode="wait"><Routes location={location} key={location.pathname}><Route path="/" element={<Home/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="not-found"><h1>404<span>.</span></h1><p>Cette page n'existe pas.</p><Link to="/" className="button button-primary">Retour à l'accueil <ArrowRight size={16}/></Link></main>}/></Routes></AnimatePresence></>
}
