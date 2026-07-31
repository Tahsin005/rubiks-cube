import { useState } from "react";
import { formatTime } from "../utils/stats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function SolveList({ solves, onDelete, onClear }) {
  const [expanded, setExpanded] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const reversed = [...solves].reverse();

  return (
    <Card className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col w-full shadow-lg">
      <CardHeader className="px-4 py-3 border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs text-zinc-500 uppercase tracking-widest">Solves</CardTitle>
        {solves.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 transition h-auto py-1 px-2"
          >
            Clear all
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {solves.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">No solves yet.</p>
        ) : (
          <ScrollArea className="h-[480px] w-full">
          {reversed.map((solve, i) => {
            const num = solves.length - i;
            const isOpen = expanded === solve.id;
            return (
              <div key={solve.id} className="border-t border-zinc-800/50">
                <button
                  onClick={() => setExpanded(isOpen ? null : solve.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-6 text-right">{num}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm text-zinc-100">{formatTime(solve.time)}</span>
                      {solve.penalty === "+2" && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">+2</span>
                          <span className="text-[10px] text-zinc-500 font-mono">({formatTime(solve.time - 2000)} raw)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">
                      {new Date(solve.date).toLocaleDateString()}
                    </span>
                    <span className="text-zinc-600 text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 bg-zinc-800/20">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Scramble</p>
                    <p className="font-mono text-xs text-zinc-300 leading-relaxed break-all">{solve.scramble}</p>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => onDelete(solve.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition"
                      >
                        Delete solve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </ScrollArea>
        )}
      </CardContent>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-zinc-100">Clear all solves?</CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                This action cannot be undone. All your solves and statistics will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3 pb-6">
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onClear();
                  setShowConfirm(false);
                }}
                className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Clear All
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}