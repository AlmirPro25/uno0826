export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64 encoded data
}

export interface GroundingSource {
  uri: string;
  title: string;
  type: 'web' | 'maps';
}

export interface GenerationConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

export interface ProductData {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  url: string;
  image: string;
  condition: string;
  seller: {
    name: string;
    reputation: string | null;
  };
  shipping: {
    free: boolean;
    type: string | null;
  };
  installments: {
    quantity: number;
    amount: number;
    rate: number;
  } | null;
  source: string;
  marketplace: string;
  rank?: number;
  isTopDeal?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  suggestedPrompts?: string[];
  isInteractive?: boolean;
  htmlCode?: string;
  isEdited?: boolean;
  isLoading?: boolean; // For "thinking" state
  isThinking?: boolean; // For "deep thinking" state
  error?: string; // For displaying errors
  audioData?: string; // base64 encoded audio for TTS
  sources?: GroundingSource[];
  // New fields for video generation
  videoState?: 'pending' | 'generating' | 'completed' | 'failed';
  videoUri?: string; // This will be a blob URI
  generationProgress?: string;
  // New fields for product search
  products?: ProductData[] | any[]; // Aceita qualquer formato de produto
  productQuery?: string;
  comparison?: any; // Comparação de preços
  // New fields for search results with images
  searchResults?: Array<{
    title: string;
    url: string;
    snippet?: string;
    image?: string;
    source: string;
  }>;
  searchQuery?: string;
  // Metadata genérico para dados adicionais
  metadata?: any;
  // New field for enriched browser results
  enrichedResult?: {
    url: string;
    title: string;
    summary: string;
    images: Array<{
      src: string;
      alt?: string;
      caption?: string;
    }>;
    links: Array<{
      text: string;
      href: string;
    }>;
    screenshot?: string;
  };
  // Rich media content
  richMedia?: Array<{
    type: 'image' | 'video' | 'link' | 'product';
    src?: string;
    url?: string;
    title?: string;
    description?: string;
    price?: string;
    thumbnail?: string;
  }>;
  // AI Summary
  aiSummary?: string;
}

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
  type: 'text' | 'image' | 'video';
}

export interface Persona {
  id: string;
  name: string;
  prompt: string;
  icon: string;
  // Meta-Persona fields
  domain?: string;
  capabilities?: string[];
  communicationStyle?: string;
  reasoning?: string;
  isGenerated?: boolean;
  createdAt?: number;
  refinedAt?: number;
  isTeamMember?: boolean;
  teamRole?: string;
  // Neural Architect fields
  color?: string;
}

export interface Chat {
  id:string;
  title: string;
  messages: Message[];
  createdAt: number;
  generationConfig: GenerationConfig;
}

// New types for Library and Projects
export type LibraryItemType = 'code' | 'prompt' | 'persona' | 'theme';

export interface LibraryItem {
  id: string;
  type: LibraryItemType;
  name: string;
  content: string | object; // Can be code string or a theme object
  tags: string[];
  createdAt: number;
}

export interface ProjectFile {
  path: string;
  content: string;
  lastModified: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  chats: Chat[];
  files: ProjectFile[];
  libraryItems: LibraryItem[];
  createdAt: number;
}