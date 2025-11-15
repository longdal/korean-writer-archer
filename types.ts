
export enum GameStatus {
  NotStarted,
  Playing,
  Paused,
  Finished,
}

export interface Letter {
  id: number;
  char: string;
  x: number;
  y: number;
}

export interface Arrow {
  id: number;
  x: number;
  y: number;
}