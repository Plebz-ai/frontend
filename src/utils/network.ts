/**
 * Network utility functions for diagnosing and handling API connectivity issues
 */

export interface NetworkCheckResult {
  online: boolean;
  serverReachable: boolean;
  corsEnabled: boolean;
  error?: string;
}

// Helper function to check if the browser is online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Function to check if the API server is reachable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
export const checkApiServerHealth = async (url: string = API_BASE_URL): Promise<NetworkCheckResult> => {
  const result: NetworkCheckResult = {
    online: isOnline(),
    serverReachable: false,
    corsEnabled: false
  };
  
  if (!result.online) {
    result.error = 'You are currently offline. Please check your internet connection.';
    return result;
  }
  
  try {
    console.log('Checking API health at:', url);
    
    // Try a simple GET request to check if server is responding
    // Using timestamp to bypass cache
    const timestamp = new Date().getTime();
    const response = await fetch(`${url}/health?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Health check response status:', response.status);
    
    // Any response means the server is reachable
    result.serverReachable = true;
    
    // Even 404 is okay for our purposes - it means the server is responding
    if (response.status === 404) {
      console.log('Health endpoint not found, but server is responding');
    }
    
    // Assume CORS is fine with Next.js API routes or proxy
    result.corsEnabled = true;
    
  } catch (error) {
    result.serverReachable = false;
    result.error = error instanceof Error ? 
      `Server connectivity error: ${error.message}` : 
      'Unknown server connectivity error';
    console.error('API connectivity check failed:', error);
  }
  
  return result;
};

// Enhanced fetch function with better error handling
export const enhancedFetch = async (
  url: string,
  options: RequestInit = {},
  retry = 1
): Promise<Response> => {
  let lastError: Error | undefined;
  
  // Try up to 'retry' times
  for (let attempt = 0; attempt < retry; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      // If server responds with error, no need to retry
      if (response.status >= 400) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Server error with status: ${response.status}` };
        }
        const errorMessage = errorData.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // For other non-ok responses, allow retry
      lastError = new Error(`Request failed with status: ${response.status}`);
      
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // This is likely a network connectivity issue
        lastError = new Error('Unable to reach the server. Please check your internet connection and ensure the backend service is running.');
      } else {
        lastError = error instanceof Error ? error : new Error('Unknown fetch error');
      }
      
      // Only continue retry loop if we haven't reached the limit
      if (attempt === retry - 1) {
        throw lastError;
      }
      
      console.log(`Retry attempt ${attempt + 1}/${retry} after error:`, lastError.message);
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error occurred during fetch');
};