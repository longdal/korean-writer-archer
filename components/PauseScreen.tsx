
import React from 'react';

interface PauseScreenProps {
  onResume: () => void;
  onQuit: () => void;
}

const PauseScreen: React.FC<PauseScreenProps> = ({ onResume, onQuit }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-8 bg-black bg-opacity-70 rounded-2xl shadow-2xl backdrop-blur-sm z-20">
      <h2 className="text-6xl font-bold mb-8 text-yellow-300 drop-shadow-lg">
        게임 일시정지
      </h2>
      <button
        onClick={onResume}
        className="px-16 py-5 bg-green-500 text-white text-4xl font-bold rounded-full shadow-lg transform hover:scale-105 active:scale-100 transition-transform duration-200 ease-in-out mb-6"
      >
        재개하기
      </button>
      <button
        onClick={onQuit}
        className="px-16 py-5 bg-red-600 text-white text-4xl font-bold rounded-full shadow-lg transform hover:scale-105 active:scale-100 transition-transform duration-200 ease-in-out"
      >
        종료하기
      </button>
    </div>
  );
};

export default PauseScreen;
