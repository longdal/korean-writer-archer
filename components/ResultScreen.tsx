
import React from 'react';

interface ResultScreenProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ score, onRestart, totalQuestions }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white p-8 bg-black bg-opacity-30 rounded-2xl shadow-2xl backdrop-blur-sm">
      <h2 className="text-5xl font-bold mb-4 text-yellow-300">참 잘했어요!</h2>
      <p className="text-2xl mb-2">총 점수</p>
      <p className="text-7xl font-bold mb-8">{score}</p>
      <p className="text-xl mb-8">{totalQuestions} 문제 중 {score / 10}개를 맞췄어요.</p>
      <button
        onClick={onRestart}
        className="px-12 py-4 bg-blue-500 text-white text-3xl font-bold rounded-full shadow-lg transform hover:scale-105 active:scale-100 transition-transform duration-200 ease-in-out"
      >
        다시하기
      </button>
    </div>
  );
};

export default ResultScreen;
