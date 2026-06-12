import { useState, useEffect, useRef, useCallback } from "react";
import "cubing/twisty";
import generateScramble from "../utils/scramble";
import { getSolves, saveSolve, deleteSolve, clearSolves } from "../utils/storage";
import { computeStats, formatTime } from "../utils/stats";
import StatsPanel from "./StatsPanel";
import SolveList from "./SolveList";

const HOLD_DURATION = 1500; // ms to hold spacebar

// Timer states
const STATE = {
  IDLE: "idle",         // waiting for spacebar hold
  HOLDING: "holding",   // spacebar held, counting down
  READY: "ready",       // held long enough, release to start
  RUNNING: "running",   // timer running
  DONE: "done",         // timer stopped, showing result
};

export default function Timer() {
  const [tab, setTab] = useState("timer"); // "timer" | "stats" | "solves"
  const [scramble, setScramble] = useState("");
  const [timerState, setTimerState] = useState(STATE.IDLE);
  const [displayTime, setDisplayTime] = useState(0);
  const [solves, setSolves] = useState(() => getSolves());
  const [lastSolve, setLastSolve] = useState(null);

  const playerRef = useRef(null);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const stateRef = useRef(STATE.IDLE);
  const scrambleRef = useRef("");

  // keep stateRef in sync
  const updateState = (s) => {
    stateRef.current = s;
    setTimerState(s);
  };

  const newScramble = useCallback(() => {
    const s = generateScramble({ turns: 20, array: false });
    setScramble(s);
    scrambleRef.current = s;
    const player = playerRef.current;
    if (player) {
      player.alg = s;
      player.timestamp = "end";
    }
  }, []);

  // generate scramble on mount
  useEffect(() => {
    // slight delay to let twisty-player mount
    const id = setTimeout(newScramble, 300);
    return () => clearTimeout(id);
  }, [newScramble]);

  // set scramble on player when ref becomes available
  useEffect(() => {
    if (!playerRef.current || !scramble) return;
    playerRef.current.alg = scramble;
    playerRef.current.timestamp = "end";
  }, [scramble]);

  // timer tick
  const startTicking = useCallback(() => {
    startTimeRef.current = performance.now();
    const tick = () => {
      setDisplayTime(performance.now() - startTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTicking = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    return performance.now() - startTimeRef.current;
  }, []);

  const finishSolve = useCallback((elapsed) => {
    const solve = {
      id: Date.now(),
      time: Math.round(elapsed),
      scramble: scrambleRef.current,
      date: new Date().toISOString(),
    };
    const updated = saveSolve(solve);
    setSolves(updated);
    setLastSolve(solve);
    setDisplayTime(Math.round(elapsed));
    newScramble();
    updateState(STATE.DONE);
  }, []);

  // spacebar logic
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (e.repeat) return;

      const state = stateRef.current;

      if (state === STATE.RUNNING) {
        // stop timer
        const elapsed = stopTicking();
        finishSolve(elapsed);
        return;
      }

      if (state === STATE.IDLE || state === STATE.DONE) {
        holdStartRef.current = performance.now();
        updateState(STATE.HOLDING);

        holdTimerRef.current = setTimeout(() => {
          updateState(STATE.READY);
        }, HOLD_DURATION);
      }
    };

    const onKeyUp = (e) => {
      if (e.code !== "Space") return;
      e.preventDefault();

      const state = stateRef.current;

      if (state === STATE.HOLDING) {
        clearTimeout(holdTimerRef.current);
        updateState(STATE.IDLE);
        return;
      }

      if (state === STATE.READY) {
        clearTimeout(holdTimerRef.current);
        updateState(STATE.RUNNING);
        startTicking();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearTimeout(holdTimerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [startTicking, stopTicking, finishSolve]);

  // after done, auto-generate new scramble when user is ready
  const handleNextScramble = useCallback(() => {
    newScramble();
    updateState(STATE.IDLE);
    setDisplayTime(0);
    setLastSolve(null);
  }, [newScramble]);

  const handleDeleteSolve = useCallback((id) => {
    const updated = deleteSolve(id);
    setSolves(updated);
  }, []);

  const handleClearAll = useCallback(() => {
    const updated = clearSolves();
    setSolves(updated);
  }, []);

  const stats = computeStats(solves);

  const timerColor =
    timerState === STATE.HOLDING ? "text-yellow-400"
      : timerState === STATE.READY ? "text-green-400"
        : timerState === STATE.RUNNING ? "text-white"
          : timerState === STATE.DONE ? "text-white"
            : "text-zinc-300";

  const holdProgress =
    timerState === STATE.HOLDING || timerState === STATE.READY
      ? timerState === STATE.READY ? 100
        : Math.min(100, ((performance.now() - (holdStartRef.current || 0)) / HOLD_DURATION) * 100)
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">

      {/* Scramble bar */}
      <div className="flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
        <p className="font-mono text-sm text-zinc-100 leading-relaxed flex-1 break-words">{scramble || "Generating..."}</p>
        <button
          onClick={handleNextScramble}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 hover:text-white transition-all"
        >
          Next →
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

        {/* Left: cube + timer */}
        <div className="flex flex-col items-center gap-4 flex-1 w-full">

          {/* Cube */}
          <twisty-player
            ref={playerRef}
            puzzle="3x3x3"
            visualization="3D"
            background="none"
            control-panel="none"
            style={{ width: "100%", height: 320, borderRadius: "1rem" }}
          />

          {/* Timer display */}
          <div className="w-full flex flex-col items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8">

            {/* Hold progress bar */}
            {(timerState === STATE.HOLDING || timerState === STATE.READY) && (
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${timerState === STATE.READY ? "bg-green-400" : "bg-yellow-400"}`}
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            )}

            <div className={`font-mono text-7xl font-bold tracking-tighter transition-colors ${timerColor}`}>
              {formatTime(displayTime)}
            </div>

            {/* Status hint */}
            <p className="text-xs text-zinc-500 mt-1">
              {timerState === STATE.IDLE && "Hold Space for 3s to arm"}
              {timerState === STATE.HOLDING && "Keep holding..."}
              {timerState === STATE.READY && "Release Space to start!"}
              {timerState === STATE.RUNNING && "Press Space to stop"}
              {timerState === STATE.DONE && `Solved! Press Space or`}
            </p>

            {timerState === STATE.DONE && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleNextScramble}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all"
                >
                  Next Scramble
                </button>
              </div>
            )}

            {/* Quick stats row */}
            {stats && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800 w-full justify-center flex-wrap">
                {[
                  ["PB", formatTime(stats.pb)],
                  ["Ao5", formatTime(stats.ao5)],
                  ["Ao12", formatTime(stats.ao12)],
                  ["Ao25", formatTime(stats.ao25)],
                ].map(([label, val]) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="font-mono text-sm text-zinc-100">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: stats / solves panel */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {["stats", "solves"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${tab === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                {t === "stats" ? "Stats" : `Solves (${solves.length})`}
              </button>
            ))}
          </div>

          {tab === "stats"
            ? <StatsPanel stats={stats} solves={solves} />
            : <SolveList solves={solves} onDelete={handleDeleteSolve} onClear={handleClearAll} />
          }
        </div>
      </div>
    </div>
  );
}