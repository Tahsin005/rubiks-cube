import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RubiksCube from "./components/RubiksCube";
import Timer from "./components/Timer";

export default function App() {
  const [tab, setTab] = useState("timer");

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-y-scroll">
      <div className="flex justify-center pt-6 pb-2">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {["timer", "playground"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize z-10 ${tab === t
                  ? "text-black"
                  : "text-zinc-400 hover:text-white"
                }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {t === "timer" ? "Timer" : "Playground"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            {tab === "timer" ? <Timer /> : <RubiksCube />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}