
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import ResultScreen from './components/ResultScreen';
import PauseScreen from './components/PauseScreen'; // Import PauseScreen
import { GameStatus } from './types';
import { SENTENCES } from './constants';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.NotStarted);
  const [score, setScore] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // Moved timeLeft to App level
  const bgmRef = useRef<HTMLAudioElement>(null);

  const shuffledSentences = useMemo(() => 
    [...SENTENCES].sort(() => Math.random() - 0.5), 
    []
  );

  const handleGameStart = useCallback(() => {
    if (bgmRef.current) {
        bgmRef.current.volume = 0.2;
        bgmRef.current.play().catch(error => {
            console.warn("BGM autoplay was prevented. User interaction is needed.", error);
        });
    }
    setScore(0);
    setCurrentSentenceIndex(0);
    setTimeLeft(60); // Reset timer on game start
    setGameStatus(GameStatus.Playing);
  }, []);
  
  const handleNextSentence = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 10);
    }
    
    if (currentSentenceIndex + 1 < shuffledSentences.length) {
      setCurrentSentenceIndex(prev => prev + 1);
      setTimeLeft(60); // Reset timer for next sentence
    } else {
      setGameStatus(GameStatus.Finished);
    }
  }, [currentSentenceIndex, shuffledSentences.length]);

  const handlePauseGame = useCallback(() => {
    setGameStatus(GameStatus.Paused);
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    setGameStatus(GameStatus.Playing);
    if (bgmRef.current) {
      bgmRef.current.play().catch(error => console.warn("BGM resume autoplay prevented.", error));
    }
  }, []);

  const handleEndGame = useCallback(() => {
    setGameStatus(GameStatus.Finished);
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0; // Rewind BGM
    }
  }, []);

  // Timer Effect at App level
  useEffect(() => {
    // Fix: Use 'number' for timerId as NodeJS.Timeout is not recognized in browser environments.
    let timerId: number;
    if (gameStatus === GameStatus.Playing && timeLeft > 0) {
      timerId = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (gameStatus === GameStatus.Playing && timeLeft <= 0) {
      // If time runs out and game is playing, move to next sentence (or end game if last)
      handleNextSentence(false); // Consider it incorrect if time runs out
    }
    return () => clearTimeout(timerId);
  }, [timeLeft, gameStatus, handleNextSentence]);

  const isPaused = gameStatus === GameStatus.Paused;

  const renderGameOrOverlay = () => {
    switch (gameStatus) {
      case GameStatus.Playing:
      case GameStatus.Paused: // Render Game component even when paused, with an overlay
        return (
          <>
            <Game
              sentence={shuffledSentences[currentSentenceIndex]}
              onNextSentence={handleNextSentence}
              score={score}
              questionNumber={currentSentenceIndex + 1}
              totalQuestions={shuffledSentences.length}
              onPauseGame={handlePauseGame}
              onEndGame={handleEndGame}
              isPaused={isPaused}
              timeLeft={timeLeft} // Pass timeLeft down
            />
            {isPaused && (
              <PauseScreen 
                onResume={handleResumeGame} 
                onQuit={handleEndGame} 
              />
            )}
          </>
        );
      case GameStatus.Finished:
        return (
          <ResultScreen 
            score={score} 
            onRestart={handleGameStart} 
            totalQuestions={shuffledSentences.length} 
          />
        );
      case GameStatus.NotStarted:
      default:
        return <StartScreen onStart={handleGameStart} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-sky-400 flex items-center justify-center select-none">
      <audio ref={bgmRef} src="/audio/bgm.mp3" loop preload="auto" />
      {renderGameOrOverlay()}
    </div>
  );
};

export default App;