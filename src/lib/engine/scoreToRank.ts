// Calibrated NEET Score to AIR approximation table (based on NTA official score distributions)
export const scoreToRankTable: [number, number][] = [
  [720, 1],
  [715, 68],
  [710, 250],
  [705, 600],
  [700, 1250],
  [695, 2200],
  [690, 3500],
  [685, 5400],
  [680, 7800],
  [675, 10800],
  [670, 14500],
  [665, 19000],
  [660, 24000],
  [655, 30000],
  [650, 36500],
  [645, 43500],
  [640, 51000],
  [635, 59000],
  [630, 67500],
  [625, 76500],
  [620, 86000],
  [615, 96000],
  [610, 106500],
  [605, 117500],
  [600, 129000],
  [590, 153000],
  [580, 178000],
  [570, 205000],
  [560, 233000],
  [550, 262000],
  [540, 292000],
  [530, 323000],
  [520, 355000],
  [510, 388000],
  [500, 422000],
  [490, 457000],
  [480, 493000],
  [470, 530000],
  [460, 568000],
  [450, 607000],
  [440, 647000],
  [430, 688000],
  [420, 730000],
  [410, 773000],
  [400, 817000],
  [380, 908000],
  [360, 1003000],
  [340, 1102000],
  [320, 1205000],
  [300, 1312000],
  [280, 1423000],
  [250, 1595000],
  [200, 1890000],
  [150, 2180000],
  [100, 2350000],
];

export function scoreToRank(score: number): number {
  if (score >= 720) return 1;
  if (score <= 100) return 2350000;
  for (let i = 0; i < scoreToRankTable.length - 1; i++) {
    const [s1, r1] = scoreToRankTable[i];
    const [s2, r2] = scoreToRankTable[i + 1];
    if (score <= s1 && score >= s2) {
      const frac = (s1 - score) / (s1 - s2);
      return Math.round(r1 + frac * (r2 - r1));
    }
  }
  return 2350000;
}

export function rankToScore(rank: number): number {
  if (rank <= 1) return 720;
  if (rank >= 2350000) return 100;
  for (let i = 0; i < scoreToRankTable.length - 1; i++) {
    const [s1, r1] = scoreToRankTable[i];
    const [s2, r2] = scoreToRankTable[i + 1];
    if (rank >= r1 && rank <= r2) {
      const frac = (rank - r1) / (r2 - r1);
      return Math.round(s1 - frac * (s1 - s2));
    }
  }
  return 100;
}
