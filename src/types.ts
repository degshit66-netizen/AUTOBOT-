export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string; // 'facebook', 'web', 'sms', 'manual'
  status: 'new' | 'contacted' | 'proposal' | 'won' | 'lost';
  notes: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[]; // ['facebook', 'instagram', 'linkedin', 'google']
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'failed';
  imageUrl?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1 to 5
  content: string;
  platform: 'google' | 'facebook';
  status: 'unanswered' | 'responded';
  aiResponse?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface ChatbotRule {
  botName: string;
  systemPrompt: string;
  welcomeMessage: string;
  isActive: boolean;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: 'user' | 'bot' | 'lead';
  message: string;
  createdAt: string;
}

export interface FBProfile {
  id: string;
  name: string;
  picture?: string;
}

export interface FBPage {
  id: string;
  name: string;
  accessToken: string;
  category?: string;
  picture?: string;
}
