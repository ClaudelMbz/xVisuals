import { Project, VeilleArticle, AcademicStep, ExperienceItem } from '../types';

export const projectsData: Project[] = [
  {
    id: 'ean-reconciliation',
    title: 'Automatisation de Rapprochement EAN',
    category: 'automation',
    shortDesc: 'Script Python haute-performance pour réconcilier des bases de données catalogues et codes articles (EAN-13).',
    fullDesc: 'Développement d’un algorithme optimisé sous Pandas pour identifier les écarts, nettoyer les formats corrompus et fusionner les données provenant de grossistes hétérogènes. Idéal pour aligner les stocks physiques avec le catalogue numérique de l\'entreprise.',
    technologies: ['Python', 'Pandas', 'OpenPyXL', 'Matplotlib'],
    metrics: [
      'Plus de 50 000 lignes traitées en < 2 secondes',
      '99.8% de taux de réconciliation automatisé',
      'Économie estimée à 12h de travail manuel par semaine'
    ],
    icon: 'Database',
    lessonsLearned: 'La gestion pragmatique des valeurs manquantes et des formats de chaînes irréguliers est critique dans le retail d\'aujourd\'hui.'
  },
  {
    id: 'open-prod-erp',
    title: 'Déploiement ERP & Gestion de Flotte Android',
    category: 'erp',
    shortDesc: 'Implémentation du progiciel Open-Prod et mise en service d’une flotte industrielle connectée.',
    fullDesc: 'Conception et paramétrage fonctionnel du module de gestion de production intégré (Open-Prod) en milieu industriel. Mise en place parallèle d’une gestion centralisée de parc applicatif (MDM) pour tablettes opérationnelles en atelier.',
    technologies: ['Open-Prod ERP', 'Mobile Device Management (MDM)', 'Android Enterprise', 'PostgreSQL'],
    metrics: [
      '30+ tablettes industrielles déployées sur atelier',
      'Centralisation ERP en temps réel',
      'Zéro interruption de chaîne durant la migration'
    ],
    icon: 'Layers',
    lessonsLearned: 'Le véritable défi de l\'ERP n\'est pas la configuration technique, mais la conduite du changement auprès des techniciens d\'atelier.'
  },
  {
    id: 'ia-studio-pipeline',
    title: 'Expérimentations de Pipelines Génératifs',
    category: 'ia',
    shortDesc: 'Développement de prototypes d\'analyse textuelle à l\'aide d\'interfaces API d\'IA Générative.',
    fullDesc: 'Mise en place de flux asynchrones couplant des modèles de langage (famille Gemini) à des outils d\'analyse structurés pour générer de manière autonome des métadonnées enrichies à partir de flux documentaires d\'usine.',
    technologies: ['Google GenAI SDK', 'TypeScript', 'Node.js', 'JSON Schema Validation'],
    metrics: [
      'Extraction sémantique 100% fiable par schéma JSON',
      'Intégration d’API asynchrone robuste',
      'Génération automatisée de descriptions techniques'
    ],
    icon: 'Cpu',
    lessonsLearned: 'L\'encapsulation rigide des sorties de modèles via des schémas JSON natifs est indispensable pour des flux industriels de production.'
  }
];

export const articlesData: VeilleArticle[] = [
  {
    id: 'ibm-tech-xchange',
    title: 'Retour d\'expérience : IBM TechXchange 2025',
    event: 'IBM TechXchange Paris',
    date: 'Novembre 2025',
    summary: 'Analyse des tendances en matière de gouvernance IA et de architectures hybrides d\'intégration de données massives.',
    sections: [
      {
        title: 'Gouvernance de la Donnée & IA de Confiance',
        content: 'La gestion rigoureuse de la traçabilité des données d\'alimentation de modèles de prédiction s\'impose comme l\'enjeu numéro un pour moderniser les architectures de confiance.'
      },
      {
        title: 'Architectures Lac de Données Hybrides',
        content: 'Examen des stratégies de virtualisation de données permettant d\'exécuter des jointures logiques d\'entreprises entre serveurs locaux et instances Cloud publiques sans déplacement physique d\'octets.'
      }
    ],
    tags: ['Gouvernance', 'IBM watsonx', 'Lakehouse', 'Integration']
  },
  {
    id: 'apidays-fost',
    title: 'Synthèse des Conférences apidays & FOST',
    event: 'apidays Global / FOST Forum',
    date: 'Mars 2026',
    summary: 'Tendances émergentes sur les écosystèmes d\'API ouverts, l\'informatique décisionnelle et les ERP composites.',
    sections: [
      {
        title: 'Économie des API & ERP Modulaires',
        content: 'La transition des grands systèmes d\'information rigides vers des architectures d\'API composites permet d\'interconnecter des serveurs de production spécifiques à une vitesse supérieure.'
      },
      {
        title: 'Green IT & Optimisation de Flux',
        content: 'Optimisation de la consommation énergétique des serveurs d\'acquisition industriels en réduisant le cycle de scrutation (polling) au profit de Webhooks intelligents.'
      }
    ],
    tags: ['API Management', 'ERP Agile', 'Green IT', 'Architecture']
  }
];

export const academicJourney: AcademicStep[] = [
  {
    period: '2025 - Présent',
    degree: 'Cycle Ingénieur Spécialisation Data, Systèmes d\'Information & ERP',
    institution: 'ECE Paris / Lyon',
    location: 'Lyon, France',
    description: 'Approfondissement des matières centrales : modélisation de bases de données relationnelles et Big Data, architecture de systèmes d\'information distribués, et intégration des ERP modernes.'
  },
  {
    period: '2022 - 2025',
    degree: 'Prépa & Début Cycle Ingénieur Généraliste',
    institution: 'ICAM (Institut Catholique d\'Arts et Métiers)',
    location: 'Lyon, France',
    description: 'Solide formation pluridisciplinaire en sciences physiques, algorithmique, gestion de projet industrielle et pensée systémique. Transition réussie vers l\'anglais d\'ingénierie.'
  }
];

export const professionalExperience: ExperienceItem[] = [
  {
    period: 'Février - Juillet 2025',
    role: 'Assistant Ingénieur ERP & Systèmes d\'Information',
    company: 'Rubanor',
    description: 'Pilotage technique et fonctionnel de la migration d\'outils de gestion de production industrielle vers un système intégré.',
    bullets: [
      'Modélisation des règles de gestion de stock et intégration avec l’ERP Open-Prod.',
      'Industrialisation d\'un script de rapprochement des codes barres et des références clients.',
      'Administration et sécurisation d\'une flotte mobile de collecte réseau d\'atelier (MDM).'
    ],
    skillsBuilt: ['Open-Prod ERP', 'Pandas Scripting', 'Industrial MDM', 'Process Optimization']
  }
];
