import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useGetMyMatchesQuery, useGetMatchHistoryQuery } from "../redux/api/usersApi";
import { Loader2, Swords, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

export default function MatchesTab({ isSelf, profileUsername }) {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const myMatchesQuery = useGetMyMatchesQuery(
    { page, limit: PAGE_SIZE },
    { skip: !isSelf }
  );

  const historyQuery = useGetMatchHistoryQuery(
    { opponentUsername: profileUsername, page, limit: PAGE_SIZE },
    { skip: isSelf }
  );

  const query = isSelf ? myMatchesQuery : historyQuery;
  const { data, isLoading, isFetching } = query;

  const matches = data?.data?.matches ?? [];
  const hasNextPage = matches.length === PAGE_SIZE;
  const hasPrevPage = page > 1;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-4 mb-2">
        {isSelf ? (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
            onClick={() => navigate('/play')}
          >
            <Swords size={16} className="mr-2" />
            Multiplayer (1v1)
          </Button>
        ) : (
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
            onClick={() => navigate(`/play?invite=${profileUsername}`)}
          >
            <Swords size={16} className="mr-2" />
            Invite
          </Button>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-sm whitespace-nowrap">
            <TableHeader className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 uppercase text-xs">
              <TableRow className="hover:bg-transparent border-zinc-800/50">
                <TableHead className="px-6 py-4 font-medium text-zinc-400">SL</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400">VS</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Status</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Winner</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Type</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400">Delta</TableHead>
                <TableHead className="px-6 py-4 font-medium text-zinc-400 text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <TableRow className="hover:bg-transparent border-zinc-800/50">
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-zinc-500" size={28} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : matches.length === 0 ? (
                <TableRow className="hover:bg-transparent border-zinc-800/50">
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    No matches found.
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((m, idx) => (
                  <TableRow
                    key={m.matchId}
                    className="hover:bg-zinc-800/50 transition-colors group border-zinc-800/50 border-b-0"
                  >
                    <TableCell className="px-6 py-4 text-zinc-400">
                      {(page - 1) * PAGE_SIZE + idx + 1}.
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={m.oppositionAvatarUrl} alt={m.oppositionUsername} />
                          <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400 uppercase">
                            {m.oppositionUsername?.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-zinc-100 font-medium truncate capitalize">
                            {m.oppositionUsername}
                          </span>
                          <span className="text-zinc-500 text-xs">
                            @{m.oppositionUsername}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-zinc-300 capitalize">
                      {m.status}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`capitalize ${m.winner === 'me' ? 'text-emerald-400 font-medium' : m.winner === 'them' ? 'text-red-400' : 'text-zinc-400'}`}>
                        {m.winner}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-zinc-400 capitalize">
                      {m.matchType}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`font-mono ${m.eloChange && m.eloChange.startsWith('+') && m.eloChange !== '+0' ? 'text-emerald-400' : m.eloChange && m.eloChange.startsWith('-') ? 'text-red-400' : 'text-zinc-500'}`}>
                        {m.eloChange || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Link to={`/match/${m.matchId}`}>
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
                ))
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
