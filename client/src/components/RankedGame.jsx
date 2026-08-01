import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { usersApi } from '@/redux/api/usersApi';
import "cubing/twisty";

const MOVES = ["U", "U'", "U2", "D", "D'", "D2", "R", "R'", "R2", "L", "L'", "L2", "F", "F'", "F2", "B", "B'", "B2"];

export default function RankedGame({ matchState, userElo, onExit }) {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const { sendMessage, addListener } = useWebSocket();
    const playerRef = useRef(null);

    const [isReady, setIsReady] = useState(false);
    const [matchStatus, setMatchStatus] = useState("waiting_for_ready"); // waiting_for_ready, starting, in_progress, finished
    const [countdown, setCountdown] = useState(3);
    const [startTime, setStartTime] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [lastMoveTime, setLastMoveTime] = useState(null);
    const [afkTimeLeft, setAfkTimeLeft] = useState(30);

    const [matchResult, setMatchResult] = useState(null);

    const timerRef = useRef(null);
    const inactivityTimerRef = useRef(null);
    const matchStatusRef = useRef(matchStatus);

    useEffect(() => {
        matchStatusRef.current = matchStatus;
    }, [matchStatus]);

    useEffect(() => {
        const handleUnload = () => {
            if (matchStatusRef.current !== "finished") {
                sendMessage("MATCH_FORFEIT", { reason: "Opponent left the match." });
            }
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
            if (matchStatusRef.current !== "finished") {
                sendMessage("MATCH_FORFEIT", { reason: "Opponent left the match." });
            }
        };
    }, [sendMessage]);

    useEffect(() => {
        const removeStartListener = addListener("MATCH_START", () => {
            setMatchStatus("starting");
            let count = 3;
            setCountdown(count);
            const intv = setInterval(() => {
                count -= 1;
                if (count <= 0) {
                    clearInterval(intv);
                    setMatchStatus("in_progress");
                    setLastMoveTime(Date.now()); // Start AFK timer tracking
                } else {
                    setCountdown(count);
                }
            }, 1000);
        });

        const removeEndListener = addListener("MATCH_END", (payload) => {
            setMatchStatus("finished");
            if (timerRef.current) clearInterval(timerRef.current);
            if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
            setMatchResult(payload);
            dispatch(usersApi.util.invalidateTags(['User']));
        });

        return () => {
            removeStartListener();
            removeEndListener();
            if (timerRef.current) clearInterval(timerRef.current);
            if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
        };
    }, [addListener]);

    // apply scramble once component mounts
    useEffect(() => {
        if (playerRef.current && matchState.scramble) {
            playerRef.current.alg = matchState.scramble;
        }
    }, [matchState.scramble]);

    // inactivity forfeit tracker
    useEffect(() => {
        if (matchStatus === "in_progress" && lastMoveTime) {
            inactivityTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - lastMoveTime;
                const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
                setAfkTimeLeft(remaining);

                if (elapsed >= 30000) {
                    // 30 seconds AFK -> forfeit
                    sendMessage("MATCH_FORFEIT", { reason: "You were disconnected for inactivity (30s)." });
                    clearInterval(inactivityTimerRef.current);
                }
            }, 1000);
        }
        return () => clearInterval(inactivityTimerRef.current);
    }, [matchStatus, lastMoveTime, sendMessage]);

    // handle Keyboard Inputs
    useEffect(() => {
        const keyMap = { u: "U", d: "D", r: "R", l: "L", f: "F", b: "B" };

        const handleKeyDown = (e) => {
            if (matchStatus !== "in_progress") return;

            // spacebar to indicate solve finished
            if (e.code === "Space") {
                e.preventDefault();
                if (startTime) {
                    const solveTimeMs = Date.now() - startTime;
                    sendMessage("MATCH_SOLVE", { solveTimeMs });
                    setMatchStatus("finished");
                    clearInterval(timerRef.current);
                    clearInterval(inactivityTimerRef.current);
                }
                return;
            }

            const key = e.key.toLowerCase();
            if (!keyMap[key]) return;

            const active = document.activeElement;
            if (active && active.tagName === "INPUT") return;

            const baseMove = keyMap[key];
            let move = baseMove;
            if (e.altKey) move = baseMove + "2";
            if (e.shiftKey) move = baseMove + "'";

            // Start timer on FIRST move
            if (!startTime) {
                const now = Date.now();
                setStartTime(now);
                timerRef.current = setInterval(() => {
                    setCurrentTime(Date.now() - now);
                }, 10);
            }

            setLastMoveTime(Date.now()); // Reset AFK timer
            setAfkTimeLeft(30);
            if (playerRef.current) playerRef.current.experimentalAddMove(move);
            sendMessage("MATCH_STATE_UPDATE", { move });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [matchStatus, startTime, sendMessage]);

    const handleReady = () => {
        setIsReady(true);
        sendMessage("MATCH_READY", {});
    };

    const formatTime = (ms) => {
        if (!ms) return "0.00";
        const totalSeconds = ms / 1000;
        return totalSeconds.toFixed(2);
    };

    // determine opponent elo safely, wait matchState.opponent.elo has a bug if not populated? No, gameManager passes elo.
    // However, I made a bug in my JSX above: <span className="text-lg font-bold text-blue-400">{user.username} ({matchState.opponent.elo})</span>
    // it should be user elo for 'You'

    // Let me fix that. The user elo isn't in matchState directly, but we can just use `user.username`. The opponent's elo is `matchState.opponent.elo`.

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
            {/* Header */}
            <div className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4">
                <div className="flex flex-col">
                    <span className="text-zinc-500 text-sm">You</span>
                    <span className="text-lg font-bold text-blue-400">{user.username} ({userElo})</span>
                </div>
                <div className="text-2xl font-mono text-zinc-100 font-bold tracking-widest">VS</div>
                <div className="flex flex-col items-end">
                    <span className="text-zinc-500 text-sm">Opponent</span>
                    <span className="text-lg font-bold text-red-400">{matchState.opponent.username} ({matchState.opponent.elo})</span>
                </div>
            </div>

            {/* Timer Display */}
            <div className="mb-4 flex flex-col items-center">
                <span className="text-6xl font-mono font-bold tracking-tighter text-white">
                    {formatTime(currentTime)}
                </span>
                {matchStatus === "in_progress" && (
                    <div className={`mt-2 font-mono text-sm ${afkTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>
                        Move timeout in: {afkTimeLeft}s
                    </div>
                )}
            </div>

            {/* Cube Viewer */}
            <div className="relative w-full max-w-2xl">
                {matchStatus === "waiting_for_ready" && (
                    <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center rounded-[1rem] backdrop-blur-sm">
                        <p className="text-white text-xl mb-6 text-center px-4">
                            Match Found!<br />Click Ready to begin.
                        </p>
                        <button
                            onClick={handleReady}
                            disabled={isReady}
                            className={`px-8 py-3 rounded-xl font-bold text-lg transition ${isReady
                                    ? "bg-green-600/50 text-green-200 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                                }`}
                        >
                            {isReady ? "Waiting for Opponent..." : "READY"}
                        </button>
                    </div>
                )}

                {matchStatus === "starting" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)] animate-ping">
                            {countdown}
                        </div>
                    </div>
                )}

                <twisty-player
                    ref={playerRef}
                    puzzle="3x3x3"
                    visualization="3D"
                    background="none"
                    control-panel="none"
                    style={{ width: "100%", height: 420, borderRadius: "1rem", overflow: "hidden", pointerEvents: matchStatus === "in_progress" ? "auto" : "none" }}
                />
            </div>

            <div className="mt-4 text-center text-zinc-500 text-sm">
                <p>Press any face key (U, D, R, L, F, B) to start the timer.</p>
                <p>Press <span className="font-bold text-zinc-300">Spacebar</span> when you finish solving!</p>
            </div>

            {/* Match End Modal */}
            {matchStatus === "finished" && matchResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl max-w-md w-full text-center">
                        <h2 className={`text-4xl font-black mb-2 ${matchResult.winnerId === user.id ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.winnerId === user.id ? "VICTORY" : "DEFEAT"}
                        </h2>

                        {matchResult.aborted ? (
                            <p className="text-zinc-400 mb-6">{matchResult.reason}</p>
                        ) : (
                            <>
                                {matchResult.forfeitReason && (
                                    <p className="text-red-300 text-sm mb-4">{matchResult.forfeitReason}</p>
                                )}
                                <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-6">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs text-zinc-500 uppercase">Time</span>
                                        <span className="font-mono text-xl text-zinc-200">{formatTime(matchResult.solveTimeMs)}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs text-zinc-500 uppercase">Elo Change</span>
                                        <span className={`font-mono text-xl font-bold ${matchResult.eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {matchResult.eloChange > 0 ? "+" : ""}{matchResult.eloChange}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={onExit}
                            className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-black font-bold transition"
                        >
                            Return to Matchmaking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
