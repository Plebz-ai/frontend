'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CharacterCard from '@/components/character/CharacterCard';
import { Character } from '@/types/character';
import { useRouter } from 'next/navigation';
import { characterApi } from '@/lib/api';
import { FaPlus, FaSearch } from 'react-icons/fa';

export default function CharactersPage() {
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  
  // Filter characters based on search query
  const filteredCharacters = allCharacters.filter(char => 
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render a category section
  const renderSection = (title: string, characters: Character[], isEmpty: boolean) => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-5">{title}</h2>
      {characters.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="p-6 bg-[#151722] rounded-xl text-center border border-[#292d3e]">
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
    <div className="min-h-screen bg-[#0d0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-400">Discover and chat with AI characters</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search Characters"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151722] text-gray-300 pl-9 pr-3 py-2 rounded-xl border border-[#292d3e] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
              />
            </div>
            
            <Link 
              href="/create" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
            >
              <FaPlus className="h-3.5 w-3.5" />
              <span>Create</span>
            </Link>
          </div>
        </header>

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
            <div className="bg-[#151722] p-8 rounded-xl border border-[#292d3e] max-w-md mx-auto">
              <h3 className="text-xl font-medium text-white mb-3">No characters yet</h3>
              <p className="text-gray-400 mb-6">Start by creating your first AI character.</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
              >
                <FaPlus className="h-3.5 w-3.5" />
                <span>Create Character</span>
              </Link>
            </div>
          </div>
        ) : searchQuery ? (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-5">Search Results</h2>
            {filteredCharacters.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCharacters.map((character) => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#151722] rounded-xl text-center border border-[#292d3e]">
                <p className="text-gray-400">No characters found matching "{searchQuery}"</p>
              </div>
            )}
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