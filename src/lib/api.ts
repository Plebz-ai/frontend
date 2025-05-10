const API_BASE_URL = '/api';

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
    // Always set is_custom true for created characters
    data.is_custom = true;
    console.log('Making API request to:', `${API_BASE_URL}/characters`);
    console.log('Request data:', data);
    
    try {
      const token = getAuthToken();
      const headers = createHeaders(token);
      
      let body: string | FormData;
      let requestHeaders = headers;
      
      // If there's an avatar file, use FormData
      if (data.avatar) {
        // Create a new FormData instance
        const formData = new FormData();
        
        // Convert the image to base64 for more reliable transfer
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.avatar as File);
        });
        
        // Add all text fields
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'avatar') {
            // Skip avatar for now - we'll use the base64 version
          } else if (key === 'tags' && Array.isArray(value)) {
            // Convert tags array to string
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });
        
        // Add the avatar as base64 string
        formData.append('avatar_base64', base64Image);
        formData.append('avatar_filename', (data.avatar as File).name);
        
        // Also add the regular file as fallback
        formData.append('avatar', data.avatar);
        
        body = formData;
        // Remove Content-Type header for FormData
        requestHeaders.delete('Content-Type');
      } else {
        // Use JSON if no file
        body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: requestHeaders,
        body,
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
    const headers = createHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/characters`, {
      ...baseFetchConfig,
      headers
    });

    if (response.status === 401) {
      throw new Error('401: User not authenticated');
    }
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch characters');
    }

    return response.json();
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