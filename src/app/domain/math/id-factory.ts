let seq = 0;

export type IdPrefix = 'ord' | 'pos' | 'news' | 'trd' | 'led' | 'toast';

export function createId(prefix: IdPrefix): string {
  seq += 1;
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}_${rand}`;
}

export function resetIdSeqForTests(): void {
  seq = 0;
}
