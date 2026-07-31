import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useGetFriendsQuery } from "../redux/api/friendsApi";
import { Loader2, Search, ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const selectedLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "All";

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username…"
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-500/40 rounded-xl"
          />
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-600 transition focus:outline-none min-w-[160px] justify-between">
            <span>Status: <span className="text-white font-medium">{selectedLabel}</span></span>
            <ChevronDown size={14} className="text-zinc-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl min-w-[160px]">
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`cursor-pointer rounded-lg focus:bg-zinc-800 focus:text-white ${
                  statusFilter === opt.value ? "text-blue-400 font-semibold" : ""
                }`}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {friends.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">No entries found.</p>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Name</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Status</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Action</span>
          </div>

          {friends.map((entry) => {
            const sl = statusLabel(entry);
            return (
              <div
                key={entry.friendshipId}
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-zinc-800/60 last:border-none hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={entry.friend.avatarUrl} alt={entry.friend.username} />
                    <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400 uppercase">
                      {entry.friend.username.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-zinc-100 font-medium truncate">
                    @{entry.friend.username}
                  </span>
                </div>

                <span className={`text-sm font-medium whitespace-nowrap ${sl.cls}`}>
                  {sl.text}
                </span>

                <Link to={`/user/${entry.friend.username}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-950/20 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <ExternalLink size={13} className="mr-1.5" />
                    Details
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500">
            Page {page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevPage || isFetching}
              onClick={() => setPage((p) => p - 1)}
              className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl disabled:opacity-40"
            >
              <ChevronLeft size={15} className="mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
