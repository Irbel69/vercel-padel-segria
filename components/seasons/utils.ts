export const dayNames = ['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'];
export const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday-first order

export function durationMinutes(a: string, b: string) {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return bh * 60 + bm - (ah * 60 + am);
}

export function computeBlockStart(base: string, blocks: any[], index: number) {
  const [bh, bm] = base.split(':').map(Number);
  let minutes = bh * 60 + bm;
  for (let i = 0; i < index; i++) {
    minutes += Number(blocks[i]?.duration || 0);
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
