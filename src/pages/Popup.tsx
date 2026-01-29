import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GameContainer } from "../games/GameContainer";
import { dismissReminder, snoozeReminder } from "../lib/tauri";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { playSound, SoundType } from "../lib/sounds";

export function Popup() {
  const [searchParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const id = parseInt(searchParams.get("id") || "0", 10);
  const name = decodeURIComponent(searchParams.get("name") || "Reminder");
  const message = decodeURIComponent(searchParams.get("message") || "");
  const sound = (searchParams.get("sound") || "chime") as SoundType;

  // Play notification sound on popup load
  useEffect(() => {
    if (sound && sound !== "none") {
      // Small delay to ensure window is focused
      setTimeout(() => {
        playSound(sound);
      }, 100);
    }
  }, [sound]);

  const handleWin = async () => {
    setDismissed(true);
    try {
      await dismissReminder(id);
      // Close window after a brief delay to show success
      setTimeout(async () => {
        const window = getCurrentWindow();
        await window.close();
      }, 1000);
    } catch (e) {
      console.error("Failed to dismiss:", e);
    }
  };

  const handleSnooze = async (minutes: number) => {
    setSnoozed(true);
    try {
      await snoozeReminder(id, minutes);
      // Close window
      setTimeout(async () => {
        const window = getCurrentWindow();
        await window.close();
      }, 500);
    } catch (e) {
      console.error("Failed to snooze:", e);
    }
  };

  if (dismissed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Great job!
          </h2>
          <p className="text-gray-400 mt-2">
            Reminder completed
          </p>
        </div>
      </div>
    );
  }

  if (snoozed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Snoozed
          </h2>
          <p className="text-gray-400 mt-2">
            See you soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col p-6">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <div className="relative text-center mb-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {name}
        </h1>
        {message && (
          <p className="text-gray-400 mt-2">
            {message}
          </p>
        )}
      </div>

      {/* Game */}
      <div className="relative flex-1">
        <GameContainer onWin={handleWin} />
      </div>

      {/* Snooze section */}
      <div className="relative mt-6 text-center">
        {showSnoozeOptions ? (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-gray-400 mb-3">
              Snooze for:
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleSnooze(mins)}
                  className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700 border border-purple-500/30 hover:border-purple-400 rounded-xl text-sm font-medium text-gray-300 transition-all"
                >
                  {mins} min
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSnoozeOptions(false)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSnoozeOptions(true)}
            className="text-gray-500 hover:text-purple-400 text-sm transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Snooze instead
          </button>
        )}
      </div>
    </div>
  );
}
