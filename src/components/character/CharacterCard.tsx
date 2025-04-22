'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/types/character';
import Image from 'next/image';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter();
  
  // Default placeholder image if no avatar is available
  const avatarSrc = character.avatar_url || '/placeholder-avatar.png';
  
  // Format view count with abbreviations (k, m)
  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'm';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };
  
  // Default view count for demo (can be replaced with actual data)
  const viewCount = character.view_count || Math.floor(Math.random() * 10000000);

  return (
    <div
      className="bg-[#1e1e24] overflow-hidden shadow-lg rounded-xl transition-all hover:shadow-xl cursor-pointer border border-white/5"
      onClick={() => router.push(`/characters/${character.id}`)}
    >
      <div className="flex p-4 sm:p-5">
        {/* Avatar Image */}
        <div className="flex-shrink-0 mr-4">
          <div className="h-24 w-24 rounded-lg overflow-hidden relative">
            <Image 
              src={avatarSrc}
              alt={character.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <h3 className="text-xl font-semibold text-white truncate">{character.name}</h3>
          <p className="text-sm text-gray-400 mb-1">By @{character.creator || 'user'}</p>
          
          <p className="text-sm text-gray-300 line-clamp-2 mb-auto">
            {character.description || "No description available"}
          </p>
          
          {/* Metrics */}
          <div className="flex items-center mt-2 text-sm text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{formatViewCount(viewCount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 