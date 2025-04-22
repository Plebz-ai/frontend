'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CharacterCard from '@/components/character/CharacterCard';
import { Character } from '@/types/character';
import { useRouter } from 'next/navigation';
import { characterApi } from '@/lib/api';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        // Verify if user is logged in
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          // Redirect to login if no token found
          router.push('/login');
          return;
        }

        // Use the api module to fetch characters
        const data = await characterApi.list();
        setCharacters(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching characters:', error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('401')) {
          localStorage.removeItem('auth_token');
          router.push('/login');
          return;
        }
        
        setError('Failed to load characters. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            AI Characters
          </h1>
          <Link 
            href="/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Character
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="mt-2 text-lg font-medium text-red-600">{error}</h3>
            <p className="mt-1 text-sm text-gray-500">Please try again later or contact support.</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No characters found</h3>
            <p className="mt-1 text-sm text-gray-500">Start by creating your first AI character.</p>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Character
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 