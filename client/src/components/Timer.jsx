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
  IDLE: "idle",                   // waiting for spacebar to start inspection
  INSPECTING: "inspecting",       // 15s inspection countdown
  HOLDING: "holding",             // spacebar held during inspection, counting down
  READY: "ready",                 // held long enough, release to start solve
  RUNNING: "running",             // solve timer running
  JUST_STOPPED: "just_stopped",   // solve just stopped, waiting for keyup
  DONE: "done",                   // solve finished, showing result
};

export default function Timer() {
  const [tab, setTab] = useState("timer"); // "timer" | "stats" | "solves"
  const [scramble, setScramble] = useState("");
  const [timerState, setTimerState] = useState(STATE.IDLE);
  const [displayTime, setDisplayTime] = useState(0);
  const [inspectionDisplay, setInspectionDisplay] = useState("15");
  const [solves, setSolves] = useState(() => getSolves());
  const [lastSolve, setLastSolve] = useState(null);

  const playerRef = useRef(null);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const inspectionRafRef = useRef(null);
  
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const inspectionStartRef = useRef(null);
  const penaltyRef = useRef(0);
  const solveEndTimeRef = useRef(0);
  const isSpaceDownRef = useRef(false);

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
    const id = setTimeout(newScramble, 300);
    return () => clearTimeout(id);
  }, [newScramble]);

  useEffect(() => {
    if (!playerRef.current || !scramble) return;
    playerRef.current.alg = scramble;
    playerRef.current.timestamp = "end";
  }, [scramble]);

  const finishSolve = useCallback((elapsed, forcePenalty) => {
    let finalTime = Math.round(elapsed);
    if (forcePenalty === "DNF" || penaltyRef.current === Infinity) {
      finalTime = -1;
    } else if (forcePenalty === "+2" || penaltyRef.current === 2000) {
      finalTime += 2000;
    }

    const solve = {
      id: Date.now(),
      time: finalTime,
      penalty: forcePenalty || (penaltyRef.current === 2000 ? "+2" : null),
      scramble: scrambleRef.current,
      date: new Date().toISOString(),
    };
    
    const updated = saveSolve(solve);
    setSolves(updated);
    setLastSolve(solve);
    setDisplayTime(finalTime);
    
    // Generate new scramble immediately so user can prepare for next solve
    newScramble();
  }, [newScramble]);

  const startInspection = useCallback(() => {
    updateState(STATE.INSPECTING);
    inspectionStartRef.current = performance.now();
    penaltyRef.current = 0;
    setInspectionDisplay("15");
    
    const tick = () => {
      const state = stateRef.current;
      if (state !== STATE.INSPECTING && state !== STATE.HOLDING && state !== STATE.READY) {
        return; // stop inspection loop
      }

      const elapsed = performance.now() - inspectionStartRef.current;
      
      if (elapsed >= 17000) {
        finishSolve(Infinity, "DNF");
        if (isSpaceDownRef.current) {
          updateState(STATE.JUST_STOPPED);
        } else {
          updateState(STATE.DONE);
        }
        return;
      }

      if (elapsed >= 15000) {
        setInspectionDisplay("+2");
      } else {
        setInspectionDisplay(Math.ceil((15000 - elapsed) / 1000).toString());
      }

      inspectionRafRef.current = requestAnimationFrame(tick);
    };
    inspectionRafRef.current = requestAnimationFrame(tick);
  }, [finishSolve]);

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

  // spacebar logic
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (e.repeat) return;
      isSpaceDownRef.current = true;

      const state = stateRef.current;

      if (state === STATE.RUNNING) {
        const elapsed = stopTicking();
        solveEndTimeRef.current = performance.now();
        finishSolve(elapsed);
        updateState(STATE.JUST_STOPPED);
        return;
      }

      if (state === STATE.INSPECTING) {
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
      isSpaceDownRef.current = false;

      const state = stateRef.current;

      if (state === STATE.IDLE) {
        startInspection();
      } else if (state === STATE.JUST_STOPPED) {
        updateState(STATE.DONE);
      } else if (state === STATE.DONE) {
        setDisplayTime(0);
        setLastSolve(null);
        startInspection();
      } else if (state === STATE.HOLDING) {
        clearTimeout(holdTimerRef.current);
        updateState(STATE.INSPECTING);
      } else if (state === STATE.READY) {
        clearTimeout(holdTimerRef.current);
        
        // Evaluate penalty right at start of solve
        const inspectionElapsed = performance.now() - inspectionStartRef.current;
        if (inspectionElapsed >= 15000) {
          penaltyRef.current = 2000;
        } else {
          penaltyRef.current = 0;
        }
        
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
      cancelAnimationFrame(inspectionRafRef.current);
    };
  }, [startTicking, stopTicking, finishSolve, startInspection, newScramble]);

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
        : (timerState === STATE.RUNNING || timerState === STATE.INSPECTING) ? "text-white"
          : timerState === STATE.DONE ? "text-white"
            : "text-zinc-300";

  const holdProgress =
    timerState === STATE.HOLDING || timerState === STATE.READY
      ? timerState === STATE.READY ? 100
        : Math.min(100, ((performance.now() - (holdStartRef.current || 0)) / HOLD_DURATION) * 100)
      : 0;
      
  const showInspectionDisplay = 
    timerState === STATE.INSPECTING || timerState === STATE.HOLDING || timerState === STATE.READY;

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

            <div className={`flex flex-col items-center transition-colors ${timerColor}`}>
              <div className="flex items-baseline font-mono text-7xl font-bold tracking-tighter">
                {showInspectionDisplay ? inspectionDisplay : formatTime(displayTime)}
              </div>
              {(timerState === STATE.DONE || timerState === STATE.JUST_STOPPED) && lastSolve?.penalty === "+2" && (
                <span className="text-sm text-red-400 font-medium mt-1">
                  +2 Penalty Applied (Raw time: {formatTime(lastSolve.time - 2000)})
                </span>
              )}
            </div>

            {/* Status hint */}
            <p className="text-xs text-zinc-500 mt-1">
              {(timerState === STATE.IDLE || timerState === STATE.DONE || timerState === STATE.JUST_STOPPED) && "Press Space to start 15s inspection"}
              {timerState === STATE.INSPECTING && "Hold Space to arm timer"}
              {timerState === STATE.HOLDING && "Keep holding..."}
              {timerState === STATE.READY && "Release Space to start!"}
              {timerState === STATE.RUNNING && "Press Space to stop"}
            </p>



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
