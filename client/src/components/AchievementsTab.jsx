import { useState } from "react";
import { useGetAchievementsQuery } from "../redux/api/usersApi";
import { Loader2, Filter, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORY_OPTIONS = [
  { value: "", label: "All" },
  { value: "matches", label: "Matches" },
  { value: "solves", label: "Solves" },
  { value: "social", label: "Social" },
  { value: "elo", label: "ELO" },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CATEGORY_COLORS = {
  matches: "text-blue-400 bg-blue-950/30 border-blue-800/40",
  solves: "text-purple-400 bg-purple-950/30 border-purple-800/40",
  social: "text-emerald-400 bg-emerald-950/30 border-emerald-800/40",
  elo: "text-amber-400 bg-amber-950/30 border-amber-800/40",
};

const PAGE_SIZE = 10;

export default function AchievementsTab({ username }) {
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, isLoading, isFetching } = useGetAchievementsQuery({
    username,
    page,
    limit: PAGE_SIZE,
    category,
  });

  const achievements = data?.data?.achievements ?? [];
  const hasNextPage = achievements.length === PAGE_SIZE;
  const hasPrevPage = page > 1;

  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(1);
    setShowFilter(false);
  };

  const activeCount = category ? 1 : 0;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toolbar — matches Ranking page style */}
      <div className="flex items-center gap-4 mb-2 relative">
        {/* Filter button */}
        <div className="relative ml-auto">
          <Button
            variant="outline"
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter size={16} className="mr-2" />
            Filter
            {activeCount > 0 && (
              <span className="ml-2 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </Button>

          {showFilter && (
            <div className="absolute top-full mt-2 right-0 w-52 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-20">
              <h3 className="text-sm font-semibold text-white mb-3">Filter by Category</h3>
              <div className="flex flex-col gap-1.5">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === opt.value
                        ? "bg-blue-950/60 text-blue-400 font-semibold"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-sm whitespace-nowrap">
            <TableHeader className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 uppercase text-xs">
              <TableRow className="hover:bg-transparent border-zinc-800/50">
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Achievement</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400 text-right">Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <TableRow className="hover:bg-transparent border-zinc-800/50">
                  <TableCell colSpan={2} className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-zinc-500" size={28} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : achievements.length === 0 ? (
                <TableRow className="hover:bg-transparent border-zinc-800/50">
                  <TableCell colSpan={2} className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Trophy className="text-zinc-700" size={40} />
                      <p className="text-zinc-500 text-sm">No achievements earned yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                achievements.map((a) => {
                  const catCls = CATEGORY_COLORS[a.category] ?? "text-zinc-400 bg-zinc-800/40 border-zinc-700/40";
                  return (
                    <TableRow
                      key={a.id}
                      className="hover:bg-zinc-800/50 transition-colors group border-zinc-800/50 border-b-0"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center shrink-0">
                            {a.iconUrl ? (
                              <img src={a.iconUrl} alt={a.name} className="w-6 h-6 object-contain" />
                            ) : (
                              <Trophy className="text-zinc-500" size={18} />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-zinc-100 font-semibold text-sm">{a.name}</span>
                              {a.category && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catCls}`}>
                                  {a.category}
                                </span>
                              )}
                            </div>
                            {a.description && (
                              <span className="text-zinc-500 text-xs mt-0.5 truncate">{a.description}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className="text-zinc-400 text-sm whitespace-nowrap font-mono">
                          {formatDate(a.earnedAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-500">Page {page}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrevPage || isFetching}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || isFetching}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
