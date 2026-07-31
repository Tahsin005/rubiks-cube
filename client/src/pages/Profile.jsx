import { useState } from "react";
import { useParams, Link } from "react-router";
import { useGetProfileQuery } from "../redux/api/usersApi";
import {
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useRemoveFriendMutation,
} from "../redux/api/friendsApi";
import { Loader2, ArrowLeft, UserPlus, UserX, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FriendsTab from "../components/FriendsTab";
import AchievementsTab from "../components/AchievementsTab";
import MatchesTab from "../components/MatchesTab";

export default function Profile() {
  const { username } = useParams();
  const { data, isLoading, error, refetch } = useGetProfileQuery(username);
  const [activeTab, setActiveTab] = useState(null);

  const [sendRequest, { isLoading: isSending }] = useSendFriendRequestMutation();
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectFriendRequestMutation();
  const [removeRequest, { isLoading: isRemoving }] = useRemoveFriendMutation();

  const handleFriendAction = async (action) => {
    try {
      await action(username).unwrap();
      refetch();
    } catch (e) {
      // error handled silently; toast can be added later
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="text-center mt-20 text-red-500">
        User not found or an error occurred.
      </div>
    );
  }

  const profile = data.data;

  const isSelf = profile.is_self;
  const isFriend = profile.friendship?.status === 'accepted';

  const tabs = isSelf 
    ? ["My Matches", "Friends", "Achievements"]
    : ["Match History", isFriend ? "Messages" : null, "Achievements"].filter(Boolean);

  const currentTab = activeTab || tabs[0];

  let friendshipStatusBtn = null;
  if (!profile.is_self) {
    const status = profile.friendship?.status;
    const viewerRole = profile.friendship?.viewerRole; // 'sender' | 'receiver'

    if (!status) {
      // No relationship — allow sending a request
      friendshipStatusBtn = (
        <Button
          onClick={() => handleFriendAction(sendRequest)}
          disabled={isSending}
          variant="outline"
          className="bg-emerald-900/20 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/40 hover:text-emerald-300 mt-4 rounded-xl"
        >
          <UserPlus size={16} className="mr-2" />
          {isSending ? "Sending..." : "Add Friend"}
        </Button>
      );
    } else if (status === 'pending' && viewerRole === 'sender') {
      // Current user sent the request — allow cancelling
      friendshipStatusBtn = (
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            disabled
            className="bg-amber-900/20 text-amber-400 border-amber-800/50 rounded-xl"
          >
            <Clock size={16} className="mr-2" />
            Pending
          </Button>
          <Button
            onClick={() => handleFriendAction(removeRequest)}
            disabled={isRemoving}
            variant="outline"
            className="bg-red-900/20 text-red-400 border-red-800/50 hover:bg-red-900/40 hover:text-red-300 rounded-xl"
          >
            <UserX size={16} className="mr-2" />
            {isRemoving ? "Cancelling..." : "Cancel"}
          </Button>
        </div>
      );
    } else if (status === 'pending' && viewerRole === 'receiver') {
      // Current user received a request — allow accepting or rejecting
      friendshipStatusBtn = (
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => handleFriendAction(acceptRequest)}
            disabled={isAccepting}
            variant="outline"
            className="bg-emerald-900/20 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/40 hover:text-emerald-300 rounded-xl"
          >
            <UserCheck size={16} className="mr-2" />
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
          <Button
            onClick={() => handleFriendAction(rejectRequest)}
            disabled={isRejecting}
            variant="outline"
            className="bg-red-900/20 text-red-400 border-red-800/50 hover:bg-red-900/40 hover:text-red-300 rounded-xl"
          >
            <UserX size={16} className="mr-2" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      );
    } else if (status === 'accepted') {
      // Already friends — allow removing
      friendshipStatusBtn = (
        <Button
          onClick={() => handleFriendAction(removeRequest)}
          disabled={isRemoving}
          variant="outline"
          className="bg-blue-900/20 text-blue-400 border-blue-800/50 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800/50 mt-4 rounded-xl transition-colors"
        >
          <UserCheck size={16} className="mr-2" />
          {isRemoving ? "Removing..." : "Friends"}
        </Button>
      );
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      <Link to="/rankings" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Rankings
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 bg-zinc-900/40 border border-zinc-800/80 p-8 md:p-12 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-2xl">
        
        <div className="flex flex-col items-center md:items-start gap-5 z-10 w-full md:w-auto">
          <Avatar className="w-32 h-32 border-4 border-zinc-800 shadow-xl bg-zinc-800">
            <AvatarImage src={profile.avatarUrl} alt={profile.username} className="object-cover" />
            <AvatarFallback className="text-4xl font-bold text-zinc-600 bg-zinc-900 uppercase">
              {profile.username.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-center md:items-start w-full">
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-5 py-3 flex items-center gap-3 shadow-inner w-full md:w-auto justify-center">
              <span className="text-2xl font-bold text-white tracking-tight">@{profile.username}</span>
              {profile.countryCode && (
                <span className="text-2xl" title={profile.countryCode}>
                  🏁
                </span>
              )}
            </div>

            {friendshipStatusBtn}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-6 z-10 w-full md:w-auto pt-4 md:pt-0 border-t border-zinc-800 md:border-none">
          {profile.eloTier?.name ? (
            <Badge 
              variant="outline"
              className="bg-zinc-800/40 backdrop-blur-sm border font-bold px-8 py-3 rounded-2xl text-xl tracking-widest uppercase shadow-lg"
              style={{ 
                color: profile.eloTier.badgeColor || '#3b82f6', 
                borderColor: profile.eloTier.badgeColor ? `${profile.eloTier.badgeColor}50` : 'rgba(59,130,246,0.3)' 
              }}
            >
              {profile.eloTier.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-zinc-800/50 border-zinc-700 text-zinc-400 font-bold px-8 py-3 rounded-2xl text-xl tracking-widest uppercase">
              Unranked
            </Badge>
          )}

          <div className="flex flex-col items-center gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800/50 shadow-inner w-full md:w-auto">
            <div className="w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-2xl flex justify-center items-center shadow-lg p-3">
              {profile.eloTier?.iconUrl ? (
                <img src={profile.eloTier.iconUrl} alt={profile.eloTier.name} className="w-full h-full object-contain" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center rounded-xl border"
                  style={{ 
                    backgroundColor: profile.eloTier?.badgeColor ? `${profile.eloTier.badgeColor}15` : 'rgba(255,255,255,0.02)',
                    borderColor: profile.eloTier?.badgeColor ? `${profile.eloTier.badgeColor}30` : 'rgba(255,255,255,0.1)'
                  }}
                >
                  <span 
                    className="font-black text-3xl uppercase" 
                    style={{ color: profile.eloTier?.badgeColor || '#71717a' }}
                  >
                    {profile.eloTier?.name ? profile.eloTier.name.charAt(0) : 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <div className="text-white font-black text-3xl tracking-tighter">
                {profile.elo.current}
              </div>
              <div className="text-zinc-500 text-sm font-medium tracking-wide">
                MAX: {profile.elo.max}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard title="Played" value={profile.stats.totalMatchPlayed} />
        <StatCard title="Won" value={profile.stats.win} />
        <StatCard title="Lost" value={profile.stats.loss} />
        <StatCard title="Wp" value={`${profile.stats.winPercentage}%`} highlight />
      </div>

      {/* Tab Navigation */}
      <div className="mt-12 flex flex-col items-center mb-12">
        <div className="flex flex-wrap gap-2 p-2 rounded-2xl border-2 border-blue-500/40 bg-blue-950/20 w-full max-w-2xl justify-center shadow-inner backdrop-blur-md">
          {tabs.map((tab) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base tracking-wide ${
                  isActive
                    ? "bg-red-950/80 text-blue-400 border border-red-900 shadow-md"
                    : "text-zinc-400 hover:text-blue-300 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
        
        {/* Tab Content Area */}
        <div className={`mt-6 w-full max-w-4xl bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-sm shadow-xl ${
          currentTab === "Friends" ? "" : "min-h-[300px] flex flex-col items-center justify-center"
        }`}>
          {isSelf && currentTab === "Friends" ? (
            <FriendsTab />
          ) : currentTab === "Achievements" ? (
            <AchievementsTab username={profile.username} />
          ) : currentTab === "My Matches" || currentTab === "Match History" ? (
            <MatchesTab isSelf={isSelf} profileUsername={profile.username} />
          ) : (
            <p className="text-zinc-500 text-lg font-medium">{currentTab} content coming soon...</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }) {
  return (
    <Card className={`bg-zinc-900/40 border ${highlight ? 'border-blue-500/30 bg-blue-950/10' : 'border-zinc-800/80'} rounded-3xl transition-all hover:bg-zinc-800/40 shadow-sm backdrop-blur-sm`}>
      <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
        <span className="text-zinc-500 font-medium uppercase tracking-widest text-xs">{title}</span>
        <span className={`text-3xl font-black tracking-tighter ${highlight ? 'text-blue-400' : 'text-zinc-100'}`}>{value}</span>
      </CardContent>
    </Card>
  );
}
