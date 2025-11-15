
import React from 'react';
// Fix: Use a named import for the Character component.
import { Character } from './Character';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white p-8 bg-black bg-opacity-30 rounded-2xl shadow-2xl backdrop-blur-sm">
      <h1 className="text-5xl md:text-7xl font-bold text-yellow-300 drop-shadow-lg mb-2">
        한글 받아쓰기 명사수
      </h1>
      <p className="text-xl md:text-2xl mb-8">
        활을 쏘아 떨어지는 글자를 맞춰 문장을 완성해요!
      </p>
      {/* Updated to correctly center the Character component */}
      <div className="w-32 h-32 my-4 flex items-center justify-center">
        <Character />
      </div>
      <button
        onClick={onStart}
        className="px-12 py-4 bg-green-500 text-white text-3xl font-bold rounded-full shadow-lg transform hover:scale-105 active:scale-100 transition-transform duration-200 ease-in-out"
      >
        시작하기
      </button>
    </div>
  );
};

export default StartScreen;