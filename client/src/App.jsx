import { Outlet } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-y-scroll">
      <div className="px-4">
        <Navbar />
      </div>

      <div className="flex items-start justify-center p-4 mt-4">
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </div>
    </main>
  );
}