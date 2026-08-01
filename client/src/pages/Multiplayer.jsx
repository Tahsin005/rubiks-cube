import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGetProfileQuery } from '@/redux/api/usersApi';
import { useWebSocket } from '@/providers/WebSocketProvider';
import RankedGame from '@/components/RankedGame';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Multiplayer() {
    const { user } = useAuth();
    const { data: profile } = useGetProfileQuery(user?.username, { skip: !user?.username });
    const { isConnected, sendMessage, addListener } = useWebSocket();

    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [matchState, setMatchState] = useState(null);

    useEffect(() => {
        const removeFoundListener = addListener("MATCH_FOUND", (payload) => {
            setIsSearching(false);
            setMatchState(payload);
        });

        const removeEndListener = addListener("MATCH_END", (payload) => {
            if (payload.aborted) {
                setMatchState(null);
                alert(payload.reason || "Match aborted");
            }
        });

        return () => {
            removeFoundListener();
            removeEndListener();
        };
    }, [addListener]);

    // Timer for searching
    useEffect(() => {
        let interval;
        if (isSearching) {
            interval = setInterval(() => {
                setSearchTime(prev => {
                    if (prev >= 60) {
                        sendMessage("MATCH_SEARCH_CANCEL", {});
                        setIsSearching(false);
                        alert("No match found in 60 seconds.");
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            setSearchTime(0);
        }
        return () => clearInterval(interval);
    }, [isSearching, sendMessage]);

    const handleSearch = () => {
        if (!isConnected) return alert("Connecting to server...");
        sendMessage("MATCH_SEARCH_START", {});
        setIsSearching(true);
    };

    const handleCancelSearch = () => {
        sendMessage("MATCH_SEARCH_CANCEL", {});
        setIsSearching(false);
    };

    if (matchState) {
        return <RankedGame matchState={matchState} userElo={profile?.data?.elo?.current || 1000} onExit={() => setMatchState(null)} />;
    }

    const elo = profile?.data?.elo?.current || 1000;
    const tier = profile?.data?.eloTier;

    return (
        <Card className="w-full max-w-2xl mx-auto mt-12 rounded-3xl bg-[#18181b] border-[#27272a]/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#3b82f6]/10 blur-[100px] pointer-events-none" />

            <CardHeader className="flex flex-col items-center pt-10 pb-0 z-10 relative">
                <h1 className="text-4xl font-black mb-3 text-white drop-shadow-sm">
                    Ranked Arena
                </h1>
                <p className="text-[#a1a1aa] text-center font-medium">
                    Match up. Solve fast. Climb the leaderboard.
                </p>
            </CardHeader>

            <CardContent className="flex flex-col items-center p-10 z-10 relative">
                <Card className="flex flex-col items-center bg-[#09090b]/80 backdrop-blur-sm p-8 rounded-2xl border-[#3f3f46]/50 w-full mb-10 relative shadow-inner">
                    <div className="text-sm text-[#71717a] uppercase tracking-[0.2em] font-bold mb-2">
                        Current Rating
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-6xl font-black font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {elo}
                        </div>
                    </div>

                    {tier && (
                        <Badge
                            variant="outline"
                            className="mt-3 rounded-full text-xs font-bold uppercase tracking-wider border"
                            style={{
                                backgroundColor: `${tier.badgeColor}20`,
                                color: tier.badgeColor,
                                borderColor: `${tier.badgeColor}50`
                            }}
                        >
                            {tier.name}
                        </Badge>
                    )}
                </Card>

                {isSearching ? (
                    <div className="flex flex-col items-center w-full">
                        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                            <div className="relative z-10 w-16 h-16 rounded-lg bg-[#2563eb] flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                                <span className="text-xl font-black text-white">{searchTime}s</span>
                            </div>
                        </div>

                        <div className="text-[#93c5fd] font-medium tracking-[0.2em] mb-6 animate-pulse">
                            Scanning for opponent...
                        </div>

                        <Separator className="mb-6 bg-[#27272a]/50" />

                        <Button
                            onClick={handleCancelSearch}
                            variant="secondary"
                            className="w-full py-4 h-auto rounded-xl bg-[#27272a]/80 hover:bg-[#3f3f46] text-[#d4d4d8] font-bold tracking-widest uppercase border border-[#3f3f46] hover:border-[#71717a] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            Abort Search
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={handleSearch}
                        disabled={!isConnected}
                        className="group relative w-full py-5 h-auto rounded-xl bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl tracking-[0.15em] overflow-hidden shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all"
                    >
                        <div className="absolute inset-0 w-full h-full bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
                        <span className="relative z-10">{isConnected ? "Find Match" : "Connecting..."}</span>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}