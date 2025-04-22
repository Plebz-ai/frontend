'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

  const testSignup = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Debug User',
          email: 'debug@example.com',
          password: 'Debug@123',
        }),
      });

      const data = await response.json();
      setResponse({
        status: response.status,
        data,
        ok: response.ok,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Debug error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <button
        onClick={testSignup}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Signup API'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold">Error:</h2>
          <pre className="mt-2 overflow-auto">{error}</pre>
        </div>
      )}
      
      {response && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h2 className="font-bold">Response (Status: {response.status}):</h2>
          <pre className="mt-2 overflow-auto">{JSON.stringify(response.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 