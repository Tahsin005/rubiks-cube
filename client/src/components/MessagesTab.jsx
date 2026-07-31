import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  useGetConversationsQuery,
  useGetMessagesWithUserQuery,
  useMarkAsReadMutation
} from "../redux/api/messagesApi";
import { useWebSocket } from "../providers/WebSocketProvider";
import { useSelector } from "react-redux";
import { MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesTab({ isSelf, profileUsername }) {
  if (isSelf) {
    return <ConversationsList />;
  }
  return <ChatInterface friendUsername={profileUsername} />;
}

function ConversationsList() {
  const { data, isLoading } = useGetConversationsQuery();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const conversations = data?.data?.conversations ?? [];

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <MessageSquare className="text-muted-foreground" size={40} strokeWidth={1.5} />
          <p className="text-muted-foreground text-sm">No active conversations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((conv) => (
        <Card
          key={conv.friendId}
          onClick={() => navigate(`/user/${conv.friendUsername}`)}
          className="cursor-pointer transition-colors hover:bg-accent"
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={conv.friendAvatarUrl} alt={conv.friendUsername} />
                <AvatarFallback className="uppercase font-medium">
                  {conv.friendUsername.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-lg text-card-foreground">
                  {conv.friendUsername}
                </span>
                <span className="text-muted-foreground text-sm truncate max-w-[200px] md:max-w-md">
                  {conv.isLastMessageFromMe ? "You: " : ""}
                  {conv.lastMessage}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end justify-center gap-2 shrink-0">
              <span className="text-muted-foreground text-xs font-medium">
                {new Date(conv.lastMessageAt).toLocaleDateString()}
              </span>
              {conv.unreadCount > 0 ? (
                <Badge className="h-5 w-5 justify-center rounded-full p-0 text-[11px] font-bold">
                  {conv.unreadCount}
                </Badge>
              ) : (
                <div className="h-5 w-5" /> // placeholder to keep alignment
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChatInterface({ friendUsername }) {
  const me = useSelector((state) => state.auth.user);
  const { data, isLoading } = useGetMessagesWithUserQuery({ friendUsername, limit: 100 });
  const [markAsRead] = useMarkAsReadMutation();
  const { isConnected, sendMessage, addListener } = useWebSocket();
  const [inputText, setInputText] = useState("");

  // Keep track of optimistic messages and incoming WS messages
  const [liveMessages, setLiveMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // Mark as read when opening
  useEffect(() => {
    markAsRead(friendUsername);
  }, [friendUsername, markAsRead]);

  // Handle incoming WS messages
  useEffect(() => {
    const handleReceive = (payload) => {
      if (payload.senderUsername === friendUsername) {
        setLiveMessages((prev) => {
          if (prev.find(m => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        markAsRead(friendUsername);
      }
    };

    const handleAck = (payload) => {
      // payload.clientId has the temporary ID we created optimistically
      setLiveMessages((prev) => {
        // Remove the temporary message and append the real one from the server
        const filtered = prev.filter(m => m.id !== payload.clientId && m.id !== payload.id);
        return [...filtered, payload];
      });
    };

    const unsubReceive = addListener("CHAT_MESSAGE_RECEIVE", handleReceive);
    const unsubAck = addListener("CHAT_MESSAGE_ACK", handleAck);

    return () => {
      unsubReceive();
      unsubAck();
    };
  }, [addListener, friendUsername, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data, liveMessages]);

  const dbMessages = data?.data?.messages ?? [];

  const allMessagesMap = new Map();
  dbMessages.forEach(m => allMessagesMap.set(m.id, m));
  liveMessages.forEach(m => allMessagesMap.set(m.id, m));

  const allMessages = Array.from(allMessagesMap.values()).sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;

    // Use a unique client ID for optimistic deduplication
    const clientId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    sendMessage("CHAT_MESSAGE_SEND", {
      targetUsername: friendUsername,
      content: inputText,
      clientId: clientId
    });

    // Optimistic UI
    setLiveMessages(prev => [...prev, {
      id: clientId,
      senderId: me.id,
      content: inputText,
      sentAt: new Date().toISOString(),
    }]);

    setInputText("");
  };

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden p-0 gap-0">
      <CardHeader className="flex items-center justify-center py-4 [.border-b]:pb-4 border-b">
        <span className="font-semibold text-lg text-card-foreground">{friendUsername}</span>
      </CardHeader>

      <ScrollArea className="flex-1 p-4 h-full">
        <div className="flex flex-col gap-4 min-h-full">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-2/3 self-start rounded-2xl" />
              <Skeleton className="h-10 w-1/2 self-end rounded-2xl" />
              <Skeleton className="h-10 w-3/5 self-start rounded-2xl" />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm h-full">
              No messages yet. Say hi!
            </div>
          ) : (
            allMessages.map((msg) => {
              const isMe = msg.senderId === me.id;
              const timeString = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg.id} className={`flex max-w-[75%] ${isMe ? "self-end" : "self-start"} flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-5 py-2.5 shadow-sm text-[15px] rounded-2xl ${isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                  >
                    <p className="break-words leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground px-1">
                    {timeString}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      <CardContent className="p-4">
        <form onSubmit={handleSend} className="flex gap-3 bg-muted rounded-full p-1 pl-4 items-center border border-border focus-within:border-ring transition-colors">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 outline-none text-[15px] p-0 h-auto"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || !isConnected}
            className="h-10 w-10 rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={18} className="ml-[-2px]" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}