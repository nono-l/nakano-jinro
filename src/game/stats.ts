export type Stats = {
  best: number;
  streak: number;
  bestStreak: number;
  plays: number;
  wins: number;
};

const KEYS = {
  best: "nakano-best",
  streak: "nakano-streak",
  bestStreak: "nakano-best-streak",
  plays: "nakano-plays",
  wins: "nakano-wins",
} as const;

function read(key: string): number {
  if (typeof localStorage === "undefined") return 0;
  const value = Number(localStorage.getItem(key) || "0");
  return Number.isFinite(value) ? value : 0;
}

export function loadStats(): Stats {
  return {
    best: read(KEYS.best),
    streak: read(KEYS.streak),
    bestStreak: read(KEYS.bestStreak),
    plays: read(KEYS.plays),
    wins: read(KEYS.wins),
  };
}

export function saveResult(win: boolean, score: number): Stats {
  const current = loadStats();
  const streak = win ? current.streak + 1 : 0;
  const next: Stats = {
    plays: current.plays + 1,
    wins: current.wins + (win ? 1 : 0),
    best: Math.max(current.best, score),
    streak,
    bestStreak: Math.max(current.bestStreak, streak),
  };
  localStorage.setItem(KEYS.best, String(next.best));
  localStorage.setItem(KEYS.streak, String(next.streak));
  localStorage.setItem(KEYS.bestStreak, String(next.bestStreak));
  localStorage.setItem(KEYS.plays, String(next.plays));
  localStorage.setItem(KEYS.wins, String(next.wins));
  return next;
}
