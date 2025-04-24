'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/types/character';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaComment } from 'react-icons/fa';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  
  // Default placeholder image if no avatar is available
  const avatarSrc = character.avatar_url || '/placeholder-avatar.png';
  
  // Format interaction count with abbreviations (k, m)
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'm';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };
  
  // Default interaction count for demo (can be replaced with actual data)
  const interactionCount = character.view_count || Math.floor(Math.random() * 1000000);

  return (
    <motion.div
      className="group bg-[#151722] overflow-hidden rounded-xl cursor-pointer border border-[#292d3e] hover:border-indigo-500/50 transition-all duration-300"
      onClick={() => router.push(`/characters/${character.id}`)}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Character Image/Avatar */}
      <div className="w-full aspect-[3/2] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-transparent to-transparent z-10"></div>
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-800/30 to-purple-800/30">
            <span className="text-6xl font-bold text-white/30">{character.name.charAt(0).toUpperCase()}</span>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <Image 
              src={avatarSrc}
              alt={character.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              unoptimized={!character.avatar_url} // Skip Next.js optimization for placeholder images
            />
          </div>
        )}
        
        {/* Creator badge */}
        <div className="absolute bottom-3 left-3 z-20">
          <div className="text-xs px-2 py-1 rounded-full bg-black/60 text-gray-300 backdrop-blur-sm">
            @{character.creator || 'user'}
          </div>
        </div>
      </div>
      
      {/* Character Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-indigo-300 transition-colors">
          {character.name}
        </h3>
        
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 min-h-[2.5rem]">
          {character.description || "No description available"}
        </p>
        
        {/* Interaction Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FaComment className="w-3 h-3" />
            <span>{formatCount(interactionCount)}</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {character.personality && character.personality.split(',').slice(0, 2).map((trait, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 text-xs rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/30"
              >
                {trait.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Interactive indicator */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </motion.div>
  );
} 