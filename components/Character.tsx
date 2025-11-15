
import React from 'react';

interface CharacterProps {
  // x and isCentered props are removed as positioning is now handled by parent components.
}

const Character: React.FC<CharacterProps> = () => {
  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 128 128"
      fill="gold"
      stroke="gold"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Main body of the crossbow */}
      <line x1="64" y1="20" x2="64" y2="110" />
      {/* Crossbar */}
      <line x1="24" y1="30" x2="104" y2="30" />
      {/* Handle/stock */}
      <line x1="64" y1="110" x2="44" y2="100" />
      <line x1="64" y1="110" x2="84" y2="100" />
      {/* Simple trigger */}
      <path d="M64 100 L64 118 L70 118 L70 100 Z" fill="gold" stroke="none"/>
    </svg>
  );
};

export { Character };