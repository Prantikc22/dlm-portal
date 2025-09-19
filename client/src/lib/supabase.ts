// Note: According to the Supabase blueprint, we should use Drizzle directly
// instead of @supabase/supabase-js for database operations.
// The authentication is handled by the backend API.

// Simple HTTP client for API calls (keeping for backward compatibility)
export const apiClient = {
  get: async (url: string, headers: Record<string, string> = {}) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  post: async (url: string, data: any, headers: Record<string, string> = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  put: async (url: string, data: any, headers: Record<string, string> = {}) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  delete: async (url: string, headers: Record<string, string> = {}) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

// Auth helpers
export const getAuthHeaders = (): Record<string, string> => {
  // First try to get JWT token
  const token = localStorage.getItem('token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  
  // Fall back to header-based auth for backward compatibility
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.email) {
      return {
        'x-user-email': userData.email,
      };
    }
  }
  return {};
};

export const authenticatedApiClient = {
  get: (url: string) => apiClient.get(url, getAuthHeaders()),
  post: (url: string, data: any) => apiClient.post(url, data, getAuthHeaders()),
  put: (url: string, data: any) => apiClient.put(url, data, getAuthHeaders()),
  delete: (url: string) => apiClient.delete(url, getAuthHeaders()),
};
