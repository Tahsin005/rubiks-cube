export function average(times) {
  if (!times || times.length === 0) return null;
  if (times.length <= 2) return times.reduce((a, b) => a + b, 0) / times.length;
  // trim best and worst for proper Ao
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function computeStats(solves) {
  if (!solves || solves.length === 0) return null;

  const times = solves.map((s) => s.time);
  const n = times.length;

  const ao = (count) => {
    if (n < count) return null;
    return average(times.slice(-count));
  };

  // personal best single
  const pb = Math.min(...times);

  // best Ao5 ever
  const bestAo = (count) => {
    if (n < count) return null;
    let best = Infinity;
    for (let i = count - 1; i < n; i++) {
      const a = average(times.slice(i - count + 1, i + 1));
      if (a < best) best = a;
    }
    return best === Infinity ? null : best;
  };

  return {
    count: n,
    pb,
    ao5:   ao(5),
    ao12:  ao(12),
    ao25:  ao(25),
    ao50:  ao(50),
    ao100: ao(100),
    aoAll: average(times),
    bestAo5:   bestAo(5),
    bestAo12:  bestAo(12),
    bestAo25:  bestAo(25),
    bestAo50:  bestAo(50),
    bestAo100: bestAo(100),
  };
}

export function formatTime(ms) {
  if (ms == null) return "-";
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return totalSeconds.toFixed(2);
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toFixed(2).padStart(5, "0");
  return `${m}:${s}`;
}