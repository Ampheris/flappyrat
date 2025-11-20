
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface PipeData {
  id: number;
  x: number;
  topHeight: number; // Height of the top obstacle (chain + top rim)
  initialTopHeight: number; // Base height for vertical movement
  gapSize: number;   // Height of the safe zone (hoop interior)
  passed: boolean;
}

export interface Position {
  x: number;
  y: number;
}
