'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/types/character';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter();

  return (
    <div
      className="bg-white overflow-hidden shadow rounded-lg transition-all hover:shadow-lg cursor-pointer"
      onClick={() => router.push(`/characters/${character.id}`)}
    >
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 truncate">{character.name}</h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-3">{character.description}</p>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <span className="truncate">
            Voice: {character.voice_type}
          </span>
          <span className="ml-auto flex-shrink-0 text-xs">
            {new Date(character.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
} 