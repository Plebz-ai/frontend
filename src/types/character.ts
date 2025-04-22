export interface Character {
  id: number;
  name: string;
  description: string;
  personality: string;
  voice_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  name: string;
  description: string;
  personality: string;
  voice_type: string;
} 