import { useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { Menu, X, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const tabs = isAuthenticated 
    ? [
        { path: "/", label: "timer" },
        { path: "/playground", label: "playground" },
        { path: "/multiplayer", label: "multiplayer" },
      ]
    : [
        { path: "/", label: "timer" },
        { path: "/playground", label: "playground" },
        { path: "/rankings", label: "ranking" },
      ];

  const activeTab = tabs.find(t => t.path === location.pathname)?.label || "timer";

  return (
    <div className="w-full max-w-4xl mx-auto relative z-50 mt-6">
      <nav className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        <div className="hidden md:flex gap-1 flex-shrink-0">
          {tabs.map((t) => {
            const isActive = location.pathname === t.path;
            return (
              <Link
                key={t.path}
                to={t.path}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize z-10 ${
                  isActive ? "text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="absolute inset-0 bg-white rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex px-2 items-center flex-shrink-0 ml-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full overflow-hidden hover:opacity-80 transition ml-2 focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                  <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300 uppercase">
                    {user?.username?.substring(0, 2) || <User size={14} />}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl">
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer focus:text-white p-0">
                  <Link to={`/user/${user?.username}`} className="w-full flex items-center px-3 py-2">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link 
              to="/auth"
              className="text-sm font-medium text-blue-400 hover:text-blue-300 px-4 py-1"
            >
              Signin
            </Link>
          )}
        </div>

        <div className="md:hidden flex items-center justify-between w-full px-3 py-1.5">
          <span className="text-zinc-300 font-semibold capitalize">{activeTab}</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex flex-col gap-2 md:hidden shadow-2xl"
          >
            {tabs.map((t) => {
              const isActive = location.pathname === t.path;
              return (
                <Link
                  key={t.path}
                  to={t.path}
                  onClick={() => setIsOpen(false)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    isActive ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
            <div className="h-px bg-zinc-800 my-1" />
            {isAuthenticated ? (
              <div className="flex flex-col gap-1">
                <Link 
                  to={`/user/${user?.username}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Profile
                </Link>
                <button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-zinc-800 hover:text-blue-300 transition-colors"
              >
                Signin
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
