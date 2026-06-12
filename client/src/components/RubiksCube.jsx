import { useState, useRef, useCallback } from "react";
import "cubing/twisty";
import generateScramble from "../utils/scramble";

const MOVES = ["U", "U'", "U2", "D", "D'", "D2", "R", "R'", "R2", "L", "L'", "L2", "F", "F'", "F2", "B", "B'", "B2"];

export default function RubiksCube() {
    const [scrambleText, setScrambleText] = useState("");
    const [inputValue, setInputValue] = useState("");
    const playerRef = useRef(null);
    const timeoutsRef = useRef([]);

    const applyAlg = useCallback((alg) => {
        const player = playerRef.current;
        if (!player) return;

        // cancel any pending moves from a previous scramble
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        // reset to solved
        player.alg = "";

        const moves = alg.trim().split(/\s+/).filter(Boolean);
        const delayBetweenMoves = 400; // milliseconds

        moves.forEach((move, i) => {
            const id = setTimeout(() => {
                player.experimentalAddMove(move);
            }, i * delayBetweenMoves);
            timeoutsRef.current.push(id);
        });
    }, []);

    const handleScramble = useCallback(() => {
        const s = generateScramble({ turns: 20, array: false });
        setScrambleText(s);
        setInputValue(s);
    }, [applyAlg]);

    const handleApplyInput = useCallback(() => {
        if (!inputValue.trim()) return;
        setScrambleText(inputValue.trim());
        applyAlg(inputValue.trim());
    }, [inputValue, applyAlg]);

    const handleReset = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        const player = playerRef.current;
        if (player) player.alg = "";

        setScrambleText("");
        setInputValue("");
    }, []);

    // single manual move
    const doMove = useCallback((notation) => {
        const player = playerRef.current;
        if (!player) return;
        player.experimentalAddMove(notation);
    }, []);

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto p-4 select-none">

            {/* cube viewer */}
            <twisty-player
                ref={playerRef}
                puzzle="3x3x3"
                visualization="3D"
                background="none"
                control-panel="none"
                style={{ width: "100%", height: 420, borderRadius: "1rem", overflow: "hidden" }}
            />

            {/* scramble display */}
            {scrambleText && (
                <div className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Scramble</p>
                    <p className="font-mono text-sm text-zinc-100 leading-relaxed break-words">{scrambleText}</p>
                </div>
            )}

            {/* manual scramble input */}
            <div className="flex w-full gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyInput()}
                    placeholder="Paste a scramble e.g. R U R' U' F2 ..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                />
                <button
                    onClick={handleApplyInput}
                    className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-sm font-medium transition-colors whitespace-nowrap"
                >
                    Apply
                </button>
            </div>

            {/* action buttons */}
            <div className="flex gap-3 w-full">
                <button
                    onClick={handleScramble}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all"
                >
                    Generate Scramble
                </button>
                <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm font-semibold hover:bg-zinc-700 active:scale-95 transition-all"
                >
                    Reset
                </button>
            </div>

            {/* individual move buttons */}
            <div className="w-full">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Manual moves</p>
                <div className="flex flex-wrap gap-1.5">
                    {MOVES.map((m) => (
                        <button
                            key={m}
                            onClick={() => doMove(m)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono hover:bg-zinc-700 hover:text-white active:scale-95 transition-all"
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-zinc-600">Drag to rotate view</p>
        </div>
    );
}