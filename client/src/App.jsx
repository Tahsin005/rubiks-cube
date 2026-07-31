import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RubiksCube from "./components/RubiksCube";
import Timer from "./components/Timer";
import Navbar from "./components/Navbar";

export default function App() {
  const [tab, setTab] = useState("timer");

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-y-scroll">
      <div className="px-4">
        <Navbar tab={tab} setTab={setTab} />
      </div>

      <div className="flex items-start justify-center p-4 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            {tab === "timer" && <Timer />}
            {tab === "playground" && <RubiksCube />}
            {tab === "ranking" && (
              <div className="text-zinc-400 mt-20">Ranking (Coming Soon)</div>
            )}
            {tab === "multiplayer" && (
              <div className="text-zinc-400 mt-20">Multiplayer (Coming Soon)</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}