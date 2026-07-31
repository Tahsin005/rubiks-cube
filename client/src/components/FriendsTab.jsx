import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useGetFriendsQuery } from "../redux/api/friendsApi";
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "accepted", label: "Friends" },
  { value: "pending", label: "Pending" },
];

function statusLabel(entry) {
  if (entry.status === "accepted") return { text: "Friends", cls: "text-emerald-400" };
  if (entry.status === "pending") {
    const dir = entry.initiatedBy === "me" ? "sent" : "received";
    return { text: `Pending (${dir})`, cls: "text-amber-400" };
  }
  return { text: entry.status, cls: "text-zinc-400" };
}

export default function FriendsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data, isLoading, isFetching, error } = useGetFriendsQuery({
    status: statusFilter,
    page,
    limit: PAGE_SIZE,
  });

  // Reset to page 1 when filter changes
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const rawFriends = data?.data?.friends ?? [];
  const pagination = data?.data?.pagination;
  const hasNextPage = rawFriends.length === PAGE_SIZE;
  const hasPrevPage = page > 1;

  const friends = useMemo(() => {
    if (!search.trim()) return rawFriends;
    const q = search.toLowerCase();
    return rawFriends.filter((f) => f.friend.username.toLowerCase().includes(q));
  }, [rawFriends, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-zinc-500" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-400 text-sm text-center py-8">
        Failed to load friends list.
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toolbar — Ranking page style */}
      <div className="flex items-center gap-4 mb-2 relative">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username…"
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>

        {/* Filter button + popover */}
        <div className="relative">
          <Button
            variant="outline"
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter size={16} className="mr-2" />
            Filter
            {statusFilter && <span className="ml-2 w-2 h-2 rounded-full bg-blue-500" />}
          </Button>

          {showFilter && (
            <div className="absolute top-full mt-2 right-0 w-52 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-20">
              <h3 className="text-sm font-semibold text-white mb-3">Filter by Status</h3>
              <div className="flex flex-col gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      statusFilter === opt.value
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-sm whitespace-nowrap">
            <TableHeader className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 uppercase text-xs">
              <TableRow className="hover:bg-transparent border-zinc-800/50">
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Name</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Status</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-800/50">
              {friends.length === 0 ? (
                <TableRow className="hover:bg-transparent border-zinc-800/50">
                  <TableCell colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                    No entries found.
                  </TableCell>
                </TableRow>
              ) : (
                friends.map((entry) => {
                  const sl = statusLabel(entry);
                  return (
                    <TableRow
                      key={entry.friendshipId}
                      className="hover:bg-zinc-800/50 transition-colors group border-zinc-800/50 border-b-0"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={entry.friend.avatarUrl} alt={entry.friend.username} />
                              <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400 uppercase">
                                {entry.friend.username.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            {entry.friend.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#121212] rounded-full z-10" title="Online"></div>
                            )}
                          </div>
                          <span className="text-zinc-100 font-medium truncate">
                            @{entry.friend.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`text-sm font-medium ${sl.cls}`}>
                          {sl.text}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Link to={`/user/${entry.friend.username}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-950/20 transition-colors"
                          >
                            <ExternalLink size={13} className="mr-1.5" />
                            Details
                          </Button>
                        </Link>
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
          <span className="text-xs text-zinc-500">
            Page {page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!hasPrevPage || isFetching}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 disabled:opacity-50"
              onClick={() => setPage(p => p + 1)}
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
