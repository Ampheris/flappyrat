import React from 'react';
import { FlappyRat } from './components/FlappyRat';

const App: React.FC = () => {
  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-indigo-950 p-0 sm:p-6 touch-none overflow-hidden">
      <div className="relative w-full h-full sm:max-w-2xl sm:h-[85vh] sm:max-h-[900px] bg-black sm:rounded-xl overflow-hidden shadow-2xl sm:border-[12px] border-red-700 ring-4 ring-yellow-500 shadow-black/50">
        <FlappyRat />
      </div>
    </div>
  );
};

export default App;
