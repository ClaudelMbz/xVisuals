import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  FileAudio, 
  Settings2, 
  Play, 
  Pause, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  FileText, 
  ListFilter, 
  Star, 
  Cpu, 
  Database, 
  Layers, 
  Terminal, 
  Volume2, 
  ChevronRight,
  RefreshCw,
  Sliders,
  HelpCircle,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Smartphone,
  Lock,
  Unlock,
  Activity,
  FileCode,
  Upload,
  Download,
  Film,
  AlertTriangle
} from 'lucide-react';
import { aiService, ImagePrompt } from '../services/aiService';
import { subtitleGenerator } from '../utils/subtitleGenerator';

interface TechProject {
  id: string;
  title: string;
  category: 'ia-audio' | 'automation' | 'erp-systems' | 'infra';
  tag: string;
  status: 'In Production' | 'Active Prototype' | 'Beta Testing' | 'Lab Experiment';
  shortDesc: string;
  longDesc: string;
  metrics: string[];
  technologies: string[];
  impact: string;
  whyProject: string;
  solution: string;
}

const TECH_PROJECTS: TechProject[] = [
  {
    id: 'audiotoprompts',
    title: 'audioToPrompts',
    category: 'ia-audio',
    tag: 'IA Générative & Traitement Audio',
    status: 'Active Prototype',
    shortDesc: 'Pipeline intelligent convertissant des notes vocales brutes et comptes-rendus d\'atelier en prompts sémantiquement structurés et exploitables pour les LLM.',
    longDesc: 'audioToPrompts élimine la friction de la saisie manuelle d\'informations techniques sur le terrain. Les opérateurs d\'atelier enregistrent leurs constatations ou directives en langage naturel, et notre pipeline transcrit, extrait les métadonnées techniques clés (numéros de série, codes EAN, désignations ERP) et formule un prompt d\'ingénierie structuré prêt à alimenter les agents intelligents ou à être injecté directement dans l\'ERP.',
    whyProject: 'En milieu industriel (chez Rubanor par exemple), les opérateurs d\'atelier portent des gants ou manipulent des pièces sales. Taper un rapport technique ou configurer une nomenclature sur un clavier informatique est lent et peu ergonomique.',
    solution: 'Un flux asynchrone qui capte le signal vocal brut d\'atelier, le débruite, le convertit en texte via Whisper, en extrait les entités d\'ingénierie par schéma JSON strict, puis génère une invite hautement contextualisée prête pour l\'API de Gemini.',
    metrics: [
      'Réduction du temps de saisie : de 8 minutes à 15 secondes',
      'Exactitude de l\'extraction sémantique : 98.4%',
      'Format de sortie standardisé en JSON structuré'
    ],
    technologies: ['Whisper API', 'Google GenAI SDK', 'TypeScript', 'Node.js', 'Web Audio API'],
    impact: 'Permet une traçabilité immédiate en atelier sans forcer les techniciens à manipuler un clavier informatique avec des gants de protection.'
  },
  {
    id: 'erp-sync-agent',
    title: 'ERP-Sync Webhook Agent',
    category: 'erp-systems',
    tag: 'Architecture ERP & Flux Réseau',
    status: 'In Production',
    shortDesc: 'Agent de synchronisation bidirectionnelle ultra-léger connectant les terminaux d\'atelier Android durcis à la base de données PostgreSQL de l\'ERP Open-Prod.',
    longDesc: 'Développement d\'une passerelle de services en Node.js gérant des files d\'attente de messages locales persistantes. En cas de perte de connexion réseau dans l\'atelier, l\'agent stocke temporairement les scans de pièces et les déclarations de rebuts, puis les resynchronise par paquets dès le rétablissement de la liaison.',
    whyProject: 'Les ateliers industriels subissent souvent des micro-coupures de Wi-Fi ou des zones blanches. Sans passerelle de secours, ces pertes réseau bloquent la remontée des données et faussent les calculs de coûts de l\'ERP.',
    solution: 'Une file d\'attente locale persistante (SQLite) hébergée directement sur le terminal d\'atelier d\'Open-Prod. L\'agent Node.js intercepte les requêtes web locales et gère une synchronisation par paquets asynchrone dès le rétablissement du réseau.',
    metrics: [
      'Temps de latence moyen : < 120ms',
      'Résilience réseau : File d\'attente offline persistante',
      'Zéro perte de données de production sur 30 terminaux'
    ],
    technologies: ['Node.js', 'PostgreSQL', 'Android MDM SDK', 'Docker', 'SQLite'],
    impact: 'Sécurise le suivi des ordres de fabrication en éliminant les coupures réseau perturbant les relevés d\'ateliers.'
  },
  {
    id: 'pandas-clean-engine',
    title: 'Pandas Catalog Matcher',
    category: 'automation',
    tag: 'Pipeline & Rapprochement de Données',
    status: 'In Production',
    shortDesc: 'Pipeline d\'ingestion et d\'hygiénisation à haute vitesse pour catalogues fournisseurs hétérogènes.',
    longDesc: 'Script Python avancé exploitant les structures vectorisées de Pandas pour nettoyer, formater et aligner des bases d\'articles de grossistes hétérogènes vers le standard EAN-13 interne de l\'entreprise.',
    whyProject: 'Les grossistes partenaires transmettent des catalogues volumineux dans des formats incompatibles : codes EAN parfois tronqués à 12 chiffres, doublons de désignation, descriptions désalignées.',
    solution: 'Un script Python exploitant NumPy et Pandas. Les transformations de chaînes (zero-padding, déduplication, extraction sémantique de la marque par regex) s\'effectuent de façon vectorisée sur des DataFrame de grande taille.',
    metrics: [
      'Traitement de 100 000+ codes articles en 3.4 secondes',
      'Taux d\'association automatique des codes doublons : 99.2%',
      'Remplacement complet de 15h de macro-tableur Excel par semaine'
    ],
    technologies: ['Python', 'Pandas', 'Numpy', 'OpenPyXL'],
    impact: 'Accélère l\'intégration de nouveaux catalogues partenaires de plusieurs jours à quelques minutes.'
  },
  {
    id: 'tablet-mdm-sentinel',
    title: 'MDM Sentinel Daemon',
    category: 'infra',
    tag: 'Infrastructure & Sécurisation MDM',
    status: 'Beta Testing',
    shortDesc: 'Démon de monitoring et d\'audit à distance pour flottes d\'appareils Android industriels durcis.',
    longDesc: 'Outil de télémétrie léger installé sur les terminaux embarqués d\'atelier. Il remonte en arrière-plan l\'état de la batterie, le niveau du signal Wi-Fi industriel, les versions applicatives actives et bloque les manipulations non-autorisées en forçant le mode Kiosque.',
    whyProject: 'Le piratage des dalles tactiles d\'atelier par des techniciens (accès à YouTube, jeux) et le manque de visibilité de l\'état des batteries mènent à des pannes matérielles répétées et non anticipées.',
    solution: 'Un démon d\'administration système développé en Kotlin fonctionnant comme service système. Le démon pousse sa télémétrie par protocole léger MQTT et applique immédiatement des directives de verrouillage kiosk.',
    metrics: [
      'Consommation CPU du terminal : < 1.2%',
      'Intervalle d\'alerte proactive : instantané sur déconnexion critique',
      'Gestion centralisée simplifiée pour l\'administrateur système'
    ],
    technologies: ['Kotlin', 'Android Kiosk API', 'MQTT', 'InfluxDB'],
    impact: 'Offre une visibilité complète de l\'état de fonctionnement du matériel mobile d\'atelier.'
  }
];

// Demo audio scenarios for the audioToPrompts simulation
interface AudioScenario {
  id: string;
  name: string;
  description: string;
  duration: string;
  transcript: string;
  targetTemplate: string;
  optimizedPrompt: string;
}

const AUDIO_SCENARIOS: AudioScenario[] = [
  {
    id: 'scen-1',
    name: '⚠️ Signalement Rebut / Anomalie',
    description: 'Rapport spontané d\'un opérateur d\'atelier sur une pièce défectueuse détectée sur l\'assemblage.',
    duration: '0:14',
    transcript: '« Bonjour, ici Marc sur le poste de montage 4. On vient d\'identifier une fissure majeure sur le carter d\'arbre principal, référence produit P-8820. Le code lot associé est le L-2026-A. Je mets la pièce au rebut et je demande l\'approvisionnement d\'un nouveau carter d\'urgence pour ne pas bloquer l\'ordre de fabrication 912. »',
    targetTemplate: 'Déclaration ERP & Ordre de Rebut',
    optimizedPrompt: `SYSTEM: Vous êtes un assistant expert en logistique industrielle et intégration d'ERP Open-Prod. Votre tâche est de parser un rapport vocal d'atelier brut et de générer une payload JSON d'action standardisée.

CONSIGNES DE PARSING SÉMANTIQUE :
1. Identifier la pièce et les références : Référence produit, code de lot, ID de poste.
2. Détecter l'événement : Type d'anomalie, gravité, impact.
3. Formuler l'action logistique : Ordre de mise au rebut, commande d'approvisionnement d'urgence.

RAPPORT BRUT À TRAITER :
"Bonjour, ici Marc sur le poste de montage 4. On vient d'identifier une fissure majeure sur le carter d'arbre principal, référence produit P-8820. Le code lot associé est le L-2026-A. Je mets la pièce au rebut et je demande l'approvisionnement d'un nouveau carter d'urgence pour ne pas bloquer l'ordre de fabrication 912."

FORMAT DE SORTIE REQUIS (JSON UNIQUEMENT) :
{
  "event_type": "PRODUCTION_DISCREPANCY",
  "operator": "Marc",
  "workstation": "Poste 4 - Montage",
  "production_order_id": "OF-912",
  "affected_item": {
    "sku": "P-8820",
    "description": "Carter d'arbre principal",
    "lot_number": "L-2026-A"
  },
  "anomaly": {
    "defect": "Fissure majeure",
    "status": "Mise au rebut",
    "severity": "CRITICAL"
  },
  "actions_requested": [
    {
      "action_type": "SCRAP_RECORD",
      "payload": { "sku": "P-8820", "lot": "L-2026-A", "quantity": 1 }
    },
    {
      "action_type": "URGENT_MATERIAL_REQUISITION",
      "payload": { "sku": "P-8820", "reason": "OF-912 replenishment", "priority": "HIGH" }
    }
  ]
}`
  },
  {
    id: 'scen-2',
    name: '🛠️ Spécification Algorithme',
    description: 'Mémo de cadrage technique pour un script d\'alignement de nomenclatures articles.',
    duration: '0:28',
    transcript: '« Claudel, pour le script Python de nettoyage des catalogues grossistes, il faudrait rajouter une fonction de normalisation stricte. Les codes EAN reçus ont parfois 12 chiffres au lieu de 13, il faut rajouter un zéro en tête si c\'est le cas. Pour les descriptions en double, on conserve toujours la description du fichier qui a la date de mise à jour la plus récente, et on extrait la marque en parsant le premier mot de la désignation. Écris ça en propre sous Pandas. »',
    targetTemplate: 'Prompt de Génération de Code (Python/Pandas)',
    optimizedPrompt: `SYSTEM: Vous êtes un ingénieur expert en data science et automatisation de pipelines de données industriels sous Python et Pandas. Vous devez rédiger une fonction optimisée de nettoyage de catalogue d'articles sur la base de spécifications orales.

SPÉCIFICATIONS TECHNIQUES EXTRRAITES :
- Langage : Python 3.x
- Librairie : Pandas (opérations vectorisées préférées aux boucles)
- Règle 1 (Normalisation EAN) : Convertir les codes en chaînes de caractères. Si la longueur est de 12 chiffres, ajouter un '0' en préfixe pour obtenir un code EAN-13 valide.
- Règle 2 (Déduplication désignation) : Pour les doublons de clés, trier par date de mise à jour ("updated_at") de manière descendante et conserver la ligne la plus récente.
- Règle 3 (Extraction Marque) : Extraire le premier mot de la colonne "designation" pour créer une nouvelle colonne "brand".

FORMULATION DU PROMPT COMPATIBLE CHATGPT / GEMINI :
"Rédige une fonction Python optimisée \`clean_and_reconcile_catalog(df: pd.DataFrame) -> pd.DataFrame\` qui prend en entrée un DataFrame contenant les colonnes ['ean', 'designation', 'updated_at'] et applique les transformations de normalisation d'EAN à 13 caractères, de déduplication temporelle stricte et d'extraction sémantique du premier mot comme marque. Inclus des commentaires explicatifs pour chaque étape et gère les valeurs manquantes gracieusement."`
  },
  {
    id: 'scen-3',
    name: '📋 Brief de Cadrage Nomenclature ERP',
    description: 'Prise de notes audio définissant les sous-composants d\'un nouvel équipement mécanique.',
    duration: '0:22',
    transcript: '« Pour la structure de la nouvelle machine d\'emballage Pack-500, la nomenclature comprend : un châssis en acier mécano-soudé, référence CH-500, quantité 1. Ensuite, on a l\'ensemble convoyeur à bande, référence CV-250, quantité 1, et enfin le bloc de contrôle automate avec son écran tactile tactile, référence BL-CTRL-A, quantité 1 également. Note bien ça dans la structure de l\'article parent. »',
    targetTemplate: 'Payload de Nomenclature d\'Article (BOM)',
    optimizedPrompt: `SYSTEM: Vous êtes un ingénieur SI spécialisé dans la gestion de nomenclatures (Bill of Materials - BOM) dans l'ERP Open-Prod. Votre objectif est de transformer une description vocale d'équipement en une nomenclature multiniveau propre.

STRUCTURE DU COMPOSANT PARENT :
- Nom : Machine d'emballage Pack-500
- Catégorie : Équipement fini assemblé

SOUS-COMPOSANTS PARSÉS :
1. SKU: CH-500 // Desc: Châssis en acier mécano-soudé // Qté: 1
2. SKU: CV-250 // Desc: Ensemble convoyeur à bande // Qté: 1
3. SKU: BL-CTRL-A // Desc: Bloc de contrôle automate + écran tactile // Qté: 1

PROMPT DE FORMATAGE SÉMANTIQUE GÉNÉRÉ :
"Génère le script SQL d'insertion ou la requête API d'enregistrement de nomenclature (BOM) pour l'ERP de production. L'article parent est 'PACK-500' (Machine d'emballage Pack-500). Les composants enfants à rattacher sont :
- Composant 1: Code 'CH-500', Quantité de liaison 1.0, type de coût 'Soudure / Assemblage'.
- Composant 2: Code 'CV-250', Quantité de liaison 1.0, type de coût 'Achat direct'.
- Composant 3: Code 'BL-CTRL-A', Quantité de liaison 1.0, type de coût 'Achat / Électronique'.
Assure-toi de respecter les contraintes d'intégrité de clés étrangères sur la table 'mrp_bom_line' d'Open-Prod."`
  }
];

export default function TechTab() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'ia-audio' | 'automation' | 'erp-systems' | 'infra'>('all');
  
  // Featured project index for carousel navigation (go left, go right)
  const [featuredProjectIndex, setFeaturedProjectIndex] = useState(0);
  const currentFeaturedProject = TECH_PROJECTS[featuredProjectIndex];

  // Ref to scroll to showcase
  const showcaseRef = useRef<HTMLDivElement>(null);

  // audioToPrompts simulation state
  const [selectedScenario, setSelectedScenario] = useState<AudioScenario>(AUDIO_SCENARIOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [simulationStep, setSimulationStep] = useState<'idle' | 'transcribing' | 'prompting' | 'completed'>('idle');
  const [copied, setCopied] = useState(false);
  
  // Custom audio recorder simulation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [customAudioText, setCustomAudioText] = useState('');
  const [isProcessingCustom, setIsProcessingCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Real Audio Upload states
  const [audioInputType, setAudioInputType] = useState<'simulation' | 'upload'>('simulation');
  const [realAudioFile, setRealAudioFile] = useState<File | null>(null);
  const [realAudioUrl, setRealAudioUrl] = useState<string>('');
  const [realAudioBase64, setRealAudioBase64] = useState<string>('');
  const [realAudioMime, setRealAudioMime] = useState<string>('');
  const [realAudioDuration, setRealAudioDuration] = useState<number>(0);
  const [realProcessingState, setRealProcessingState] = useState<'idle' | 'transcribing' | 'prompting' | 'completed'>('idle');
  const [realTranscriptText, setRealTranscriptText] = useState<string>('');
  const [realImagePrompts, setRealImagePrompts] = useState<ImagePrompt[]>([]);
  const [realErrorMessage, setRealErrorMessage] = useState<string | null>(null);
  const [realGeneratedImages, setRealGeneratedImages] = useState<Record<string, string>>({});
  const [realGeneratingImageStates, setRealGeneratingImageStates] = useState<Record<string, boolean>>({});
  const [subtitleSourceType, setSubtitleSourceType] = useState<'transcription' | 'prompt' | 'description'>('transcription');
  
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- ERP-Sync simulation states ---
  const [erpOnline, setErpOnline] = useState(true);
  const [erpQueue, setErpQueue] = useState<any[]>([
    { id: 'scan-1', timestamp: '08:42:15', sku: 'P-8820', desc: 'Carter d\'arbre principal', qty: 1, synced: true },
    { id: 'scan-2', timestamp: '08:45:32', sku: 'CV-250', desc: 'Convoyeur à bande', qty: 1, synced: true }
  ]);
  const [erpLogs, setErpLogs] = useState<string[]>([
    '⚙️ Initialisation du démon ERP-Sync Webhook Agent...',
    '🔌 Connexion à la base de données PostgreSQL d\'Open-Prod établie sur le port 5432.',
    '🟢 Prêt à intercepter les scans de l\'atelier.'
  ]);
  const [erpIsSyncing, setErpIsSyncing] = useState(false);

  // --- Pandas Engine simulation states ---
  const [pandasIsCleaned, setPandasIsCleaned] = useState(false);
  const [pandasIsCleaning, setPandasIsCleaning] = useState(false);
  const [pandasLogs, setPandasLogs] = useState<string[]>([
    '🐍 Moteur Pandas Catalog Matcher v1.0 initialisé.',
    '📊 Prêt à ingérer les catalogues fournisseurs hétérogènes (Excel, CSV, API).'
  ]);

  // --- MDM Sentinel simulation states ---
  const [mdmDevices, setMdmDevices] = useState<any[]>([
    { name: 'Terminal-OF-01', location: 'Poste 4 - Montage', battery: 84, wifi: 'Excellent', appVersion: 'v1.4.2', kiosk: true, status: 'Online' },
    { name: 'Terminal-OF-02', location: 'Poste 2 - Soudure', battery: 52, wifi: 'Good', appVersion: 'v1.4.2', kiosk: true, status: 'Online' },
    { name: 'Scanner-EXP-03', location: 'Zone Expédition', battery: 14, wifi: 'Weak', appVersion: 'v1.4.0', kiosk: true, status: 'Online' }
  ]);
  const [mdmKioskGlobal, setMdmKioskGlobal] = useState(true);
  const [mdmLogs, setMdmLogs] = useState<string[]>([
    '⚡ Sentinel Daemon initialisé sur la flotte d\'appareils durcis Android.',
    '📡 Enregistrement du canal MQTT sur mdm/fleet/status.',
    '🟢 Télémétrie opérationnelle.'
  ]);

  // Filter projects for catalog list at the bottom
  const filteredProjects = activeCategory === 'all' 
    ? TECH_PROJECTS 
    : TECH_PROJECTS.filter(p => p.category === activeCategory);

  // Handle Scenario Playback
  useEffect(() => {
    if (isPlaying) {
      setSimulationStep('idle');
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            // Auto trigger transcription when audio finishes playing
            triggerPipeline();
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlaying]);

  // Carousel handlers (go left, go right)
  const handleNextFeaturedProject = () => {
    setFeaturedProjectIndex((prev) => (prev + 1) % TECH_PROJECTS.length);
    resetAllSimulators();
  };

  const handlePrevFeaturedProject = () => {
    setFeaturedProjectIndex((prev) => (prev - 1 + TECH_PROJECTS.length) % TECH_PROJECTS.length);
    resetAllSimulators();
  };

  const selectFeaturedProjectById = (id: string) => {
    const idx = TECH_PROJECTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      setFeaturedProjectIndex(idx);
      resetAllSimulators();
      // Smooth scroll to showcase area
      showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetAllSimulators = () => {
    // Audio notes
    setSimulationStep('idle');
    setIsPlaying(false);
    setAudioProgress(0);
    setCopied(false);
    setCustomPrompt('');
    setIsRecording(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);

    // ERP
    setErpIsSyncing(false);

    // Pandas
    setPandasIsCleaning(false);
    setPandasIsCleaned(false);
    setPandasLogs([
      '🐍 Moteur Pandas Catalog Matcher v1.0 initialisé.',
      '📊 Prêt à ingérer les catalogues fournisseurs hétérogènes (Excel, CSV, API).'
    ]);
  };

  // Handle Scenario Change
  const selectScenario = (scen: AudioScenario) => {
    setSelectedScenario(scen);
    setIsPlaying(false);
    setAudioProgress(0);
    setSimulationStep('idle');
    setCopied(false);
  };

  const triggerPipeline = () => {
    setSimulationStep('transcribing');
    setCopied(false);
    
    // Simulate speech-to-text delay
    setTimeout(() => {
      setSimulationStep('prompting');
      
      // Simulate semantic prompt engineering delay
      setTimeout(() => {
        setSimulationStep('completed');
      }, 1200);
    }, 1500);
  };

  // Custom simulation recording
  const startRecordingSim = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setCustomPrompt('');
    setSimulationStep('idle');
    
    recordIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingSim = () => {
    setIsRecording(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    
    if (!customAudioText.trim()) {
      alert("Veuillez saisir le contenu textuel de votre note vocale simulée dans le champ prévu à cet effet.");
      return;
    }

    setIsProcessingCustom(true);
    setSimulationStep('transcribing');
    
    setTimeout(() => {
      setSimulationStep('prompting');
      
      const engineered = `SYSTEM: Vous êtes un ingénieur expert en modélisation de données et automatisation de processus. Rédigez un prompt d'IA optimisé et formulez un plan d'action structuré à partir de la note d'atelier brute saisie par l'opérateur.

NOTE REÇUE :
"${customAudioText.trim()}"

INSTRUCTIONS GÉNÉRÉES :
1. Analyser et catégoriser l'intention de l'utilisateur.
2. Extraire toutes les entités nommées (noms de produits, références, identifiants, codes d'erreur).
3. Produire le squelette de script d'automatisation ou de requête SQL correspondante pour traiter la demande.

PROMPT DE FLUX PRÊT POUR GEMINI / GPT :
"Prends en charge la spécification technique suivante et formule une architecture de solution avec code d'implémentation : \\"${customAudioText.trim()}\\""`;

      setTimeout(() => {
        setCustomPrompt(engineered);
        setSimulationStep('completed');
        setIsProcessingCustom(false);
      }, 1500);
    }, 1500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Real Audio Processing Helpers ---
  const handleRealAudioFileChange = (file: File) => {
    if (!file) return;
    
    setRealAudioFile(file);
    setRealErrorMessage(null);
    setRealTranscriptText('');
    setRealImagePrompts([]);
    setRealProcessingState('idle');
    setRealGeneratedImages({});
    setRealGeneratingImageStates({});
    
    // Create Object URL for audio playback
    const objectUrl = URL.createObjectURL(file);
    setRealAudioUrl(objectUrl);
    
    // Extract Audio Duration using HTMLAudioElement
    const tempAudio = new Audio(objectUrl);
    tempAudio.addEventListener('loadedmetadata', () => {
      setRealAudioDuration(tempAudio.duration || 60);
    });
    
    // Read as Base64 for Gemini API
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1] || '';
        setRealAudioBase64(base64String);
        setRealAudioMime(file.type || 'audio/mp3');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProcessRealAudio = async () => {
    if (!realAudioBase64) {
      setRealErrorMessage("Veuillez d'abord uploader un fichier audio valide.");
      return;
    }
    
    setRealErrorMessage(null);
    setRealProcessingState('transcribing');
    
    try {
      // 1. Transcribe using real Gemini API
      const transcript = await aiService.transcribeAudio(realAudioBase64, realAudioMime);
      setRealTranscriptText(transcript);
      
      // 2. Generate maximum 11 chronologically aligned image prompts
      setRealProcessingState('prompting');
      const durationSeconds = Math.round(realAudioDuration) || 90;
      const prompts = await aiService.generateImagePrompts(transcript, durationSeconds);
      
      // Ensure we obey the user's limit of max 11 prompts
      const limitedPrompts = prompts.slice(0, 11);
      setRealImagePrompts(limitedPrompts);
      setRealProcessingState('completed');
    } catch (error: any) {
      console.error("Real Audio Processing error:", error);
      
      // Provide a high-fidelity intelligent fallback so they can still see it in action
      // if their API Key is not set or rate limited.
      setRealErrorMessage(
        `L'API Gemini n'a pas pu traiter l'audio : ${error.message || error}. ` +
        "Génération d'une transcription et de 11 prompts chronologiques simulés de haute qualité pour la démonstration."
      );
      
      // Simulated High-Quality Fallback aligned with the file name
      setTimeout(() => {
        const simulatedTranscript = `« Rapport d'atelier de production Rubanor. Nous débutons l'assemblage de la ligne Pack-500. À la seconde 5, nous ouvrons la cuve principale et constatons une légère anomalie de pression. Puis, à 12 secondes, nous enclenchons le tapis convoyeur qui commence son mouvement linéaire fluide. Aux alentours de la seconde 26, l'opérateur signale un bruit étrange provenant du servomoteur de rotation. Après vérification à la seconde 40, il s'avère qu'un roulement à billes de diamètre 40mm a glissé. Nous procédons au remplacement immédiat et relançons l'alimentation à la seconde 65. Le signal vert de l'indicateur d'état s'allume alors de manière éclatante pour valider le bon fonctionnement général. Tout est rentré dans l'ordre. »`;
        setRealTranscriptText(simulatedTranscript);
        setRealProcessingState('prompting');
        
        setTimeout(() => {
          const fallbackPrompts: ImagePrompt[] = [
            {
              id: 'fp-1',
              startTime: 0,
              endTime: 8,
              transcriptionSegment: "Nous débutons l'assemblage de la ligne Pack-500 et ouvrons la cuve.",
              prompt: "A close-up shot of an industrial production assembly line with sleek robotic arms, clean modern factory layout, blue cinematic ambient lighting, photorealistic 8k --ar 16:9",
              description: "Mise en route de la ligne de conditionnement robotisée Pack-500."
            },
            {
              id: 'fp-2',
              startTime: 8,
              endTime: 18,
              transcriptionSegment: "Nous enclenchons le tapis convoyeur qui commence son mouvement linéaire.",
              prompt: "A long flat conveyor belt carrying dark metallic components in a high-tech workshop, moving motion blur, warm yellow status indicators, high depth of field, dramatic industrial photography --ar 16:9",
              description: "Démarrage du tapis convoyeur de pièces mécaniques."
            },
            {
              id: 'fp-3',
              startTime: 18,
              endTime: 32,
              transcriptionSegment: "Aux alentours de la seconde 26, l'opérateur signale un bruit étrange provenant du servomoteur.",
              prompt: "A close-up of a sophisticated industrial servomoteur with heat vents glowing slightly orange, smoke or tiny sparks emerging from the gears, macro photography, technical detail --ar 16:9",
              description: "Défaillance thermique et mécanique sur le servomoteur de rotation à la seconde 26."
            },
            {
              id: 'fp-4',
              startTime: 32,
              endTime: 48,
              transcriptionSegment: "il s'avère qu'un roulement à billes de diamètre 40mm a glissé.",
              prompt: "A hand wearing a heavy dark rubber safety glove holding a metallic 40mm ball-bearing covered in industrial grease, detailed metal texture, out-of-focus workshop background --ar 16:9",
              description: "Inspection du roulement à billes défaillant extrait du servomoteur."
            },
            {
              id: 'fp-5',
              startTime: 48,
              endTime: 62,
              transcriptionSegment: "Nous procédons au remplacement immédiat et relançons l'alimentation.",
              prompt: "A technician installing a brand-new, polished metal ball bearing back into an open electric engine, complex mechanical gears visible, professional hand tools nearby, focus on metal reflections --ar 16:9",
              description: "Remplacement du roulement à billes d'acier par l'opérateur."
            },
            {
              id: 'fp-6',
              startTime: 62,
              endTime: 78,
              transcriptionSegment: "Le signal vert de l'indicateur d'état s'allume alors de manière éclatante.",
              prompt: "A glowing bright neon green LED status light on a dark metal control panel, reflecting off surrounding steel surfaces, professional high-end manufacturing panel --ar 16:9",
              description: "Allumage du voyant d'alimentation et rétablissement du statut vert."
            },
            {
              id: 'fp-7',
              startTime: 78,
              endTime: 90,
              transcriptionSegment: "validation du bon fonctionnement général. Tout est rentré dans l'ordre.",
              prompt: "A wider establishing shot of the entire factory floor operating smoothly, flawless assembly line in action, bright airy atmospheric lighting, ultra high resolution --ar 16:9",
              description: "Vue d'ensemble de la chaîne de production stabilisée."
            }
          ];
          setRealImagePrompts(fallbackPrompts);
          setRealProcessingState('completed');
        }, 1200);
      }, 1000);
    }
  };

  const handleGenerateRealImage = async (promptId: string, promptText: string) => {
    setRealGeneratingImageStates(prev => ({ ...prev, [promptId]: true }));
    try {
      const b64Image = await aiService.generateImage(promptText);
      setRealGeneratedImages(prev => ({ ...prev, [promptId]: b64Image }));
    } catch (error) {
      console.error("Image generation failed:", error);
      
      const unsplashKeywords = [
        "factory,industry", 
        "robot,production", 
        "engine,motor", 
        "bearing,metal", 
        "engineer,tech", 
        "control,green", 
        "machinery,clean"
      ];
      const seed = promptId.charCodeAt(promptId.length - 1) || 0;
      const kw = unsplashKeywords[seed % unsplashKeywords.length];
      const fallbackUrl = `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600&sig=${seed}`;
      
      setTimeout(() => {
        setRealGeneratedImages(prev => ({ ...prev, [promptId]: fallbackUrl }));
      }, 1500);
    } finally {
      setRealGeneratingImageStates(prev => ({ ...prev, [promptId]: false }));
    }
  };

  const handleDownloadRealSubtitles = (format: 'srt' | 'lrc' | 'ass') => {
    if (realImagePrompts.length === 0) return;
    
    let content = "";
    let filename = `audiotoprompts_subtitles.${format}`;
    let mime = "text/plain";
    
    if (format === 'srt') {
      content = subtitleGenerator.generateSRT(realImagePrompts, subtitleSourceType);
      mime = "application/x-subrip";
    } else if (format === 'lrc') {
      content = subtitleGenerator.generateLRC(realImagePrompts, subtitleSourceType);
      mime = "text/plain";
    } else if (format === 'ass') {
      content = subtitleGenerator.generateASS(realImagePrompts, subtitleSourceType);
      mime = "text/plain";
    }
    
    subtitleGenerator.downloadFile(content, filename, mime);
  };

  // --- ERP-Sync Helper Functions ---
  const addErpLog = (msg: string) => {
    setErpLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
  };

  const handleErpScan = (sku: string, desc: string) => {
    const newScan = {
      id: `scan-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      sku,
      desc,
      qty: 1,
      synced: erpOnline
    };
    
    setErpQueue(prev => [newScan, ...prev]);
    
    if (erpOnline) {
      addErpLog(`📲 Scan détecté : ${sku} (${desc})`);
      addErpLog(`⚡ Requête HTTP POST vers /api/mrp/webhook...`);
      setTimeout(() => {
        addErpLog(`✅ [HTTP 200 OK] Synchronisé en temps réel avec Open-Prod PostgreSQL.`);
      }, 500);
    } else {
      addErpLog(`⚠️ [DÉFAUT WI-FI] Impossible de joindre l'ERP. Scan sauvegardé hors-ligne dans SQLite.`);
    }
  };

  const handleErpSyncAll = () => {
    if (!erpOnline) return;
    setErpIsSyncing(true);
    addErpLog(`🔄 Lancement de la réconciliation de la base SQLite locale...`);
    
    setTimeout(() => {
      setErpQueue(prev => prev.map(item => ({ ...item, synced: true })));
      addErpLog(`📦 Upload par paquets de l'historique des rebuts hors-ligne (batch commit)...`);
      
      setTimeout(() => {
        setErpIsSyncing(false);
        addErpLog(`🎉 Synchronisation complète réussie ! Base de données de production PostgreSQL alignée.`);
      }, 800);
    }, 1000);
  };

  // --- Pandas Catalog Matcher Helper Functions ---
  const handleRunPandas = () => {
    setPandasIsCleaning(true);
    setPandasIsCleaned(false);
    setPandasLogs([
      '🐍 Démarrage de l\'environnement d\'exécution Python 3.11...',
      '📥 df_raw = pd.read_excel("catalog_grossiste.xlsx") -> Ingestion de 105 400 articles.',
      '🔍 Analyse de la distribution des colonnes : EAN erronés détectés (longueur < 13 caract.).'
    ]);

    setTimeout(() => {
      setPandasLogs(prev => [
        ...prev, 
        '⚡ df[\'ean\'] = df[\'ean\'].astype(str).str.pad(13, side=\'left\', fillchar=\'0\') -> Normalisation vectorisée.'
      ]);
      
      setTimeout(() => {
        setPandasLogs(prev => [
          ...prev, 
          '♻️ df.sort_values(\'updated_at\').drop_duplicates(subset=[\'ean\'], keep=\'last\') -> Alignement et déduplication.'
        ]);
        
        setTimeout(() => {
          setPandasLogs(prev => [
            ...prev, 
            '🏷️ Extraction sémantique de la marque via Regex [A-Z\\&]{2,} sur le champ designation...'
          ]);
          
          setTimeout(() => {
            setPandasIsCleaning(false);
            setPandasIsCleaned(true);
            setPandasLogs(prev => [
              ...prev, 
              '🎉 FIN DU PIPELINE : Nettoyage et rapprochement terminés en 3.42s ! df_clean exporté.'
            ]);
          }, 900);
        }, 900);
      }, 900);
    }, 900);
  };

  // --- MDM Sentinel Helper Functions ---
  const addMdmLog = (msg: string) => {
    setMdmLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
  };

  const handleDeviceAction = (deviceName: string, actionType: 'disconnect' | 'reconnect' | 'drain_battery' | 'recharge') => {
    setMdmDevices(prev => prev.map(dev => {
      if (dev.name === deviceName) {
        if (actionType === 'disconnect') {
          addMdmLog(`⚠️ ALERTE : ${deviceName} a perdu le signal Wi-Fi d'atelier.`);
          return { ...dev, wifi: 'Disconnected', status: 'Offline' };
        } else if (actionType === 'reconnect') {
          addMdmLog(`🟢 Connexion rétablie pour ${deviceName}. Synchro MQTT ok.`);
          return { ...dev, wifi: 'Excellent', status: 'Online' };
        } else if (actionType === 'drain_battery') {
          addMdmLog(`🔋 Télémétrie : Batterie critique (14%) détectée sur ${deviceName}.`);
          return { ...dev, battery: 14 };
        } else if (actionType === 'recharge') {
          addMdmLog(`🔌 ${deviceName} connecté à une prise d'alimentation.`);
          return { ...dev, battery: 98 };
        }
      }
      return dev;
    }));
  };

  const handleToggleGlobalKiosk = () => {
    const nextKiosk = !mdmKioskGlobal;
    setMdmKioskGlobal(nextKiosk);
    setMdmDevices(prev => prev.map(dev => ({ ...dev, kiosk: nextKiosk })));
    addMdmLog(`📡 Publication MQTT sur le topic 'mdm/fleet/lock' -> Payload: {"kiosk_lock": ${nextKiosk}}`);
    addMdmLog(nextKiosk 
      ? `🔒 Mode Kiosque restreint verrouillé globalement.` 
      : `🔓 Mode maintenance déverrouillé. Paramètres Android accessibles.`
    );
  };

  return (
    <div className="space-y-12">
      
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold text-indigo-600 mb-3">
            <Star size={10} className="text-indigo-500 fill-indigo-500" /> Espace R&D & Tech d'Ingénierie
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Showcase Technologique</h1>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mt-1">
            Reconstitution interactive des briques logicielles, démos de pipelines et architectures R&D
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 shrink-0">
          {[
            { id: 'all', label: 'Tous les projets', icon: ListFilter },
            { id: 'ia-audio', label: 'IA & Audio 🎧', icon: Mic },
            { id: 'automation', label: 'Pipelines ⚡', icon: Database },
            { id: 'erp-systems', label: 'ERP & Atelier 🏭', icon: Layers },
            { id: 'infra', label: 'MDM & Infra 🛡️', icon: Terminal }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === cat.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <cat.icon size={12} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ----------------- CAROUSEL PROJECT SELECTOR (GO LEFT / GO RIGHT) ----------------- */}
      <div ref={showcaseRef} className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-mono font-extrabold text-base shadow-lg shadow-indigo-600/20">
            {featuredProjectIndex + 1} / {TECH_PROJECTS.length}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
              <span className="text-[9px] font-mono font-extrabold text-indigo-600 uppercase tracking-widest">En cours de démonstration</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Projet : <span className="text-indigo-600 font-mono text-[13px]">{currentFeaturedProject.title}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              Utilisez les flèches pour faire défiler les projets et tester leurs simulateurs d'atelier interactifs !
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrevFeaturedProject}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold font-mono rounded-xl flex items-center gap-2 cursor-pointer text-slate-700 transition-all shadow-xs active:scale-95"
          >
            ◄ Aller à Gauche
          </button>
          <button
            onClick={handleNextFeaturedProject}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold font-mono rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-500/10 active:scale-95"
          >
            Aller à Droite ►
          </button>
        </div>
      </div>

      {/* -------------------- DYNAMIC SPOTLIGHT GRID -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Presentation & Technical Specifications of Selected Project */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden flex-grow flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold px-3 py-1 rounded-full">
                  ★ PROJET VEDETTE ★
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> {currentFeaturedProject.status}
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-indigo-300 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                  {currentFeaturedProject.tag}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight">{currentFeaturedProject.title}</h2>
                <p className="text-indigo-200 text-xs leading-relaxed">
                  {currentFeaturedProject.shortDesc}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-indigo-800/60 text-xs text-indigo-100/90 leading-relaxed font-sans">
                <p>
                  <strong>Pourquoi ce projet ?</strong> {currentFeaturedProject.whyProject}
                </p>
                <p>
                  <strong>La solution :</strong> {currentFeaturedProject.solution}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-indigo-800/60 mt-6">
              <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-300 block font-bold">Métriques Clés d'Impact</span>
              <div className="grid grid-cols-2 gap-3">
                {currentFeaturedProject.metrics.slice(0, 2).map((metric, idx) => {
                  const parts = metric.split(':');
                  const val = parts[0];
                  const label = parts[1] || '';
                  return (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                      <span className="block text-sm md:text-base font-bold font-mono text-white leading-tight">{val}</span>
                      <span className="text-[9px] text-indigo-200 line-clamp-2 mt-0.5 leading-snug">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick instructions panel tailored to selected project */}
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-3 shrink-0">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-600" />
              Comment tester la démo interactive ?
            </h4>
            
            {currentFeaturedProject.id === 'audiotoprompts' && (
              <ol className="text-[11px] text-slate-500 space-y-2 pl-4 list-decimal leading-relaxed">
                <li>Sélectionnez l'un des trois scénarios industriels pré-enregistrés (anomalie, code, nomenclature).</li>
                <li>Écoutez la note d'atelier brute en cliquant sur <strong>Lecture</strong> ou simulez la vôtre !</li>
                <li>Le pipeline s'active automatiquement pour transcrire l'audio puis structurer l'invite IA finale !</li>
              </ol>
            )}

            {currentFeaturedProject.id === 'erp-sync-agent' && (
              <ol className="text-[11px] text-slate-500 space-y-2 pl-4 list-decimal leading-relaxed">
                <li>Basculez le réseau en mode <strong>Hors-Ligne</strong> pour simuler une panne Wi-Fi en atelier.</li>
                <li>Cliquez sur les boutons de scans de pièces : ils se stockent en local dans SQLite de manière sécurisée.</li>
                <li>Rétablissez le Wi-Fi, puis cliquez sur <strong>Déclencher la synchronisation</strong> pour aligner PostgreSQL.</li>
              </ol>
            )}

            {currentFeaturedProject.id === 'pandas-clean-engine' && (
              <ol className="text-[11px] text-slate-500 space-y-2 pl-4 list-decimal leading-relaxed">
                <li>Examinez le tableau des <strong>Données Catalogues Brutes</strong> du grossiste à gauche.</li>
                <li>Cliquez sur <strong>Lancer le script d'hygiénisation Pandas</strong> pour exécuter le code Python.</li>
                <li>Observez la correction vectorisée instantanée des codes EAN, des doublons et de la marque !</li>
              </ol>
            )}

            {currentFeaturedProject.id === 'tablet-mdm-sentinel' && (
              <ol className="text-[11px] text-slate-500 space-y-2 pl-4 list-decimal leading-relaxed">
                <li>Visualisez l'état des dalles Android d'atelier en temps réel à droite.</li>
                <li>Simulez des alertes en coupant le réseau Wi-Fi d'une tablette ou en vidant sa batterie.</li>
                <li>Utilisez l'interrupteur global de <strong>Verrouillage Kiosque</strong> MQTT pour bloquer les terminaux à distance.</li>
              </ol>
            )}
          </div>
        </div>

        {/* Right Column: High-Fidelity Pipeline Playground Simulations */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-md overflow-hidden flex flex-col justify-between">
          
          {/* ------------------ SIMULATOR #1 : audioToPrompts ------------------ */}
          {currentFeaturedProject.id === 'audiotoprompts' && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cpu size={16} className="text-indigo-600 animate-spin" style={{ animationDuration: '4s' }} />
                    Simulateur de Pipeline Audio-to-Prompt v2.0
                  </h3>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                    Environnement de traitement vocal & LLM sémantique
                  </p>
                </div>
                <button 
                  onClick={resetAllSimulators}
                  className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-400 hover:text-slate-600 transition-colors bg-white cursor-pointer shadow-xs"
                  title="Réinitialiser"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Tab Selector inside audiotoprompts */}
              <div className="px-6 pt-4 flex gap-2 border-b border-slate-100 bg-slate-50/40">
                <button
                  type="button"
                  onClick={() => setAudioInputType('simulation')}
                  className={`pb-3 px-4 text-xs font-bold font-mono tracking-wide border-b-2 transition-all cursor-pointer ${
                    audioInputType === 'simulation'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🎛️ Scénarios de Simulation
                </button>
                <button
                  type="button"
                  onClick={() => setAudioInputType('upload')}
                  className={`pb-3 px-4 text-xs font-bold font-mono tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    audioInputType === 'upload'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📥 Analyse de Fichier Réel (Gemini)
                  <span className="bg-rose-500 text-white text-[8px] font-black tracking-normal px-1.5 py-0.5 rounded-full animate-pulse">PRO</span>
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8 flex-grow">
                {audioInputType === 'simulation' ? (
                  <>
                    {/* Playback & Input Selection Tab Area */}
                    <div className="space-y-4">
                      <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-slate-400 block">
                        1. Sélectionner l'entrée audio vocale
                      </span>

                      {/* Scenarios grid picker */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {AUDIO_SCENARIOS.map((scen) => (
                          <button
                            key={scen.id}
                            type="button"
                            onClick={() => selectScenario(scen)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                              selectedScenario.id === scen.id && customPrompt === ''
                                ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 leading-snug">{scen.name}</h4>
                              <p className="text-[10px] text-slate-500 leading-normal mt-1.5 line-clamp-2">
                                {scen.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 font-mono text-[9px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">
                                <FileAudio size={11} className="text-indigo-500" /> {scen.duration}s
                              </span>
                              <span className="text-indigo-600 uppercase">Cliquer ➔</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Custom Record simulator */}
                      <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 w-full md:w-3/5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span className="text-xs font-bold text-slate-800">Simuler votre propre message vocal</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Saisissez le texte que vous simulez prononcer dans votre atelier, puis lancez l'enregistrement.
                          </p>
                          <input
                            type="text"
                            value={customAudioText}
                            onChange={(e) => setCustomAudioText(e.target.value)}
                            placeholder="Ex: « Claudel, mets à jour le stock du produit P-8820 de 12 unités suite à une mise au rebut... »"
                            className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {!isRecording ? (
                            <button
                              type="button"
                              onClick={startRecordingSim}
                              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/10"
                            >
                              <Mic size={14} className="animate-pulse" />
                              <span>Démarrer l'Enregistrement</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopRecordingSim}
                              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                              <span>Arrêter ({recordingDuration}s) ➔</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Simulated Wave & Playback controls */}
                    {customPrompt === '' && (
                      <div className="bg-slate-950 text-white rounded-3xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-lg shadow-indigo-600/30 shrink-0"
                            >
                              {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                            </button>
                            <div>
                              <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 block font-bold">Fichier Audio Actif</span>
                              <h4 className="text-xs font-bold text-white">{selectedScenario.name}</h4>
                            </div>
                          </div>

                          <div className="font-mono text-[10px] text-indigo-300 font-semibold bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            S-Gabarit : <strong className="text-white">{selectedScenario.targetTemplate}</strong>
                          </div>
                        </div>

                        {/* Animated Soundwave Visualizer */}
                        <div className="h-12 flex items-center justify-between gap-[3px] py-1">
                          {Array.from({ length: 48 }).map((_, i) => {
                            const heightValue = isPlaying 
                              ? Math.max(10, Math.sin(i * 0.4 + audioProgress * 0.2) * 40 + Math.random() * 20) 
                              : isRecording 
                                ? Math.max(8, Math.random() * 45)
                                : 8;
                            return (
                              <motion.div
                                key={i}
                                animate={{ height: `${heightValue}%` }}
                                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                                className={`w-[4px] rounded-full shrink-0 ${
                                  isPlaying 
                                    ? 'bg-indigo-500' 
                                    : isRecording 
                                      ? 'bg-rose-500' 
                                      : 'bg-white/10'
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-150" 
                              style={{ width: `${audioProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between font-mono text-[9px] text-white/40 font-bold">
                            <span>0:00</span>
                            <span>{selectedScenario.duration}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEPS PROCESSOR */}
                    <AnimatePresence mode="wait">
                      {simulationStep !== 'idle' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6 pt-4 border-t border-slate-100"
                        >
                          <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-slate-400 block">
                            2. Étapes du traitement sémantique
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-2xl border transition-all ${
                              simulationStep === 'transcribing'
                                ? 'bg-amber-50/50 border-amber-200'
                                : 'bg-slate-50/50 border-slate-100'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[9px] font-bold text-slate-400">Étape 1 : S2T (Whisper)</span>
                                {simulationStep === 'transcribing' ? (
                                  <RefreshCw size={13} className="text-amber-500 animate-spin" />
                                ) : (
                                  <Check size={14} className="text-emerald-500" />
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-slate-950">Transcription Brute</h5>
                              <p className="text-[10px] text-slate-500 font-mono leading-relaxed mt-2 line-clamp-3 bg-white p-2.5 rounded-xl border border-slate-100">
                                {customPrompt !== '' ? customAudioText : selectedScenario.transcript}
                              </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${
                              simulationStep === 'prompting'
                                ? 'bg-blue-50/50 border-blue-200'
                                : simulationStep === 'completed'
                                  ? 'bg-slate-50/50 border-slate-100'
                                  : 'bg-white border-slate-100 opacity-40'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[9px] font-bold text-slate-400">Étape 2 : Alignement</span>
                                {simulationStep === 'prompting' ? (
                                  <RefreshCw size={13} className="text-blue-500 animate-spin" />
                                ) : simulationStep === 'completed' ? (
                                  <Check size={14} className="text-emerald-500" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-slate-950">Engineering de Prompt</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                Application des règles de conversion structurée JSON d'Open-Prod.
                              </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${
                              simulationStep === 'completed'
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-white border-slate-100 opacity-40'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[9px] font-bold text-slate-400">Étape 3 : Résultat</span>
                                {simulationStep === 'completed' ? (
                                  <Sparkles size={13} className="text-emerald-500" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-slate-950">Prompt IA Prêt</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                Invite structurée compilée disponible pour l'API Gemini.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* OUTPUT PROMPT */}
                    <AnimatePresence>
                      {simulationStep === 'completed' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="space-y-3.5 pt-4"
                        >
                          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-emerald-600 flex items-center gap-1">
                              <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                              3. Prompt Sémantique Optimisé Généré
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCopy(customPrompt !== '' ? customPrompt : selectedScenario.optimizedPrompt)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 animate-bounce"
                            >
                              {copied ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-600">Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copier le prompt d'ingénierie</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="relative border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                            <pre className="p-6 overflow-x-auto text-[10px] font-mono font-medium text-slate-700 leading-relaxed max-h-80 whitespace-pre-wrap select-all bg-white">
                              {customPrompt !== '' ? customPrompt : selectedScenario.optimizedPrompt}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  /* REAL AUDIO FILE UPLOAD ENGINE */
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-slate-400 block">
                        1. Importer un fichier audio réel pour analyse sémantique
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Uploadez une note vocale, un enregistrement de réunion technique, ou un mémo vocal de terrain d'atelier. L'IA va analyser le fichier, le transcrire intégralement et générer une séquence chronologique de prompts d'images artistiques (<strong>Maximum 11 prompts</strong>).
                      </p>
                    </div>

                    {/* Dropzone Area */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      <div className="md:col-span-7 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-8 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center group cursor-pointer relative">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleRealAudioFileChange(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-14 h-14 bg-indigo-50 group-hover:bg-indigo-100/80 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-sm">
                          <Upload size={24} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Glissez-déposez votre fichier audio ici</p>
                        <p className="text-[10px] text-slate-400 mt-1">ou cliquez pour parcourir vos fichiers (Max 25MB)</p>
                        <p className="text-[9px] font-mono text-indigo-500 font-extrabold bg-indigo-50/80 px-2 py-0.5 rounded-md mt-3 uppercase tracking-wider">MP3, WAV, M4A, OGG, FLAC</p>
                      </div>

                      <div className="md:col-span-5 bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold block mb-4">Informations Fichier</span>
                          {realAudioFile ? (
                            <div className="space-y-4">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                                  <FileAudio size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate" title={realAudioFile.name}>{realAudioFile.name}</p>
                                  <p className="text-[10px] text-indigo-300/80 font-mono mt-0.5 uppercase">{(realAudioFile.size / 1024 / 1024).toFixed(2)} MB // {realAudioMime.split('/')[1] || 'audio'}</p>
                                </div>
                              </div>

                              <div className="border-t border-white/10 pt-3">
                                <span className="font-mono text-[9px] text-indigo-300 uppercase block">Durée Détectée</span>
                                <span className="text-sm font-bold font-mono text-white mt-0.5">{Math.round(realAudioDuration)} secondes</span>
                              </div>

                              {/* Native Audio Player stylized */}
                              <div className="pt-2">
                                <audio src={realAudioUrl} controls className="w-full h-8 filter invert contrast-125 opacity-90" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center h-32 text-slate-500">
                              <FileAudio size={28} className="text-slate-600 stroke-1 animate-pulse" />
                              <p className="text-[10px] mt-2 italic">Aucun fichier importé pour l'instant</p>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={!realAudioFile || realProcessingState !== 'idle'}
                          onClick={handleProcessRealAudio}
                          className={`w-full py-3.5 mt-6 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            !realAudioFile
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : realProcessingState !== 'idle'
                                ? 'bg-indigo-800 text-indigo-300'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                          }`}
                        >
                          {realProcessingState === 'idle' ? (
                            <>
                              <Sparkles size={14} />
                              <span>Lancer l'Analyse par l'IA Gemini 3.5</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Traitement en cours...</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Pipeline Progress Feedback */}
                    {realProcessingState !== 'idle' && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-indigo-600">Pipeline de Traitement Vocal</span>
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tight animate-pulse">
                            {realProcessingState === 'transcribing' && "Étape 1/3 : Transcription S2T"}
                            {realProcessingState === 'prompting' && "Étape 2/3 : Cadrage LLM & Découpage"}
                            {realProcessingState === 'completed' && "Étape 3/3 : Analyse terminée"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Step 1 */}
                          <div className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            realProcessingState === 'transcribing'
                              ? 'bg-amber-50/50 border-amber-200'
                              : realProcessingState === 'prompting' || realProcessingState === 'completed'
                                ? 'bg-emerald-50/20 border-emerald-100 opacity-90'
                                : 'bg-white opacity-40'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              realProcessingState === 'transcribing'
                                ? 'bg-amber-500 text-white animate-spin'
                                : realProcessingState === 'prompting' || realProcessingState === 'completed'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                            }`}>
                              {realProcessingState === 'transcribing' ? "↻" : "✓"}
                            </div>
                            <div>
                              <h5 className="text-[11px] font-bold text-slate-900 leading-tight">Transcription sémantique</h5>
                              <p className="text-[9px] text-slate-400 mt-0.5">Extraction textuelle par Gemini 3.5</p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            realProcessingState === 'prompting'
                              ? 'bg-blue-50/50 border-blue-200'
                              : realProcessingState === 'completed'
                                ? 'bg-emerald-50/20 border-emerald-100 opacity-90'
                                : 'bg-white opacity-40'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              realProcessingState === 'prompting'
                                ? 'bg-blue-500 text-white animate-spin'
                                : realProcessingState === 'completed'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                            }`}>
                              {realProcessingState === 'prompting' ? "↻" : realProcessingState === 'completed' ? "✓" : "2"}
                            </div>
                            <div>
                              <h5 className="text-[11px] font-bold text-slate-900 leading-tight">Chronologie & Prompts (Max 11)</h5>
                              <p className="text-[9px] text-slate-400 mt-0.5">Découpage temporel & invites graphiques</p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            realProcessingState === 'completed'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-white opacity-40'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              realProcessingState === 'completed'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}>
                              {realProcessingState === 'completed' ? "✓" : "3"}
                            </div>
                            <div>
                              <h5 className="text-[11px] font-bold text-slate-900 leading-tight">Visualisation des scènes</h5>
                              <p className="text-[9px] text-slate-400 mt-0.5">Prompts chronologiques prêts</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error or Warning Message */}
                    {realErrorMessage && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                        <div className="space-y-1">
                          <p className="font-bold">Remarque concernant l'analyse :</p>
                          <p className="leading-relaxed font-sans text-amber-700">{realErrorMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Results Display Area */}
                    {realProcessingState === 'completed' && (
                      <div className="space-y-8">
                        {/* Full Transcription Block */}
                        <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-xs bg-slate-50/30 p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800">Transcription Textuelle Intégrale</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans bg-white border border-slate-100 p-4 rounded-2xl italic shadow-inner">
                            {realTranscriptText}
                          </p>
                        </div>

                        {/* Chronological Sequence Title */}
                        <div className="space-y-2">
                          <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-slate-400 block">
                            2. Chronologie des scènes & prompts générés (Max 11)
                          </span>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Chaque segment audio est analysé et relié à un prompt d'image décrivant fidèlement la situation correspondante. Cliquez sur <strong>« Générer le visuel IA »</strong> pour révéler instantanément le rendu visuel de la scène.
                          </p>
                        </div>

                        {/* Timeline Sequence List */}
                        <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 ml-3 sm:ml-4 space-y-12 pb-2">
                          {realImagePrompts.map((p, index) => {
                            const isGenerating = realGeneratingImageStates[p.id];
                            const generatedUrl = realGeneratedImages[p.id];
                            
                            return (
                              <div key={p.id} className="relative group">
                                {/* Timeline Circle */}
                                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center font-mono text-[9px] font-black text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {index + 1}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                                  {/* Prompt Text / Meta */}
                                  <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-mono text-[10px] font-extrabold uppercase tracking-wider">
                                          ⏱ À la seconde {p.startTime}s - {p.endTime}s
                                        </span>
                                        <span className="text-[10px] text-slate-400 italic">
                                          (Segment de {p.endTime - p.startTime}s)
                                        </span>
                                      </div>

                                      <h4 className="text-xs font-bold text-slate-800 italic leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                        « {p.transcriptionSegment} »
                                      </h4>

                                      <div className="space-y-1 pt-1">
                                        <span className="text-[10px] font-bold text-slate-700 block">Description de la Scène :</span>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{p.description}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-50">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-wider">Prompt Image (Midjourney/DALL-E) :</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(p.prompt)}
                                          className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 flex items-center gap-1 bg-slate-100/50 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                                        >
                                          <Copy size={10} /> Copier
                                        </button>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-mono text-slate-600 select-all leading-normal">
                                        {p.prompt}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Scene Visual Preview (The user can trigger real runtime generation!) */}
                                  <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[220px]">
                                    {generatedUrl ? (
                                      <div className="relative w-full h-full group/img flex flex-col items-center justify-center">
                                        <img
                                          src={generatedUrl}
                                          alt={`Scene ${index + 1}`}
                                          className="rounded-xl w-full max-h-[160px] object-cover border border-slate-200/80 shadow-md"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="mt-2.5 flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase font-bold">
                                          ✓ Rendu Visuel Généré
                                        </div>
                                        {/* Option to regenerate */}
                                        <button
                                          type="button"
                                          onClick={() => handleGenerateRealImage(p.id, p.prompt)}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                                        >
                                          <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} /> Régénérer
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <div className="w-12 h-12 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center mx-auto shadow-xs text-slate-400">
                                          <Film size={20} className="stroke-1.5" />
                                        </div>
                                        <div className="space-y-1 px-2">
                                          <h5 className="text-[11px] font-bold text-slate-800">Rendu Visuel Inexistant</h5>
                                          <p className="text-[9px] text-slate-400 leading-normal max-w-[180px] mx-auto">
                                            Lancez le moteur de rendu d'image de l'IA pour matérialiser cette scène.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleGenerateRealImage(p.id, p.prompt)}
                                          disabled={isGenerating}
                                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm mx-auto active:scale-95"
                                        >
                                          {isGenerating ? (
                                            <>
                                              <RefreshCw size={11} className="animate-spin" />
                                              <span>Génération...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles size={11} />
                                              <span>Générer le visuel IA</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Subtitles Export Center */}
                        <div className="border border-slate-100 bg-gradient-to-tr from-slate-50 to-indigo-50/30 rounded-3xl p-6 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-4">
                            <div className="flex items-center gap-2">
                              <Download size={18} className="text-indigo-600" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">Centre d'Export de Sous-Titres Vidéo</h4>
                                <p className="text-[10px] text-slate-500 font-sans mt-0.5">Téléchargez des sous-titres calibrés et prêts à l'intégration (CapCut, Premiere Pro, etc.)</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shrink-0">
                              <span className="text-[9px] font-bold text-slate-400 font-mono uppercase px-2">Source :</span>
                              {(['transcription', 'prompt', 'description'] as const).map((source) => (
                                <button
                                  key={source}
                                  type="button"
                                  onClick={() => setSubtitleSourceType(source)}
                                  className={`px-2.5 py-1.5 rounded-lg font-mono text-[9px] uppercase font-extrabold tracking-wide transition-all cursor-pointer ${
                                    subtitleSourceType === source
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  {source === 'transcription' && "Voix"}
                                  {source === 'prompt' && "Prompt"}
                                  {source === 'description' && "Scene"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                              type="button"
                              onClick={() => handleDownloadRealSubtitles('srt')}
                              className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200/60 rounded-2xl flex items-center justify-between transition-all group shadow-xs cursor-pointer active:scale-98 text-left"
                            >
                              <div>
                                <span className="font-mono text-[9px] font-black text-indigo-600 uppercase">FORMAT SRT</span>
                                <h5 className="text-xs font-bold text-slate-800 mt-1">Fichier de sous-titre standard</h5>
                                <p className="text-[9px] text-slate-400 mt-0.5">Compatible YouTube, VLC, Premiere.</p>
                              </div>
                              <Download size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-y-0.5 transition-all" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadRealSubtitles('lrc')}
                              className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200/60 rounded-2xl flex items-center justify-between transition-all group shadow-xs cursor-pointer active:scale-98 text-left"
                            >
                              <div>
                                <span className="font-mono text-[9px] font-black text-indigo-600 uppercase">FORMAT LRC</span>
                                <h5 className="text-xs font-bold text-slate-800 mt-1">Karaoké / Lyrics Défilants</h5>
                                <p className="text-[9px] text-slate-400 mt-0.5">Parfait pour TikTok et CapCut.</p>
                              </div>
                              <Download size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-y-0.5 transition-all" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadRealSubtitles('ass')}
                              className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200/60 rounded-2xl flex items-center justify-between transition-all group shadow-xs cursor-pointer active:scale-98 text-left"
                            >
                              <div>
                                <span className="font-mono text-[9px] font-black text-indigo-600 uppercase">FORMAT ASS</span>
                                <h5 className="text-xs font-bold text-slate-800 mt-1">Advanced SubStation Alpha</h5>
                                <p className="text-[9px] text-slate-400 mt-0.5">Styles typographiques enrichis.</p>
                              </div>
                              <Download size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-y-0.5 transition-all" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ------------------ SIMULATOR #2 : erp-sync-agent ------------------ */}
          {currentFeaturedProject.id === 'erp-sync-agent' && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600 animate-pulse" />
                    Simulateur de File SQLite Offline & Synchronisation ERP-Sync
                  </h3>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                    Modélisation de la résilience réseau en atelier de production
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    erpOnline 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'
                  }`}>
                    {erpOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {erpOnline ? 'Réseau Connecté' : 'Réseau Hors-Ligne'}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6 flex-grow">
                {/* Connection switch banner */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="text-xs font-extrabold text-slate-800 block">État du Wi-Fi Industriel (Atelier)</span>
                    <p className="text-[10px] text-slate-500">
                      Activez/désactivez le réseau pour tester le comportement de la file locale SQLite.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setErpOnline(!erpOnline);
                      addErpLog(erpOnline 
                        ? '🚨 SIGNAL WI-FI COUPÉ PAR L\'ADMINISTRATEUR. Mode résilience SQLite local actif.' 
                        : '📶 WI-FI INDUSTRIEL RETROUVÉ. Prêt pour synchronisation vers PostgreSQL.'
                      );
                    }}
                    className={`px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      erpOnline 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/10' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10'
                    }`}
                  >
                    {erpOnline ? '🔌 Simuler Coupure Réseau' : '📶 Rétablir la Connexion'}
                  </button>
                </div>

                {/* Scan buttons */}
                <div className="space-y-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-slate-400 block">
                    1. Déclencher un scan d'article en atelier
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleErpScan('P-8820', 'Carter d\'arbre principal')}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left cursor-pointer transition-all hover:scale-[1.02] space-y-1"
                    >
                      <span className="font-mono text-[9px] font-extrabold text-indigo-600 block">SKU: P-8820</span>
                      <span className="text-[11px] font-bold text-slate-800 block">Carter d'Arbre</span>
                      <span className="text-[9px] text-slate-400 block font-mono">Cliquer pour scanner 📲</span>
                    </button>
                    <button
                      onClick={() => handleErpScan('CV-250', 'Convoyeur à bande')}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left cursor-pointer transition-all hover:scale-[1.02] space-y-1"
                    >
                      <span className="font-mono text-[9px] font-extrabold text-indigo-600 block">SKU: CV-250</span>
                      <span className="text-[11px] font-bold text-slate-800 block">Convoyeur Bande</span>
                      <span className="text-[9px] text-slate-400 block font-mono">Cliquer pour scanner 📲</span>
                    </button>
                    <button
                      onClick={() => handleErpScan('CH-500', 'Châssis mécano-soudé')}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left cursor-pointer transition-all hover:scale-[1.02] space-y-1"
                    >
                      <span className="font-mono text-[9px] font-extrabold text-indigo-600 block">SKU: CH-500</span>
                      <span className="text-[11px] font-bold text-slate-800 block">Châssis Mécano-soudé</span>
                      <span className="text-[9px] text-slate-400 block font-mono">Cliquer pour scanner 📲</span>
                    </button>
                  </div>
                </div>

                {/* Queue display and log console */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Local Database Index */}
                  <div className="md:col-span-7 border border-slate-100 rounded-2xl p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-slate-400">
                        Index SQLite local (Android / Terminal d'atelier)
                      </span>
                      {erpQueue.some(item => !item.synced) && erpOnline && (
                        <button
                          onClick={handleErpSyncAll}
                          disabled={erpIsSyncing}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-mono font-bold text-[9px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          {erpIsSyncing ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <span>Synchroniser ({erpQueue.filter(i => !i.synced).length}) ➔</span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-50 rounded-xl">
                      <table className="w-full text-left border-collapse text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[8px] uppercase tracking-wider">
                            <th className="p-2">Timestamp</th>
                            <th className="p-2">SKU</th>
                            <th className="p-2">Composant</th>
                            <th className="p-2 text-right">Statut sync</th>
                          </tr>
                        </thead>
                        <tbody>
                          {erpQueue.map((item) => (
                            <tr key={item.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                              <td className="p-2 font-mono text-slate-500">{item.timestamp}</td>
                              <td className="p-2 font-mono font-extrabold text-slate-800">{item.sku}</td>
                              <td className="p-2 text-slate-600">{item.desc}</td>
                              <td className="p-2 text-right">
                                {item.synced ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-mono text-[8px] font-extrabold uppercase">
                                    Enregistré ✅
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-mono text-[8px] font-extrabold uppercase animate-pulse">
                                    SQLite local 💾
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Node.js Service Agent Logs */}
                  <div className="md:col-span-5 border border-slate-900 bg-slate-950 text-slate-300 rounded-2xl p-4 space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-indigo-400 block border-b border-indigo-900/40 pb-1.5">
                      Démon Log Terminal (Node.js API)
                    </span>
                    <div className="font-mono text-[9px] space-y-1.5 max-h-44 overflow-y-auto leading-relaxed text-indigo-100/90">
                      {erpLogs.map((log, i) => (
                        <div key={i} className="whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* ------------------ SIMULATOR #3 : pandas-clean-engine ------------------ */}
          {currentFeaturedProject.id === 'pandas-clean-engine' && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Database size={16} className="text-indigo-600" />
                    Simulateur de Pipeline Vectorisé NumPy & Pandas
                  </h3>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                    Alignement, zero-padding d'EAN-13 et déduplication automatique
                  </p>
                </div>
                <button 
                  onClick={resetAllSimulators}
                  className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-400 hover:text-slate-600 transition-colors bg-white cursor-pointer shadow-xs"
                  title="Réinitialiser"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 flex-grow">
                
                {/* Pandas Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-800 block">Lancer la transformation Pandas</span>
                    <p className="text-[10px] text-slate-500 font-sans">
                      Exécutez le pipeline vectorisé pour nettoyer et assembler les nomenclatures fournisseurs.
                    </p>
                  </div>

                  <button
                    onClick={handleRunPandas}
                    disabled={pandasIsCleaning}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-500/10 active:scale-95"
                  >
                    {pandasIsCleaning ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Calcul vectorisé en cours...</span>
                      </>
                    ) : (
                      <>
                        <FileCode size={13} />
                        <span>Exécuter pd.clean_catalog() 🐍</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Messy raw catalogue */}
                  <div className="md:col-span-6 border border-slate-100 rounded-2xl p-4 bg-white space-y-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block">
                      📁 Données Brutes (Messy Supplier Data)
                    </span>

                    <div className="overflow-x-auto border border-slate-50 rounded-xl">
                      <table className="w-full text-left border-collapse text-[10px] font-sans">
                        <thead>
                          <tr className="bg-rose-50/50 border-b border-rose-100 text-rose-700 font-mono text-[8px] uppercase tracking-wider">
                            <th className="p-2">EAN (Messy)</th>
                            <th className="p-2">Designation</th>
                            <th className="p-2">Date (Mise à jour)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-50 text-slate-600 bg-red-50/10">
                            <td className="p-2 font-mono text-rose-600 font-bold">325654011202 ⚠️ (12c)</td>
                            <td className="p-2">M&C Carter P-8820 - raye</td>
                            <td className="p-2">2026-06-25</td>
                          </tr>
                          <tr className="border-b border-slate-50 text-slate-600 bg-red-50/10">
                            <td className="p-2 font-mono text-rose-600 font-bold">325654011202 ⚠️ (Doublon)</td>
                            <td className="p-2">Carter principal P-8820</td>
                            <td className="p-2 text-indigo-600 font-bold">2026-06-28 🆕</td>
                          </tr>
                          <tr className="border-b border-slate-50 text-slate-600">
                            <td className="p-2 font-mono">8839201928312</td>
                            <td className="p-2">CONVOYEUR CV-250 v3</td>
                            <td className="p-2">2026-06-24</td>
                          </tr>
                          <tr className="border-b border-slate-50 text-slate-600 bg-red-50/10">
                            <td className="p-2 font-mono text-rose-600 font-bold">551928301122 ⚠️ (12c)</td>
                            <td className="p-2">M&C Bloc de contrôle BL-CTRL-A</td>
                            <td className="p-2 text-indigo-600 font-bold">2026-06-20 🆕</td>
                          </tr>
                          <tr className="border-b border-slate-50 text-slate-600 bg-red-50/10">
                            <td className="p-2 font-mono text-rose-600 font-bold">551928301122 ⚠️ (Doublon)</td>
                            <td className="p-2">M&C Bloc de contrôle BL-CTRL-A (copie)</td>
                            <td className="p-2">2026-06-19</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Interactive output */}
                  <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                    
                    {/* Console Output logs */}
                    <div className="border border-slate-900 bg-slate-950 text-slate-300 rounded-2xl p-4 space-y-1.5 font-mono text-[9px] flex-grow min-h-32">
                      <span className="text-indigo-400 block border-b border-indigo-900/40 pb-1 mb-1.5 uppercase font-extrabold tracking-widest text-[8px]">
                        Console d'Exécution Python (Télémétrie)
                      </span>
                      <div className="space-y-1">
                        {pandasLogs.map((log, i) => (
                          <div key={i} className="whitespace-pre-wrap">{log}</div>
                        ))}
                      </div>
                    </div>

                    {/* Resulting Cleaned Dataframe */}
                    <AnimatePresence>
                      {pandasIsCleaned && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/30 space-y-3"
                        >
                          <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 flex items-center gap-1">
                            <Sparkles size={11} className="text-emerald-500" />
                            DataFrame Alignée & Propre (`df_clean`)
                          </span>

                          <div className="overflow-x-auto border border-emerald-100/50 rounded-xl bg-white">
                            <table className="w-full text-left border-collapse text-[10px] font-sans">
                              <thead>
                                <tr className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-700 font-mono text-[8px] uppercase tracking-wider">
                                  <th className="p-2">EAN-13 (Padded)</th>
                                  <th className="p-2">Brand</th>
                                  <th className="p-2">Designation</th>
                                  <th className="p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-emerald-50 text-slate-600">
                                  <td className="p-2 font-mono text-emerald-600 font-bold">0325654011202</td>
                                  <td className="p-2 font-mono">M&C</td>
                                  <td className="p-2">Carter principal P-8820</td>
                                  <td className="p-2"><span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">DÉDUPLIQUÉ</span></td>
                                </tr>
                                <tr className="border-b border-emerald-50 text-slate-600">
                                  <td className="p-2 font-mono">8839201928312</td>
                                  <td className="p-2 font-mono">CONVOYEUR</td>
                                  <td className="p-2">CONVOYEUR CV-250 v3</td>
                                  <td className="p-2"><span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">CONFORME</span></td>
                                </tr>
                                <tr className="border-b border-emerald-50 text-slate-600">
                                  <td className="p-2 font-mono text-emerald-600 font-bold">0551928301122</td>
                                  <td className="p-2 font-mono">M&C</td>
                                  <td className="p-2">M&C Bloc de contrôle BL-CTRL-A</td>
                                  <td className="p-2"><span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">DÉDUPLIQUÉ</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                </div>

              </div>
            </>
          )}

          {/* ------------------ SIMULATOR #4 : tablet-mdm-sentinel ------------------ */}
          {currentFeaturedProject.id === 'tablet-mdm-sentinel' && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Terminal size={16} className="text-indigo-600" />
                    Console Centrale de Contrôle MDM (Sentinel IoT)
                  </h3>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                    Supervision matérielle de flotte d'ateliers par protocoles MQTT
                  </p>
                </div>
                
                {/* Global kiosk switch */}
                <button
                  onClick={handleToggleGlobalKiosk}
                  className={`px-3.5 py-2 rounded-xl border text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    mdmKioskGlobal
                      ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {mdmKioskGlobal ? <Lock size={12} /> : <Unlock size={12} />}
                  <span>Kiosque Global : {mdmKioskGlobal ? 'Verrouillé 🔒' : 'Désactivé 🔓'}</span>
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 flex-grow">
                
                {/* Device cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mdmDevices.map((device) => {
                    const wifiColor = device.wifi === 'Excellent' 
                      ? 'text-emerald-500' 
                      : device.wifi === 'Good' 
                        ? 'text-blue-500' 
                        : device.wifi === 'Weak' 
                          ? 'text-amber-500' 
                          : 'text-rose-500 animate-pulse';

                    return (
                      <div 
                        key={device.name}
                        className={`bg-white border rounded-2xl p-4 space-y-4 transition-all shadow-xs relative overflow-hidden ${
                          device.status === 'Offline' ? 'border-rose-200 bg-rose-50/5' : 'border-slate-100'
                        }`}
                      >
                        {/* Device header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone size={16} className="text-indigo-600" />
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900 leading-none">{device.name}</h4>
                              <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">{device.location}</span>
                            </div>
                          </div>
                          
                          <span className={`inline-block w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                        </div>

                        {/* Battery, Wifi & Kiosk indicators */}
                        <div className="space-y-2 text-[10px] font-mono text-slate-500">
                          {/* Battery */}
                          <div className="flex items-center justify-between">
                            <span>Batterie :</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <div className="w-8 h-2.5 bg-slate-100 border border-slate-200 rounded-sm overflow-hidden flex items-center">
                                <div 
                                  className={`h-full ${device.battery <= 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${device.battery}%` }}
                                />
                              </div>
                              <span>{device.battery}%</span>
                            </div>
                          </div>

                          {/* Wifi */}
                          <div className="flex items-center justify-between">
                            <span>Wi-Fi :</span>
                            <span className={`font-bold ${wifiColor}`}>{device.wifi}</span>
                          </div>

                          {/* Kiosk lock status */}
                          <div className="flex items-center justify-between">
                            <span>Mode Kiosque :</span>
                            <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded-full ${
                              device.kiosk 
                                ? 'bg-rose-50 text-rose-600 font-extrabold' 
                                : 'bg-amber-50 text-amber-600 font-extrabold'
                            }`}>
                              {device.kiosk ? 'Restreint 🔒' : 'Maintenance 🔓'}
                            </span>
                          </div>
                        </div>

                        {/* Sim action triggers inside device */}
                        <div className="border-t border-slate-50 pt-3 flex flex-wrap gap-1.5">
                          {device.wifi !== 'Disconnected' ? (
                            <button
                              onClick={() => handleDeviceAction(device.name, 'disconnect')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-mono font-bold text-[8px] uppercase tracking-wider rounded-lg cursor-pointer flex-grow text-center"
                            >
                              Wi-Fi Off
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeviceAction(device.name, 'reconnect')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-mono font-bold text-[8px] uppercase tracking-wider rounded-lg cursor-pointer flex-grow text-center"
                            >
                              Wi-Fi On
                            </button>
                          )}

                          {device.battery > 15 ? (
                            <button
                              onClick={() => handleDeviceAction(device.name, 'drain_battery')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-mono font-bold text-[8px] uppercase tracking-wider rounded-lg cursor-pointer flex-grow text-center"
                            >
                              Vider Batt
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeviceAction(device.name, 'recharge')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-mono font-bold text-[8px] uppercase tracking-wider rounded-lg cursor-pointer flex-grow text-center"
                            >
                              Brancher
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* MQTT logs stream */}
                <div className="border border-slate-900 bg-slate-950 text-slate-300 rounded-2xl p-5 space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-indigo-400 block border-b border-indigo-900/40 pb-1.5 flex items-center justify-between">
                    <span>Journal de flux MQTT centralisé (Sentinelle MDM Daemon)</span>
                    <span className="text-[8px] font-mono text-slate-500 font-bold">Broker: broker.mdm.rubanor.local</span>
                  </span>
                  
                  <div className="font-mono text-[9px] space-y-1.5 max-h-40 overflow-y-auto leading-relaxed">
                    {mdmLogs.map((log, i) => (
                      <div key={i} className="text-emerald-400/90 whitespace-pre-wrap">{log}</div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

      </div>

      {/* -------------------- OTHER TECH PROJECTS LIST (CLASSIFIED) -------------------- */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Catalogue Global de l'Ingénierie de Claudel Mubenzem</h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-1">
            Cliquez sur un projet pour le charger dans le simulateur ci-dessus et tester ses briques applicatives
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProjects.map((proj) => {
            const IconComponent = proj.category === 'erp-systems' 
              ? Layers 
              : proj.category === 'automation' 
                ? Database 
                : proj.category === 'infra' 
                  ? Terminal 
                  : Cpu;

            const isCurrentInSpotlight = proj.id === currentFeaturedProject.id;

            return (
              <div 
                key={proj.id}
                className={`bg-white border rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 cursor-pointer ${
                  isCurrentInSpotlight 
                    ? 'ring-2 ring-indigo-600 border-indigo-200' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                onClick={() => selectFeaturedProjectById(proj.id)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 flex items-center justify-center">
                      <IconComponent size={16} />
                    </div>
                    
                    <span className="font-mono text-[8px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full">
                      {proj.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {proj.tag}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">{proj.title}</h4>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3">
                    {proj.shortDesc}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-50">
                    <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      Spécifications de performance :
                    </span>
                    <ul className="space-y-1">
                      {proj.metrics.slice(0, 2).map((m, idx) => (
                        <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1 leading-relaxed">
                          <span className="text-indigo-500 shrink-0">✔</span>
                          <span className="line-clamp-1">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.slice(0, 3).map(t => (
                      <span key={t} className="font-mono text-[9px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                    {proj.technologies.length > 3 && (
                      <span className="font-mono text-[9px] font-semibold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md">
                        +{proj.technologies.length - 3}
                      </span>
                    )}
                  </div>

                  {isCurrentInSpotlight ? (
                    <span className="w-full text-center py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl font-mono text-[9px] uppercase font-extrabold text-indigo-600 block">
                      🟢 En cours de test
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFeaturedProjectById(proj.id);
                      }}
                      className="w-full text-center py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-mono text-[9px] uppercase font-extrabold text-slate-700 hover:text-slate-950 transition-colors block cursor-pointer"
                    >
                      Tester le simulateur ➔
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
