import { useState, useEffect } from "react";
import { useGetRankingsQuery } from "../redux/api/usersApi";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatTime(ms) {
  if (!ms || ms === 0) return "-";
  return (ms / 1000).toFixed(2);
}

export default function Ranking() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ minElo: "", minWinRate: "", maxPb: "" });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetRankingsQuery({
    page,
    limit,
    search: debouncedSearch,
    ...appliedFilters,
  });

  const rankings = data?.data?.rankings || [];

  const applyFilters = () => {
    setAppliedFilters({
      minElo: filters.minElo ? Number(filters.minElo) : undefined,
      minWinRate: filters.minWinRate ? Number(filters.minWinRate) : undefined,
      maxPb: filters.maxPb ? Number(filters.maxPb) * 1000 : undefined, // Assuming user inputs seconds
    });
    setPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ minElo: "", minWinRate: "", maxPb: "" });
    setAppliedFilters({});
    setPage(1);
    setShowFilters(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex items-center gap-4 mb-6 relative">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input 
            placeholder="Search users..." 
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Button 
            variant="outline" 
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            Filter
            {Object.keys(appliedFilters).filter(k => appliedFilters[k] !== undefined).length > 0 && (
              <span className="ml-2 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </Button>

          {showFilters && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-20">
              <h3 className="text-sm font-semibold text-white mb-4">Filter Rankings</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Min ELO</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 1200" 
                    className="bg-zinc-950 border-zinc-800 text-white h-8 text-sm"
                    value={filters.minElo}
                    onChange={(e) => setFilters({ ...filters, minElo: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Min Win Rate (%)</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 50" 
                    className="bg-zinc-950 border-zinc-800 text-white h-8 text-sm"
                    value={filters.minWinRate}
                    onChange={(e) => setFilters({ ...filters, minWinRate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Max PB (seconds)</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 20.5" 
                    className="bg-zinc-950 border-zinc-800 text-white h-8 text-sm"
                    value={filters.maxPb}
                    onChange={(e) => setFilters({ ...filters, maxPb: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={applyFilters}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">SL</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">ELO</th>
                <th className="px-6 py-4 font-medium">Mp</th>
                <th className="px-6 py-4 font-medium">Wp</th>
                <th className="px-6 py-4 font-medium">PB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-zinc-500">
                    Loading rankings...
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-zinc-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                rankings.map((user, idx) => (
                  <tr key={user.username} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 text-zinc-400">
                      {(page - 1) * limit + idx + 1}.
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{user.username}</span>
                        <span className="text-zinc-500 text-xs">(@{user.username})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-400">
                      {user.elo}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {user.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {user.winPercentage}%
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">
                      {formatTime(user.pbTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-500">
            Page {page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading || isFetching}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 disabled:opacity-50"
              onClick={() => setPage(p => p + 1)}
              disabled={rankings.length < limit || isLoading || isFetching}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
