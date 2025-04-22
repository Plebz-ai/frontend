'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CharacterCard from '@/components/character/CharacterCard';
import { Character } from '@/types/character';
import { useRouter } from 'next/navigation';
import { characterApi } from '@/lib/api';

export default function CharactersPage() {
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Categorized characters
  const [forYouCharacters, setForYouCharacters] = useState<Character[]>([]);
  const [featuredCharacters, setFeaturedCharacters] = useState<Character[]>([]);
  const [popularCharacters, setPopularCharacters] = useState<Character[]>([]);

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
        setAllCharacters(data);
        
        // For demo purposes, categorize characters randomly
        // In a real app, these would come from separate API endpoints or be categorized by the server
        if (data.length > 0) {
          // Shuffle the array to randomize
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          
          setForYouCharacters(shuffled.slice(0, Math.min(3, shuffled.length)));
          setFeaturedCharacters(shuffled.slice(Math.min(3, shuffled.length), Math.min(6, shuffled.length)));
          setPopularCharacters(shuffled.slice(Math.min(6, shuffled.length), Math.min(9, shuffled.length)));
        }
        
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
  
  // Render a category section
  const renderSection = (title: string, characters: Character[], isEmpty: boolean) => (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      {characters.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="p-6 bg-gray-900/50 rounded-lg text-center">
          <p className="text-gray-400">No characters found. Create some to get started!</p>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI Characters
          </h1>
          <Link 
            href="/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Character
          </Link>
        </div>

        {loading && allCharacters.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="mt-2 text-lg font-medium text-red-400">{error}</h3>
            <p className="mt-1 text-sm text-gray-400">Please try again later or contact support.</p>
          </div>
        ) : allCharacters.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="mt-2 text-lg font-medium text-white">No characters found</h3>
            <p className="mt-1 text-sm text-gray-400">Start by creating your first AI character.</p>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Character
              </Link>
            </div>
          </div>
        ) : (
          <>
            {renderSection("For you", forYouCharacters, allCharacters.length === 0)}
            {renderSection("Featured", featuredCharacters, allCharacters.length === 0)}
            {renderSection("Popular", popularCharacters, allCharacters.length === 0)}
          </>
        )}
      </div>
    </div>
  );
} 