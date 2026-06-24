import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Database, 
  Layers, 
  Linkedin, 
  Github, 
  Mail, 
  ChevronRight, 
  GraduationCap, 
  Briefcase, 
  ArrowUpRight, 
  Menu, 
  X, 
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  Terminal,
  Paperclip,
  CheckCircle2,
  FileCheck2,
  Lock,
  LogOut,
  ShieldCheck,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { projectsData, articlesData, academicJourney, professionalExperience } from './data/portfolioData';
import SecureWorkspace from './components/SecureWorkspace';
import DailyView from './components/DailyView';
import Dashboard from './components/Dashboard';
import { auth, signInWithGoogle, logOut, onAuthStateChanged, User, db } from './lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

type TabType = 'home' | 'projects' | 'veille' | 'about' | 'secure' | 'contact';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'all' | 'automation' | 'erp' | 'ia'>('all');

  // KPIMaster navigation and calendar states
  const [currentKpiDate, setCurrentKpiDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [kpiTab, setKpiTab] = useState<'daily' | 'dashboard'>('daily');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Integrated projects orchestrator states
  interface IntegratedProject {
    id: string;
    userId?: string;
    title: string;
    url: string;
    description: string;
    createdAt?: any;
  }

  const defaultProjects: IntegratedProject[] = [
    {
      id: 'demo-kpi',
      title: 'KPI Dashboard',
      url: 'https://claudelmbz.github.io/kpi/',
      description: 'Module d\'analyse de KPIs industriels et de pilotage de production'
    }
  ];

  const [integratedProjects, setIntegratedProjects] = useState<IntegratedProject[]>(defaultProjects);
  const [activeIframeProject, setActiveIframeProject] = useState<IntegratedProject | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchIntegratedProjects = async () => {
    if (!user) {
      setIntegratedProjects(defaultProjects);
      return;
    }
    setLoadingProjects(true);
    setProjectError('');
    try {
      const q = query(
        collection(db, 'integrated_projects'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched: IntegratedProject[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title || 'Sans titre',
          url: data.url || '',
          description: data.description || '',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      // Sort client-side by createdAt descending
      fetched.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });

      setIntegratedProjects([...defaultProjects, ...fetched]);
    } catch (err: any) {
      console.error('Error fetching integrated projects:', err);
      setProjectError('Impossible de charger vos projets intégrés.');
      setIntegratedProjects(defaultProjects);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newProjectUrl.trim()) return;

    if (!user) {
      setProjectError('Veuillez vous connecter avec Google pour enregistrer vos propres projets intégrés.');
      return;
    }

    setProjectError('');
    setIsSavingProject(true);

    let sanitizedUrl = newProjectUrl.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }

    try {
      await addDoc(collection(db, 'integrated_projects'), {
        userId: user.uid,
        title: newProjectTitle.trim(),
        url: sanitizedUrl,
        description: newProjectDesc.trim(),
        createdAt: serverTimestamp()
      });

      setNewProjectTitle('');
      setNewProjectUrl('');
      setNewProjectDesc('');
      await fetchIntegratedProjects();
    } catch (err: any) {
      console.error('Error saving integrated project:', err);
      setProjectError("Une erreur est survenue lors de l'enregistrement de l'accès.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (projectId === 'demo-kpi') {
      alert("Le projet de démonstration par défaut ne peut être supprimé.");
      return;
    }
    if (!window.confirm('Voulez-vous vraiment détruire ce projet de votre orchestrateur ?')) return;

    try {
      await deleteDoc(doc(db, 'integrated_projects', projectId));
      if (activeIframeProject?.id === projectId) {
        setActiveIframeProject(null);
      }
      await fetchIntegratedProjects();
    } catch (err: any) {
      console.error('Error deleting integrated project:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  // Sync integrated projects when user login/logout
  useEffect(() => {
    fetchIntegratedProjects();
  }, [user]);

  // Monitor auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign in error", error);
      if (error && (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user'))) {
        setAuthError(
          "La fenêtre de connexion a été fermée ou bloquée par votre navigateur.\n\n" +
          "⚠️ TRÈS IMPORTANT : Les navigateurs bloquent la connexion Google dans les cadres d'aperçu (iFrames). " +
          "Veuillez CLIQUER SUR LE BOUTON BLEU CI-DESSOUS pour ouvrir l'application dans un nouvel onglet, puis reconnectez-vous."
        );
      } else {
        setAuthError(`Une erreur s'est produite lors de la connexion Google: ${error.message || error}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setActiveTab('home');
    } catch (e) {
      console.error(e);
    }
  };

  // Contact state
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const filteredProjects = projectFilter === 'all' 
    ? projectsData 
    : projectsData.filter(p => p.category === projectFilter);

  // loading wall
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 font-mono">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xs tracking-widest text-slate-400 uppercase animate-pulse">Initialisation du Noyau d'Authentification...</div>
      </div>
    );
  }

  // gatekeeper wall
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(29,78,216,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />

        {/* Header */}
        <header className="max-w-7xl mx-auto w-full px-8 py-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold tracking-tighter text-sm font-mono shadow-lg shadow-blue-500/20">
              CN
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">corenode.fr</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">Claudel Mubenzem</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" /> Serveur Sécurisé Actif
          </div>
        </header>

        {/* Center login panel */}
        <main className="max-w-md mx-auto w-full px-6 py-12 relative z-10 flex flex-col justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative text-center"
          >
            {/* Padlock Icon */}
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Lock size={28} />
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2 leading-tight">Authentification Requise</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-6 font-semibold">
              Régime de Confidentialité & Règlementation SI
            </p>
            
            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-8">
              Bienvenue sur l'environnement de sécurité de <strong>corenode.fr</strong>. 
              Cet outil contient des documents techniques, des informations d'ingénierie et des zones de bases de données privées. Veuillez vous connecter avec votre identifiant Google afin d'accéder à votre partition personnalisée.
            </p>

            <button
              onClick={handleLogin}
              className="w-full py-4 bg-white hover:bg-slate-50 text-slate-950 font-semibold text-xs tracking-wide rounded-2xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-white/5 active:scale-[0.98]"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.33 1.905 15.45 1 12.24 1 5.92 1 12.24 1 12.24 1s4.92 11.24 11.24 11.24c6.6 0 11.01-4.64 11.01-11.24 0-.76-.08-1.345-.18-1.955H12.24z"
                />
              </svg>
              Se connecter via Google
            </button>

            {authError && (
              <div className="mt-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] text-left leading-relaxed font-sans space-y-1">
                <p className="font-semibold text-rose-300">⚠️ Échec d'authentification</p>
                <p className="whitespace-pre-line">{authError}</p>
              </div>
            )}

            {/* Disclaimer on iframe limitations */}
            <div className="mt-8 border-t border-slate-800/80 pt-6 space-y-4">
              <p className="text-[11px] text-amber-500 leading-relaxed flex items-start gap-2 text-left bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10">
                <span className="text-sm leading-none block shrink-0">⚠️</span>
                <span>
                  <strong>Alerte iFrame :</strong> Si la fenêtre de connexion Google ne s'affiche pas (bloquée par l'aperçu de l'iFrame), utilisez le bouton ci-dessous pour lancer l'application en plein écran.
                </span>
              </p>

              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.98] focus:outline-none"
              >
                Ouvrir l'application dans un nouvel onglet
                <ArrowUpRight size={14} />
              </a>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto w-full px-8 py-6 text-center text-[10px] font-mono text-slate-600 uppercase tracking-wider relative z-10">
          © 2026 CoreNode — Claudel Mubenzem // All Rights Reserved
        </footer>
      </div>
    );
  }

  // authenticated layout
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      
      {/* Subtle Sidebar Decoration - Elegant and professional */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-14 border-r border-slate-100 items-center justify-center z-50 bg-white/70 backdrop-blur-md">
        <p className="writing-vertical-rl rotate-180 text-[9px] uppercase tracking-[0.4em] font-medium text-slate-400">
          domain // corenode.fr — Digital Systems Portfolio
        </p>
      </div>

      {/* Modern Navigation Header */}
      <nav className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur-xl z-40 ml-0 lg:ml-14 sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold tracking-tighter text-sm font-mono shadow-md shadow-blue-500/20">
              CN
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block">corenode.fr</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">Claudel Mubenzem</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {(['home', 'projects', 'veille', 'about', 'secure', 'contact'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all relative cursor-pointer
                  ${activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                {tab === 'home' && 'Accueil'}
                {tab === 'projects' && 'KPIMaster'}
                {tab === 'veille' && 'Veille & TechWatch'}
                {tab === 'about' && 'À Propos & CV'}
                {tab === 'secure' && (
                  <span className="flex items-center gap-1">
                    <Lock size={12} className={activeTab === 'secure' ? 'text-white font-bold' : 'text-amber-500 font-bold'} /> 
                    <span>Espace Sécurisé</span>
                  </span>
                )}
                {tab === 'contact' && 'Contact'}
              </button>
            ))}

            <button 
              onClick={handleLogout}
              className="ml-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
              title="Déconnexion"
            >
              <LogOut size={13} />
              <span className="text-[10px] hidden xl:inline uppercase tracking-tight">{user.displayName?.split(' ')[0] || 'User'}</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            className="md:hidden text-slate-700 p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-white border-b border-slate-200 md:hidden p-6 space-y-2 z-50 shadow-xl"
            >
              {(['home', 'projects', 'veille', 'about', 'secure', 'contact'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-between
                    ${activeTab === tab 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  <span>
                    {tab === 'home' && 'Accueil'}
                    {tab === 'projects' && 'KPIMaster'}
                    {tab === 'veille' && 'Veille & TechWatch'}
                    {tab === 'about' && 'À Propos & CV'}
                    {tab === 'secure' && 'Espace Sécurisé'}
                    {tab === 'contact' && 'Contact'}
                  </span>
                  {tab === 'secure' && <Lock size={12} className={activeTab === 'secure' ? 'text-white' : 'text-amber-500'} />}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="w-full text-left p-3.5 rounded-xl text-xs font-semibold tracking-wide bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogOut size={14} /> Déconnexion de {user.email}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content Workspace */}
      <main className="flex-1 ml-0 lg:ml-14 max-w-7xl mx-auto w-full px-6 py-12 md:px-12 md:py-16 focus:outline-none">
        <AnimatePresence mode="wait">
          
          {/* HOME / ACCUEIL */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-16"
            >
              {/* Home Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-slate-100 pb-16">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50/70 border border-blue-100 rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold text-blue-600">
                    <Sparkles size={11} className="text-blue-500 animate-pulse" /> Étudiant Ingénieur à l'ECE Lyon
                  </div>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05] font-sans">
                    Optimisation de <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Databases & ERP</span> 
                    <br />pour l'industrie.
                  </h1>
                  <p className="text-base md:text-lg text-slate-600 font-sans max-w-xl leading-relaxed">
                    Je m'appelle <strong className="text-slate-900 font-semibold">Claudel Mubenzem</strong>. J'automatise des flux de données, je configure les environnements ERP (Open-Prod) et j'administre des flottes de terminaux industriels pour maximiser la productivité opérationnelle.
                  </p>
                  
                  {/* Technology tokens */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Python & Pandas', 'Open-Prod ERP', 'PostgreSQL / SQL', 'Android MDM', 'Générative IA / API'].map((tag) => (
                      <span key={tag} className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-wrap gap-4">
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs tracking-wide transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                      Consulter les projets <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => setActiveTab('about')}
                      className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs tracking-wide transition-all cursor-pointer"
                    >
                      Mon parcours & Compétences
                    </button>
                  </div>
                </div>

                {/* Info decorative panel */}
                <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-8 relative shadow-xl shadow-slate-100/50">
                  <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-blue-600 text-white font-mono text-[9px] uppercase tracking-widest font-bold py-1 px-3.5 rounded-full shadow-md">
                    Live Profile
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-6">Fiche de Synthèse</span>
                  
                  <div className="space-y-5">
                    <div className="border-b border-slate-50 pb-4">
                      <span className="font-mono text-[9px] text-slate-400 uppercase block tracking-wider">Origine Académique</span>
                      <span className="text-slate-800 font-medium block mt-1">Transition ICAM vers ECE Lyon</span>
                    </div>
                    <div className="border-b border-slate-50 pb-4">
                      <span className="font-mono text-[9px] text-slate-400 uppercase block tracking-wider">Spécialité Principale</span>
                      <span className="text-slate-800 font-medium block mt-1">Data, Systèmes d'Information et ERP</span>
                    </div>
                    <div className="pb-1">
                      <span className="font-mono text-[9px] text-slate-400 uppercase block tracking-wider">Dernier Stage Technique</span>
                      <span className="text-slate-800 font-medium block mt-1">Assistant Ingénieur ERP chez Rubanor</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between font-mono text-[9px] uppercase tracking-wider text-blue-600 font-bold">
                    <span>Host: corenode.fr</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Connection Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Highlights Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Types de Missions</h2>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Savoir-faire et chantiers opérationnels récents</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('projects')}
                    className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Tout voir <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                    <div>
                      <div className="w-10 h-10 bg-blue-50/70 text-blue-600 rounded-xl border border-blue-100/50 flex items-center justify-center mb-5">
                        <Database size={18} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2">Automatisation de données</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Scripts Python et pandas pour le traitement automatisé des bases produits et rapprochements EAN catalogue.
                      </p>
                    </div>
                    <span className="font-mono text-[9px] uppercase text-blue-600 tracking-wider font-bold">DATA SCIENCE</span>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                    <div>
                      <div className="w-10 h-10 bg-indigo-50/70 text-indigo-600 rounded-xl border border-indigo-100/50 flex items-center justify-center mb-5">
                        <Layers size={18} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2">ERP & Systèmes d'Atelier</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Paramétrage opérationnel de l'ERP Open-Prod et encadrement d’une flotte de tablettes Android durcies connectées.
                      </p>
                    </div>
                    <span className="font-mono text-[9px] uppercase text-indigo-600 tracking-wider font-bold">ERP SYSTEMS</span>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                    <div>
                      <div className="w-10 h-10 bg-sky-50/70 text-sky-600 rounded-xl border border-sky-100/50 flex items-center justify-center mb-5">
                        <Cpu size={18} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2">IA & Innovation Agile</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Prototypes exploitant l'IA Studio de Google pour automatiser le catalogage ou analyser des nomenclatures complexes.
                      </p>
                    </div>
                    <span className="font-mono text-[9px] uppercase text-sky-600 tracking-wider font-bold">EXPERIMENTATIONS</span>
                  </div>
                </div>
              </div>

              {/* Latest TechWatch Preview */}
              <div className="bg-slate-50/80 rounded-3xl border border-slate-100 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Veille Technologique & Conférences</h3>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-1">Suivi de la maturation des architectures SI & IA</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('veille')}
                    className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    Consulter les retours <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {articlesData.map((article) => (
                    <div key={article.id} className="space-y-2.5">
                      <span className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 inline-block">
                        {article.event}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{article.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROJECTS / PORTFOLIO */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">KPIMaster 🚀</h1>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mt-1">Tracker de KPI Journalier &amp; Système de Scoring Pondéré</p>
                </div>

                {/* Internal View Switches */}
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl self-start">
                  <button
                    onClick={() => setKpiTab('daily')}
                    className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                      kpiTab === 'daily'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Saisie Journalière ✍️
                  </button>
                  <button
                    onClick={() => setKpiTab('dashboard')}
                    className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                      kpiTab === 'dashboard'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Analyses Historiques 📊
                  </button>
                </div>
              </div>

              {/* Dynamic View container */}
              <div className="transition-all duration-300">
                {kpiTab === 'daily' ? (
                  <DailyView 
                    user={user} 
                    currentDateStr={currentKpiDate} 
                    onDateChange={setCurrentKpiDate} 
                  />
                ) : (
                  <Dashboard 
                    user={user} 
                    onSelectDate={(date) => { 
                      setCurrentKpiDate(date); 
                      setKpiTab('daily'); 
                    }} 
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* VEILLE TECHNIQUE */}
          {activeTab === 'veille' && (
            <motion.div
              key="veille"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="border-b border-slate-100 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Veille & TechWatch</h1>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mt-1">Abonnement aux événements clés et synthèse technique active</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Tech watch list */}
                <div className="lg:col-span-8 space-y-8">
                  {articlesData.map((article) => (
                    <article key={article.id} className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-5">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-blue-500" />
                          <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">{article.event}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <Calendar size={12} /> {article.date}
                        </div>
                      </div>

                      <h2 className="text-xl font-bold text-slate-900 mb-3">{article.title}</h2>
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-sans mb-6">
                        {article.summary}
                      </p>

                      <div className="space-y-5">
                        {article.sections.map((section, idx) => (
                          <div key={idx} className="border-l-2 border-blue-500 pl-4 space-y-1">
                            <h4 className="font-bold text-sm text-slate-900">{section.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{section.content}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-6 pt-5 border-t border-slate-50">
                        {article.tags.map(tag => (
                          <span key={tag} className="font-mono text-[9px] tracking-wider text-blue-600 font-bold bg-blue-50/50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Sidebar watch summary */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-base font-bold text-slate-950 mb-3">Exigence de Curiosité</h3>
                    <div className="space-y-4 font-sans text-xs text-slate-500 leading-relaxed">
                      <p>
                        Une veille ciblée renforce la pertinence opérationnelle des choix technologiques de l'entreprise.
                      </p>
                      <ul className="space-y-2 list-disc pl-4 text-slate-500">
                        <li>Focalisation ERP composites</li>
                        <li>Intégration d'API Structurées IA</li>
                        <li>Sécurité des flux industriels distribués</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ABOUT / CV */}
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">À Propos & CV</h1>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mt-1">Ingénieur orienté data pipelines, ERP industriels et automations</p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer self-start shadow-sm"
                >
                  Imprimer le CV
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left col: academic and professional */}
                <div className="lg:col-span-8 space-y-12">
                  
                  {/* Academic Journey */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <GraduationCap className="text-blue-500" size={20} />
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Formation Académique</h2>
                    </div>

                    <div className="space-y-8">
                      {academicJourney.map((step, idx) => (
                        <div key={idx} className="relative pl-6 border-l border-slate-200">
                          <div className="absolute top-1.5 -left-1 w-2 h-2 bg-blue-600 rounded-full" />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                            <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                              {step.period}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {step.location}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-950 leading-tight">{step.degree}</h3>
                          <p className="font-sans text-xs text-slate-400 font-bold tracking-tight mt-0.5">{step.institution}</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans mt-2.5">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Briefcase className="text-blue-500" size={18} />
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Expériences Professionnelles</h2>
                    </div>

                    <div className="space-y-8">
                      {professionalExperience.map((exp, idx) => (
                        <div key={idx} className="relative pl-6 border-l border-slate-200">
                          <div className="absolute top-1.5 -left-1 w-2 h-2 bg-blue-600 rounded-full" />
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                              {exp.period}
                            </span>
                            <span className="text-xs font-bold uppercase text-slate-400 font-mono">
                              {exp.company}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-950 leading-tight">{exp.role}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans mt-2.5 mb-4">
                            {exp.description}
                          </p>
                          <ul className="space-y-2 mb-4">
                            {exp.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="text-xs text-slate-600 flex items-start gap-1.5 font-sans leading-relaxed">
                                <span className="text-blue-500 shrink-0">→</span> <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {exp.skillsBuilt.map(skill => (
                              <span key={skill} className="font-mono text-[9px] font-semibold tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/50 inline-block">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right col: Skills scorecard */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="border border-slate-100 rounded-3xl p-8 bg-white shadow-sm">
                    <h3 className="text-base font-bold text-slate-950 mb-5">Matrice de Compétences</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2.5">Outils & Langages</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Python', 'SQL', 'Pandas', 'Open-Prod ERP', 'PostgreSQL', 'Git / GitHub', 'Android MDM', 'TypeScript'].map((skill) => (
                            <span key={skill} className="font-mono text-[9px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2.5">Savoir-Faire Métier</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Données Industrielles', 'Gestion de stocks', 'Déploiement ERP', 'Rapprochement de bases', 'Sécurisation MDM Android'].map((skill) => (
                            <span key={skill} className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 block">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2">Langues</span>
                        <div className="space-y-1 text-xs text-slate-500">
                          <p><strong className="text-slate-700">Français</strong> — Langue Maternelle</p>
                          <p><strong className="text-slate-700">Anglais</strong> — Technique & Professionnel (B2)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* SECURE WORKSPACE */}
          {activeTab === 'secure' && user && (
            <motion.div
              key="secure"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <SecureWorkspace 
                userId={user.uid} 
                userEmail={user.email || ''} 
              />
            </motion.div>
          )}

          {/* CONTACT */}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="border-b border-slate-100 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Contact d'Ingénierie</h1>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mt-1">Échangeons sur vos projets de traitement de données ou d'automatisation de flux</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Contact channels */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-950 mb-3">Canaux de Communication</h2>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      N'hésitez pas à me joindre directement via ces différentes plateformes pour échanger sur vos architectures de données.
                    </p>

                    <div className="space-y-3 font-mono text-[11px]">
                      <a 
                        href="https://linkedin.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 text-slate-700 hover:text-blue-600 transition-colors p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50"
                      >
                        <Linkedin size={16} className="text-sky-700" />
                        <span>linkedin.com/claudel-mubenzem</span>
                      </a>
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 text-slate-700 hover:text-blue-600 transition-colors p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50"
                      >
                        <Github size={16} className="text-slate-900" />
                        <span>github.com/corenode</span>
                      </a>
                      <div className="flex items-center gap-3 text-slate-700 p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <Mail size={16} className="text-rose-500" />
                        <span>claudel.mubenzem@2028.icam.fr</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact form */}
                <div className="lg:col-span-7">
                  <form onSubmit={handleFormSubmit} className="bg-white border border-slate-100 rounded-3xl p-8 space-y-5 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-950 border-b border-slate-50 pb-3">Envoyer un message</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] uppercase font-bold text-slate-400 block">Nom complet</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 rounded-xl border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] uppercase font-bold text-slate-400 block">Adresse e-mail</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 rounded-xl border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-400 block">Sujet</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-400 block">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full p-3 rounded-xl border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none bg-slate-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                    >
                      Transmettre l'appel <ChevronRight size={14} />
                    </button>

                    <AnimatePresence>
                      {formSubmitted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-medium text-center"
                        >
                          ✔ Message transmis avec succès ! (Simulation)
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Modern footer */}
      <footer className="ml-0 lg:ml-14 mt-auto border-t border-slate-200/60 bg-white py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase font-mono tracking-widest text-[#888]">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span>© 2026 CoreNode</span>
            <span className="opacity-25">//</span>
            <span>Claudel Mubenzem</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <span>ECE Lyon - Spé. Data, SI, ERP</span>
            <span className="hidden md:block">Process: active_host</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
