export interface Character {
  id: number
  name: string
  description: string
  personality: string
  voice_type: string
  created_at: string
  updated_at: string
}

export interface CreateCharacterRequest {
  name: string
  description: string
  personality: string
  voiceType: string
}

export const characterApi: {
  create: (data: CreateCharacterRequest) => Promise<Character>
  list: () => Promise<Character[]>
  get: (id: string) => Promise<Character>
} 