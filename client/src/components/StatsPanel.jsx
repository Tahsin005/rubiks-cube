import { formatTime } from "../utils/stats";

const ROW_DEFS = [
  { label: "Single PB", current: "pb", best: "pb" },
  { label: "Ao5", current: "ao5", best: "bestAo5" },
  { label: "Ao12", current: "ao12", best: "bestAo12" },
  { label: "Ao25", current: "ao25", best: "bestAo25" },
  { label: "Ao50", current: "ao50", best: "bestAo50" },
  { label: "Ao100", current: "ao100", best: "bestAo100" },
  { label: "AoAll", current: "aoAll", best: null },
];

export default function StatsPanel({ stats, solves }) {
  if (!stats || solves.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-zinc-500 text-sm text-center py-8">No solves yet.<br />Complete a solve to see stats.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Statistics · {stats.count} solves</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-600 uppercase tracking-wider">
            <th className="text-left px-4 py-2">Avg</th>
            <th className="text-right px-4 py-2">Current</th>
            <th className="text-right px-4 py-2">Best</th>
          </tr>
        </thead>
        <tbody>
          {ROW_DEFS.map(({ label, current, best }) => {
            const cur = stats[current];
            const bst = best ? stats[best] : null;
            const isCurrentBest = cur != null && bst != null && Math.abs(cur - bst) < 1;
            return (
              <tr key={label} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-2.5 text-zinc-400 font-medium">{label}</td>
                <td className={`px-4 py-2.5 text-right font-mono ${isCurrentBest ? "text-yellow-400" : "text-zinc-100"}`}>
                  {formatTime(cur)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-green-400">
                  {best ? formatTime(bst) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}