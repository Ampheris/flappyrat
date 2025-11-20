
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, PipeData } from '../../types';
import {
  GRAVITY,
  JUMP_STRENGTH,
  PIPE_SPEED,
  PIPE_WIDTH,
  PIPE_CAP_WIDTH,
  PIPE_CAP_HEIGHT,
  MIN_GAP,
  MAX_GAP,
  RAT_SIZE,
  RAT_HITBOX_SIZE,
  RAT_X_OFFSET,
  PIPE_SPAWN_RATE,
  MIN_PIPE_HEIGHT
} from '../../constants';
import { Play, RotateCcw, Trophy } from 'lucide-react';

// --- Assets ---

// Animated Rat Component (Clown Edition)
const RatSVG = ({ rotation, frame }: { rotation: number; frame: number }) => (
  <svg
    width={RAT_SIZE}
    height={RAT_SIZE}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transform: `rotate(${rotation}deg)`,
      filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.3))',
      transition: 'transform 0.1s'
    }}
  >
    {/* Body */}
    <path d="M10 20 C10 10 35 10 35 25 C35 35 10 35 10 20" fill="#a1a1aa" stroke="#3f3f46" strokeWidth="2" />
    
    {/* Tail - Wiggles based on frame */}
    <path 
      d={frame === 0 ? "M10 25 C 5 25 0 20 5 15" : "M10 25 C 5 28 0 25 2 18"} 
      stroke="#f472b6" 
      strokeWidth="3" 
      strokeLinecap="round" 
    />
    
    {/* Legs - Running Animation */}
    {frame === 0 ? (
      <>
        <path d="M15 35 L15 38" stroke="#f472b6" strokeWidth="2" />
        <path d="M25 35 L25 38" stroke="#f472b6" strokeWidth="2" />
      </>
    ) : (
      <>
        <path d="M12 34 L10 37" stroke="#f472b6" strokeWidth="2" />
        <path d="M28 34 L31 36" stroke="#f472b6" strokeWidth="2" />
      </>
    )}

    {/* Ear */}
    <circle cx="28" cy="12" r="5" fill="#f472b6" stroke="#be185d" strokeWidth="1.5" />
    {/* Eye */}
    <circle cx="30" cy="18" r="2" fill="white" />
    <circle cx="31" cy="18" r="1" fill="black" />
    {/* Clown Nose */}
    <circle cx="38" cy="26" r="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
  </svg>
);

// --- Background Assets (Circus Theme) ---

const BgFarSVG = encodeURIComponent(`
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect x="0" y="0" width="400" height="200" fill="none"/>
  <!-- Big Top Silhouette -->
  <path d="M0 200 L200 50 L400 200 Z" fill="#3730a3" opacity="0.3"/>
  <path d="M-100 200 L100 80 L300 200 Z" fill="#312e81" opacity="0.4"/>
  <path d="M100 200 L300 80 L500 200 Z" fill="#312e81" opacity="0.4"/>
</svg>
`);

const BgMidSVG = encodeURIComponent(`
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Bunting -->
  <path d="M0 20 Q25 50 50 20 T100 20 T150 20 T200 20" fill="none" stroke="#fcd34d" stroke-width="2" />
  <path d="M0 20 Q25 50 50 20 Z" fill="#ef4444" opacity="0.8"/>
  <path d="M50 20 Q75 50 100 20 Z" fill="#3b82f6" opacity="0.8"/>
  <path d="M100 20 Q125 50 150 20 Z" fill="#ef4444" opacity="0.8"/>
  <path d="M150 20 Q175 50 200 20 Z" fill="#3b82f6" opacity="0.8"/>
  <!-- Poles -->
  <rect x="48" y="20" width="4" height="180" fill="#b45309" opacity="0.3"/>
  <rect x="148" y="20" width="4" height="180" fill="#b45309" opacity="0.3"/>
</svg>
`);

const FloorSVG = encodeURIComponent(`
<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect width="40" height="40" fill="#fde047"/>
  <rect x="0" y="0" width="40" height="40" fill="#d97706" opacity="0.2"/>
  <rect x="0" y="0" width="20" height="20" fill="#d97706" opacity="0.3"/>
  <rect x="20" y="20" width="20" height="20" fill="#d97706" opacity="0.3"/>
</svg>
`);

// --- Pipe Components (Circus Stripes) ---

const PipeBody = () => (
  <div className="w-full h-full bg-white border-x-4 border-slate-900 relative overflow-hidden">
    <div 
      className="absolute inset-0" 
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #ef4444, #ef4444 15px, #ffffff 15px, #ffffff 30px)'
      }}
    ></div>
    <div className="absolute inset-0 bg-black opacity-10"></div>
  </div>
);

const PipeCap = () => (
  <div className="w-full h-full bg-yellow-400 border-4 border-yellow-700 relative overflow-hidden shadow-md rounded-sm">
    <div className="absolute top-0 bottom-0 left-1 w-2 bg-white opacity-40"></div>
    <div className="absolute top-0 bottom-0 right-1 w-2 bg-black opacity-20"></div>
    {/* Decorative Stars */}
    <div className="absolute top-1 left-2 w-2 h-2 bg-yellow-200 rounded-full"></div>
    <div className="absolute top-1 right-2 w-2 h-2 bg-yellow-200 rounded-full"></div>
  </div>
);

export const FlappyRat: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Rendering State
  const [ratY, setRatY] = useState(300);
  const [ratRotation, setRatRotation] = useState(0);
  const [ratFrame, setRatFrame] = useState(0);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [bgOffset, setBgOffset] = useState(0);

  // Refs for physics
  const ratYRef = useRef(300);
  const ratVelocityRef = useRef(0);
  const pipesRef = useRef<PipeData[]>([]);
  const bgOffsetRef = useRef(0);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('flappyRatHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnPipe = useCallback((width: number, height: number) => {
    if (height <= 0) return;

    // Randomize gap size
    const gapSize = Math.floor(Math.random() * (MAX_GAP - MIN_GAP + 1)) + MIN_GAP;

    // Calculate spawn limits
    const maxTopHeight = height - MIN_PIPE_HEIGHT - gapSize;
    const minTopHeight = MIN_PIPE_HEIGHT;
    const safeMax = Math.max(minTopHeight, maxTopHeight);
    
    const randomHeight = Math.floor(Math.random() * (safeMax - minTopHeight + 1)) + minTopHeight;

    const newPipe: PipeData = {
      id: Date.now() + Math.random(),
      x: width + 50, 
      topHeight: randomHeight,
      initialTopHeight: randomHeight,
      gapSize: gapSize,
      passed: false,
    };

    pipesRef.current.push(newPipe);
  }, []);

  const startGame = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    setGameState(GameState.PLAYING);
    setScore(0);
    setRatY(height / 2);
    setPipes([]);
    
    ratYRef.current = height / 2;
    ratVelocityRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    bgOffsetRef.current = 0;
    frameCountRef.current = 0;
    
    spawnPipe(width, height);
  };

  const jump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    ratVelocityRef.current = JUMP_STRENGTH;
    setRatFrame(1); 
  }, [gameState]);

  // Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === GameState.PLAYING) jump();
        else if (gameState !== GameState.PLAYING) startGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump]);

  // Game Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const loop = () => {
      if (!containerRef.current) return;
      const containerHeight = containerRef.current.clientHeight;
      const containerWidth = containerRef.current.clientWidth;

      // 1. Physics
      ratVelocityRef.current += GRAVITY;
      ratYRef.current += ratVelocityRef.current;

      // Rotation logic
      const rotation = Math.min(Math.max(ratVelocityRef.current * 4, -30), 90);

      // 2. Background & Animation
      bgOffsetRef.current += PIPE_SPEED;
      
      frameCountRef.current++;
      if (frameCountRef.current % 8 === 0) {
         setRatFrame(prev => (prev === 0 ? 1 : 0));
      }

      // 3. Pipes Management
      if (frameCountRef.current % PIPE_SPAWN_RATE === 0) {
        spawnPipe(containerWidth, containerHeight);
      }

      const isMovingPipes = scoreRef.current >= 10;

      pipesRef.current.forEach(pipe => {
        pipe.x -= PIPE_SPEED;

        // Vertical Movement logic (Level 2)
        if (isMovingPipes) {
           // Oscillation parameters
           const speed = 0.025; // Slow oscillation
           const range = 40;    // Range in pixels
           // Offset phase by x to prevent unison movement, creating a wave effect
           const phase = pipe.x * 0.005; 
           
           const oscillation = Math.sin(frameCountRef.current * speed + phase) * range;
           pipe.topHeight = pipe.initialTopHeight + oscillation;
        }
      });
      
      if (pipesRef.current.length > 0 && pipesRef.current[0].x < -PIPE_CAP_WIDTH) {
        pipesRef.current.shift();
      }

      // 4. Collision Detection
      const ratRect = {
        top: ratYRef.current + (RAT_SIZE - RAT_HITBOX_SIZE) / 2,
        bottom: ratYRef.current + RAT_SIZE - (RAT_SIZE - RAT_HITBOX_SIZE) / 2,
        left: RAT_X_OFFSET + (RAT_SIZE - RAT_HITBOX_SIZE) / 2,
        right: RAT_X_OFFSET + RAT_SIZE - (RAT_SIZE - RAT_HITBOX_SIZE) / 2
      };

      // Floor/Ceiling
      if (ratRect.bottom >= containerHeight || ratRect.top <= 0) {
        handleGameOver();
        return;
      }

      // Obstacle Collision
      let collided = false;
      pipesRef.current.forEach(pipe => {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH; 

        if (ratRect.right > pipeLeft && ratRect.left < pipeRight) {
          if (ratRect.top < pipe.topHeight || ratRect.bottom > pipe.topHeight + pipe.gapSize) {
            collided = true;
          }
        }

        // Score
        if (!pipe.passed && ratRect.left > pipeRight) {
          pipe.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      });

      if (collided) {
        handleGameOver();
        return;
      }

      // 5. Render Update
      setRatY(ratYRef.current);
      setRatRotation(rotation);
      setBgOffset(bgOffsetRef.current);
      setPipes([...pipesRef.current]);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, spawnPipe]);

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('flappyRatHighScore', scoreRef.current.toString());
    }
  };

  const handleScreenInteraction = (e: React.SyntheticEvent) => {
    if (gameState === GameState.PLAYING) {
      e.preventDefault(); 
      jump();
    } 
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-pointer select-none touch-none"
      onPointerDown={handleScreenInteraction}
      style={{
        background: 'linear-gradient(to bottom, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
      }}
    >
      {/* --- PARALLAX LAYERS --- */}
      {/* Sunburst Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ 
             background: 'repeating-conic-gradient(from 0deg, #fff 0deg 10deg, transparent 10deg 20deg)',
             animation: 'spin 20s linear infinite'
           }} />
       <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none"
        style={{
          backgroundImage: `url('data:image/svg+xml;charset=utf-8,${BgFarSVG}')`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'bottom',
          backgroundSize: '400px 200px',
          transform: `translateX(${-bgOffset * 0.2}px)`,
        }} />

      <div className="absolute inset-x-0 top-10 h-64 pointer-events-none"
        style={{
          backgroundImage: `url('data:image/svg+xml;charset=utf-8,${BgMidSVG}')`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'top',
          backgroundSize: '200px 200px',
          transform: `translateX(${-bgOffset * 0.5}px)`,
        }} />

      {/* --- GAME ELEMENTS --- */}

      {/* The Rat */}
      <div 
        className="absolute z-30 pointer-events-none"
        style={{
          left: RAT_X_OFFSET,
          top: ratY,
          width: RAT_SIZE,
          height: RAT_SIZE,
          transform: `rotate(${ratRotation}deg)`,
        }}
      >
        <RatSVG rotation={0} frame={ratFrame} />
      </div>

      {/* Pipes */}
      {pipes.map(pipe => (
        <React.Fragment key={pipe.id}>
          {/* Top Pipe */}
          <div 
            className="absolute z-20 flex flex-col items-center justify-end"
            style={{
              left: pipe.x - (PIPE_CAP_WIDTH - PIPE_WIDTH) / 2,
              top: 0,
              width: PIPE_CAP_WIDTH,
              height: pipe.topHeight,
            }}
          >
            <div className="w-full" style={{ height: pipe.topHeight - PIPE_CAP_HEIGHT, width: PIPE_WIDTH }}>
               <PipeBody />
            </div>
            <div className="w-full" style={{ height: PIPE_CAP_HEIGHT }}>
               <PipeCap />
            </div>
          </div>

          {/* Bottom Pipe */}
          <div 
            className="absolute z-20 flex flex-col items-center justify-start"
            style={{
              left: pipe.x - (PIPE_CAP_WIDTH - PIPE_WIDTH) / 2,
              top: pipe.topHeight + pipe.gapSize,
              width: PIPE_CAP_WIDTH,
              bottom: 0,
            }}
          >
            <div className="w-full" style={{ height: PIPE_CAP_HEIGHT }}>
              <PipeCap />
            </div>
            <div className="w-full flex-grow" style={{ width: PIPE_WIDTH }}>
               <PipeBody />
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* Floor */}
      <div 
        className="absolute bottom-0 w-full h-12 z-40 pointer-events-none border-t-4 border-yellow-600 shadow-2xl"
        style={{
          backgroundImage: `url('data:image/svg+xml;charset=utf-8,${FloorSVG}')`,
          backgroundRepeat: 'repeat-x',
          backgroundPositionX: `${-bgOffset}px`,
        }} 
      />

      {/* HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-10 w-full text-center z-50 pointer-events-none">
          <span className="text-6xl font-bold text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black"
                style={{ textShadow: '4px 4px 0 #b45309' }}>
            {score}
          </span>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50 backdrop-blur-sm">
          <div className="bg-red-900 p-8 rounded-xl border-4 border-yellow-400 shadow-2xl text-center pointer-events-auto max-w-sm w-full mx-4"
               onPointerDown={(e) => e.stopPropagation()}>
            <h1 className="text-4xl font-bold text-yellow-300 mb-2 drop-shadow-md tracking-tighter">FLAPPY RAT</h1>
            <p className="text-red-200 mb-8 text-sm uppercase tracking-widest font-bold">Circus Edition</p>
            
            <div className="mb-8 flex justify-center">
               <div className="p-6 bg-red-950 rounded-full border-4 border-yellow-400/50 animate-bounce">
                 <RatSVG rotation={0} frame={0} />
               </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-red-900 rounded-lg font-bold text-xl transition-all transform hover:scale-105 active:scale-95 border-b-4 border-yellow-700 shadow-lg"
            >
              <Play size={24} fill="currentColor" />
              START SHOW
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
          <div 
            className="bg-red-900 p-8 rounded-xl border-4 border-yellow-400 shadow-2xl text-center w-3/4 max-w-sm transform transition-all animate-in fade-in zoom-in duration-300 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-yellow-300 mb-6 drop-shadow-md uppercase">SHOW'S OVER!</h2>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="bg-red-950/80 p-4 rounded-lg border border-red-700 flex justify-between items-center">
                <span className="text-red-300 text-sm font-bold">SCORE</span>
                <span className="text-3xl font-bold text-white">{score}</span>
              </div>
              <div className="bg-red-950/80 p-4 rounded-lg border border-yellow-600/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-500" />
                  <span className="text-red-300 text-sm font-bold">BEST</span>
                </div>
                <span className="text-3xl font-bold text-yellow-500">{highScore}</span>
              </div>
            </div>

            <button 
              onClick={(e) => {
                 e.stopPropagation();
                 startGame(); 
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-red-900 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 border-b-4 border-yellow-700 shadow-lg"
            >
              <RotateCcw size={20} />
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
