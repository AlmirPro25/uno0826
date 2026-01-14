
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  address: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai' | 'system';
  text: string;
}