const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'

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
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  name: string;
  description: string;
  personality: string;
  voice_type: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Auth API endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Login failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Signup failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  me: async (): Promise<User> => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers,
      mode: 'cors',
      credentials: 'omit'
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
    console.log('Making API request to:', `${API_BASE_URL}/characters`);
    console.log('Request data:', data);
    
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `Failed to create character: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      return result;
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  },

  list: async (): Promise<Character[]> => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/characters`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch characters');
    }

    return response.json();
  },

  get: async (id: string): Promise<Character> => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch character');
    }

    return response.json();
  },
}; 