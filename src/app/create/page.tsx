import CharacterCreationForm from '../../components/character/CharacterCreationForm'
import React from 'react'

export default function CreateCharacter() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-8">
            Create Your AI Character
          </h1>
          
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <CharacterCreationForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 