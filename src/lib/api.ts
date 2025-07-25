const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// User and Authentication interfaces
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Character interfaces
export interface Character {
  id: number;
  name: string;
  description: string;
  personality: string;
  voice_type: string;
  tagline?: string;
  greeting?: string;
  dynamicGreetings?: boolean;
  tags?: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_custom?: boolean;
}

export interface CreateCharacterRequest {
  name: string;
  description: string;
  personality: string;
  voice_type: string;
  tagline: string;
  greeting: string;
  dynamicGreetings: boolean;
  tags: string[];
  avatar?: File | null;
  is_custom?: boolean;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Base fetch configuration
const baseFetchConfig: RequestInit = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
};

// Helper function to create headers with auth token
const createHeaders = (token: string | null): Headers => {
  const headers = new Headers(baseFetchConfig.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

// Auth API endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      ...baseFetchConfig,
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Login failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      ...baseFetchConfig,
      body: JSON.stringify({ name, email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Signup failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  me: async (): Promise<User> => {
    const token = getAuthToken();
    const headers = createHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      ...baseFetchConfig,
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  },
  
  logout: async (): Promise<void> => {
    // For token-based auth, we just remove the token on the client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
};

// Character API endpoints
export const characterApi = {
  create: async (data: CreateCharacterRequest): Promise<Character> => {
    // Send all fields to backend
    const payload: any = { ...data };
    if (data.avatar_url) {
      payload.avatar = data.avatar_url;
    }
    // Debug: log outgoing payload
    console.log('Character creation payload:', payload);
    try {
      const token = getAuthToken();
      const headers = createHeaders(token);
      let body: string | FormData;
      let requestHeaders = headers;
      if (payload.avatar) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === 'avatar') {
            if (typeof value === 'string') {
              formData.append('avatar_base64', value);
              formData.append('avatar_filename', 'avatar.png');
            } else if (value instanceof File) {
              formData.append('avatar', value);
              formData.append('avatar_filename', value.name);
            }
          } else if (['traits', 'goals', 'fears', 'relationships'].includes(key) && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });
        body = formData;
        requestHeaders.delete('Content-Type');
      } else {
        body = JSON.stringify(payload);
      }
      const res = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: requestHeaders,
        body,
      });
      if (!res.ok) {
        let msg = 'Failed to create character';
        try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create character');
    }
  },

  list: async (): Promise<Character[]> => {
    // Legacy: fetches only characters with conversations
    const token = getAuthToken();
    const headers = createHeaders(token);
    const res = await fetch(`${API_BASE_URL}/characters`, { headers });
    if (!res.ok) throw new Error('Failed to fetch characters');
    return res.json();
  },

  listAll: async (): Promise<Character[]> => {
    // New: fetches all characters
    const token = getAuthToken();
    const headers = createHeaders(token);
    const res = await fetch(`${API_BASE_URL}/characters/all`, { headers });
    if (!res.ok) throw new Error('Failed to fetch all characters');
    return res.json();
  },

  get: async (id: string): Promise<Character> => {
    const token = getAuthToken();
    const headers = createHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      ...baseFetchConfig,
      headers
    });
    
    if (response.status === 401) {
      throw new Error('401: User not authenticated');
    }
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch character');
    }

    return response.json();
  },
};