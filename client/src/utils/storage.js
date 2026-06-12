const KEY = "cubing_solves";

export function getSolves() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveSolve(solve) {
  // solve: { id, time, scramble, date }
  const solves = getSolves();
  solves.push(solve);
  localStorage.setItem(KEY, JSON.stringify(solves));
  return solves;
}

export function deleteSolve(id) {
  const solves = getSolves().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(solves));
  return solves;
}

export function clearSolves() {
  localStorage.removeItem(KEY);
  return [];
}