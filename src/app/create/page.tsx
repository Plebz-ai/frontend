import CharacterCreationForm from '../../components/character/CharacterCreationForm'
import React from 'react'

export default function CreateCharacter() {
  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center mb-6">
          Create Your AI Character
        </h1>
        
        <div className="bg-[#0f1117]/80 backdrop-blur-sm shadow-2xl rounded-xl overflow-hidden border border-gray-800">
          <div className="p-4 sm:p-6">
            <CharacterCreationForm />
          </div>
        </div>
      </div>
    </div>
  )
} 