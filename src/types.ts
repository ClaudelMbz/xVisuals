export interface Project {
  id: string;
  title: string;
  category: 'automation' | 'erp' | 'ia';
  shortDesc: string;
  fullDesc: string;
  technologies: string[];
  metrics: string[];
  icon: string;
  lessonsLearned: string;
}

export interface VeilleArticle {
  id: string;
  title: string;
  event: string;
  date: string;
  summary: string;
  sections: { title: string; content: string }[];
  tags: string[];
}

export interface AcademicStep {
  period: string;
  degree: string;
  institution: string;
  location: string;
  description: string;
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  description: string;
  bullets: string[];
  skillsBuilt: string[];
}
