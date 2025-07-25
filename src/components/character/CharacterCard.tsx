'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Character } from '@/types/character';
import { 
  MessageCircle, 
  Video, 
  Heart, 
  Eye, 
  User, 
  Sparkles,
  Crown,
  Clock,
  Calendar
} from 'lucide-react';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Link href={`/characters/${character.id}`}>
        <div className="card-modern h-full cursor-pointer group-hover:scale-105 transition-all duration-500">
          {/* Character Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center">
                {character.avatar_url ? (
                  <img 
                    src={character.avatar_url} 
                    alt={character.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {getInitials(character.name)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-gradient transition-colors">
                  {character.name}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(character.created_at)}</span>
                </div>
              </div>
            </div>
            {character.is_custom && (
              <div className="flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-teal-400/20 to-blue-500/20 border border-teal-400/30">
                <Sparkles className="w-3 h-3 text-teal-400 mr-1" />
                <span className="text-xs text-teal-400 font-medium">Custom</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-300 mb-4 leading-relaxed text-sm line-clamp-3">
            {character.description}
          </p>

          {/* Personality Preview */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">Personality</div>
            <p className="text-gray-300 text-sm line-clamp-2">
              {character.personality}
            </p>
          </div>

          {/* Voice Type */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
              <span className="text-xs text-gray-400">Voice: {character.voice_type}</span>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              {character.view_count !== undefined && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{character.view_count.toLocaleString()}</span>
                </div>
              )}
              {character.creator && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-20">{character.creator}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 rounded-lg hover:bg-white/5 transition-colors group-hover:scale-110"
                onClick={(e) => e.preventDefault()}
              >
                <Heart className="w-4 h-4" />
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-white/5 transition-colors group-hover:scale-110"
                onClick={(e) => e.preventDefault()}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-white/5 transition-colors group-hover:scale-110"
                onClick={(e) => e.preventDefault()}
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 