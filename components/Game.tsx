

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Letter, Arrow } from '../types';
import { decomposeSentence } from '../utils/korean';
import { ALL_JAMO } from '../constants';
import { Character } from './Character';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 128;
const PLAYER_SPEED = 5;
const LETTER_SPEED = 2;
const ARROW_SPEED = 10;
const COLLISION_BOX_SIZE = 80;

// Replaced the malformed base64 URI with a valid, minimal silent WAV file to prevent audio loading errors.
const SHOOT_SOUND_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARBxAAABAAAEeAAABAAgACABkYXRhAAAAAA==';

interface GameProps {
  sentence: string;
  onNextSentence: (isCorrect: boolean) => void;
  score: number;
  questionNumber: number;
  totalQuestions: number;
  onPauseGame: () => void; // New prop for pausing
  onEndGame: () => void;   // New prop for ending
  isPaused: boolean;       // New prop to indicate pause state
  timeLeft: number;        // timeLeft now comes from App.tsx
}

const Game: React.FC<GameProps> = ({ 
  sentence, 
  onNextSentence, 
  score, 
  questionNumber, 
  totalQuestions,
  onPauseGame,
  onEndGame,
  isPaused,
  timeLeft, // Use timeLeft from props
}) => {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [targetJamo, setTargetJamo] = useState<string[]>([]);
  const [completedJamo, setCompletedJamo] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  // timeLeft state is now managed in App.tsx

  const keysPressed = useRef<Record<string, boolean>>({});
  const shootSoundRef = useRef<HTMLAudioElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  const letterLanes = useMemo(() => Array.from({ length: 10 }, (_, i) => i * (GAME_WIDTH / 10)), []);
  const lastLaneUsed = useRef(-1);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);
  
  const setupNewSentence = useCallback(() => {
    speak(sentence);
    const decomposed = decomposeSentence(sentence);
    setTargetJamo(decomposed.filter(j => j !== ' ' && j !== '.' && j !== '?' && j !== '!'));
    setCompletedJamo([]);
    setMistakes(0);
    setArrows([]);
    setLetters([]);
    // timeLeft is reset by App.tsx
    gameAreaRef.current?.focus();
  }, [sentence, speak]);
  
  useEffect(() => {
    setupNewSentence();
  }, [sentence, setupNewSentence]);

  // Timer logic for handling sentence completion on time out (now managed by App.tsx, but this effect responds to it)
  useEffect(() => {
    if (timeLeft <= 0) {
      // The App component will call onNextSentence(false) if time runs out
      // This effect ensures we clean up letters, etc. if needed
      // No explicit call to onNextSentence here, as App handles it.
    }
  }, [timeLeft]);

  // Win Condition Effect
  useEffect(() => {
    if (targetJamo.length > 0 && completedJamo.length === targetJamo.length) {
      setTimeout(() => onNextSentence(true), 500);
    }
  }, [completedJamo.length, targetJamo.length, onNextSentence]);

  // Letter Generation Effect
  useEffect(() => {
    // Fix: Use 'number' for letterGenerator as NodeJS.Timeout is not recognized in browser environments.
    let letterGenerator: number;
    if (!isPaused) { // Only generate letters if not paused
      letterGenerator = setInterval(() => {
        if (completedJamo.length >= targetJamo.length || timeLeft <= 0) return;
        
        setLetters(currentLetters => {
          if (currentLetters.length > 8) return currentLetters;

          const nextJamo = targetJamo[completedJamo.length];
          const shouldBeTarget = Math.random() < 0.8;
          let char = '';
          if (shouldBeTarget) {
              char = nextJamo;
          } else {
              do {
                  char = ALL_JAMO[Math.floor(Math.random() * ALL_JAMO.length)];
              } while (char === nextJamo || !char);
          }

          let laneIndex;
          do {
              laneIndex = Math.floor(Math.random() * letterLanes.length);
          } while (laneIndex === lastLaneUsed.current);
          lastLaneUsed.current = laneIndex;

          const newLetter: Letter = {
              id: Date.now() + Math.random(),
              char,
              x: letterLanes[laneIndex] + (letterLanes[1] - letterLanes[0] - COLLISION_BOX_SIZE) / 2,
              y: -100,
          };

          return [...currentLetters, newLetter];
        });
      }, 800);
    }

    return () => clearInterval(letterGenerator);
  }, [completedJamo.length, targetJamo, letterLanes, timeLeft, isPaused]);
  
  // Main Game Loop (Physics and Collision)
  useEffect(() => {
    // Fix: Use 'number' for gameLoopId as NodeJS.Timeout is not recognized in browser environments.
    let gameLoopId: number;
    if (!isPaused) { // Only run game loop if not paused
      gameLoopId = setInterval(() => {
        // Player Movement
        setPlayerX(x => {
          if (keysPressed.current['ArrowLeft'] && x > 0) {
            return Math.max(0, x - PLAYER_SPEED);
          }
          if (keysPressed.current['ArrowRight'] && x < GAME_WIDTH - PLAYER_WIDTH) {
            return Math.min(GAME_WIDTH - PLAYER_WIDTH, x + PLAYER_SPEED);
          }
          return x;
        });

        const currentTargetJamo = targetJamo[completedJamo.length];
        if (!currentTargetJamo) return;

        // Update positions and handle collisions
        setArrows(currentArrows => {
          let newLetters = [...letters];
          const arrowsToRemove = new Set<number>();
          const lettersToRemove = new Set<number>();
          let correctHits = 0;
          let incorrectHits = 0;

          for (const arrow of currentArrows) {
            for (const letter of newLetters) {
              if (lettersToRemove.has(letter.id)) continue;

              const isColliding = 
                arrow.x > letter.x &&
                arrow.x < letter.x + COLLISION_BOX_SIZE &&
                arrow.y > letter.y &&
                arrow.y < letter.y + COLLISION_BOX_SIZE;
              
              if (isColliding) {
                arrowsToRemove.add(arrow.id);
                lettersToRemove.add(letter.id);
                if (letter.char === currentTargetJamo) {
                  correctHits++;
                } else {
                  incorrectHits++;
                }
              }
            }
          }

          if (correctHits > 0) {
            setCompletedJamo(cj => [...cj, ...Array(correctHits).fill(currentTargetJamo)]);
          }
          if (incorrectHits > 0) {
            setMistakes(m => m + incorrectHits);
          }
          if (lettersToRemove.size > 0) {
            setLetters(ls => ls.filter(l => !lettersToRemove.has(l.id)));
          }

          return currentArrows
            .map(a => ({ ...a, y: a.y - ARROW_SPEED }))
            .filter(a => a.y > 0 && !arrowsToRemove.has(a.id));
        });
        
        setLetters(currentLetters => currentLetters
          .map(l => ({ ...l, y: l.y + LETTER_SPEED }))
          .filter(l => l.y < GAME_HEIGHT)
        );

      }, 1000 / 60);
    }

    return () => clearInterval(gameLoopId);
  }, [letters, targetJamo, completedJamo, isPaused]);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isPaused) return; // Ignore input if paused
    keysPressed.current[e.key] = true;
    if (e.key === ' ' && timeLeft > 0) {
      e.preventDefault();
      // Arrow `x` calculation (playerX + PLAYER_WIDTH / 2 - 12) is correct for centering with the 128px wide character.
      setArrows(prev => [
        ...prev,
        { id: Date.now(), x: playerX + PLAYER_WIDTH / 2 - 12, y: GAME_HEIGHT - 60 },
      ]);
      if (shootSoundRef.current) {
        shootSoundRef.current.currentTime = 0;
        shootSoundRef.current.play().catch(console.error);
      }
    }
  }, [playerX, timeLeft, isPaused]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current[e.key] = false;
  }, []);

  useEffect(() => {
    gameAreaRef.current?.focus();
    const ref = gameAreaRef.current;
    if (!ref) return;
    
    ref.addEventListener('keydown', handleKeyDown);
    ref.addEventListener('keyup', handleKeyUp);
    return () => {
      ref.removeEventListener('keydown', handleKeyDown);
      ref.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const reconstructSentence = useMemo(() => {
    const fullDecomposed = decomposeSentence(sentence);
    let completedIdx = 0;
    return fullDecomposed.map((jamo, idx) => {
        const isPunctuation = jamo === ' ' || jamo === '.' || jamo === '?' || jamo === '!';
        if (isPunctuation) return <span key={idx}>{jamo === ' ' ? '\u00A0' : jamo}</span>;
        
        // This logic needs to match `targetJamo` based on actual completed characters
        // rather than blindly advancing completedIdx for every jamo in fullDecomposed.
        // For accurate display, we should probably check if `jamo` exists in `completedJamo` at the current `completedIdx` position.
        // However, the current logic for `completedJamo` only stores the "target" jamo when hit.
        // Let's assume `completedJamo` accurately reflects the *sequence* of correctly hit target jamo.
        if (completedIdx < completedJamo.length && jamo === completedJamo[completedIdx]) {
            completedIdx++; // Advance only if the current jamo matches the next completed target
            return <span key={idx} className="text-white">{jamo}</span>;
        }
        return <span key={idx} className="text-gray-600">{jamo}</span>
    });
  }, [sentence, completedJamo]);

  return (
    <div
      className="w-[800px] h-[600px] bg-sky-800 bg-opacity-80 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden relative outline-none"
      tabIndex={0}
      ref={gameAreaRef}
    >
      <audio ref={shootSoundRef} src={SHOOT_SOUND_URI} preload="auto" />
      <div className="absolute top-0 left-0 right-0 p-2 bg-black bg-opacity-20 text-white flex justify-between items-center text-lg z-10">
        <span className="font-bold">점수: {score}</span>
        <span className="font-bold">시간: {timeLeft}</span>
        <span className="font-bold">문제: {questionNumber}/{totalQuestions}</span>
        <span className="font-bold text-red-400">실수: {mistakes}</span>
        <div className="flex space-x-2">
          <button 
            onClick={onPauseGame} 
            className="px-4 py-2 bg-yellow-500 text-white text-base font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out"
          >
            일시정지
          </button>
          <button 
            onClick={onEndGame} 
            className="px-4 py-2 bg-red-600 text-white text-base font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out"
          >
            종료
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-16 left-0 right-0 text-center text-4xl font-bold bg-black bg-opacity-30 p-2 rounded-md tracking-widest">
        {reconstructSentence}
      </div>

      {letters.map(letter => (
        <div
          key={letter.id}
          className="absolute text-7xl font-bold text-yellow-300 drop-shadow-lg"
          style={{ left: letter.x, top: letter.y, width: COLLISION_BOX_SIZE, height: COLLISION_BOX_SIZE, textAlign: 'center' }}
        >
          {letter.char}
        </div>
      ))}

      {arrows.map(arrow => (
        <svg
          key={arrow.id}
          className="absolute"
          style={{ left: arrow.x, top: arrow.y }}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="gold"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Simple upward-pointing arrow representing a crossbow bolt */}
          <line x1="12" y1="2" x2="12" y2="22"></line>
          <polyline points="5 9 12 2 19 9"></polyline>
        </svg>
      ))}

      {/* Character component is now purely presentational, positioned by its parent div */}
      <div className="absolute bottom-0" style={{ left: playerX, width: PLAYER_WIDTH, height: 128 }}>
          <Character />
      </div>
    </div>
  );
};

export default Game;