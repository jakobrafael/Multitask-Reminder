import { useState, useEffect } from "react";
import { Reminder, CreateReminderData, UpdateReminderData } from "../lib/tauri";
import { SoundType, SOUND_OPTIONS, previewSound } from "../lib/sounds";

interface ReminderFormProps {
  reminder?: Reminder | null;
  onSubmit: (data: CreateReminderData | UpdateReminderData) => Promise<void>;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const QUICK_INTERVALS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

export function ReminderForm({ reminder, onSubmit, onCancel }: ReminderFormProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [customInterval, setCustomInterval] = useState("");
  const [useCustomInterval, setUseCustomInterval] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [useDaysFilter, setUseDaysFilter] = useState(false);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [sound, setSound] = useState<SoundType>("chime");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reminder) {
      setName(reminder.name);
      setMessage(reminder.message || "");
      setIntervalMinutes(reminder.interval_minutes);
      setEnabled(reminder.enabled);
      setSound((reminder.sound as SoundType) || "chime");
      
      if (!QUICK_INTERVALS.find(q => q.value === reminder.interval_minutes)) {
        setUseCustomInterval(true);
        setCustomInterval(String(reminder.interval_minutes));
      }
      
      if (reminder.active_start_time && reminder.active_end_time) {
        setUseTimeWindow(true);
        setStartTime(reminder.active_start_time);
        setEndTime(reminder.active_end_time);
      }
      
      if (reminder.active_days) {
        setUseDaysFilter(true);
        setActiveDays(reminder.active_days);
      }
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    
    const finalInterval = useCustomInterval 
      ? parseInt(customInterval, 10) || 60
      : intervalMinutes;
    
    if (finalInterval < 1) {
      setError("Interval must be at least 1 minute");
      return;
    }
    
    const data: CreateReminderData | UpdateReminderData = {
      ...(reminder ? { id: reminder.id } : {}),
      name: name.trim(),
      message: message.trim() || null,
      interval_minutes: finalInterval,
      enabled,
      active_start_time: useTimeWindow ? startTime : null,
      active_end_time: useTimeWindow ? endTime : null,
      active_days: useDaysFilter && activeDays.length > 0 ? activeDays : null,
      sound,
    } as CreateReminderData | UpdateReminderData;
    
    try {
      setSubmitting(true);
      await onSubmit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setActiveDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSoundChange = (newSound: SoundType) => {
    setSound(newSound);
    if (newSound !== "none") {
      previewSound(newSound);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Drink Water"
          className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-1">
          Message (optional)
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Time to hydrate!"
          className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">
          Interval
        </label>
        
        {!useCustomInterval ? (
          <div className="grid grid-cols-3 gap-2">
            {QUICK_INTERVALS.map((interval) => (
              <button
                key={interval.value}
                type="button"
                onClick={() => setIntervalMinutes(interval.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  intervalMinutes === interval.value
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/25"
                    : "bg-gray-800/50 border-purple-500/30 text-gray-300 hover:border-purple-400"
                }`}
              >
                {interval.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              min="1"
              placeholder="Minutes"
              className="flex-1 px-3 py-2 border border-purple-500/30 rounded-lg bg-gray-800/50 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="flex items-center text-gray-400">minutes</span>
          </div>
        )}
        
        <button
          type="button"
          onClick={() => {
            setUseCustomInterval(!useCustomInterval);
            if (!useCustomInterval) {
              setCustomInterval(String(intervalMinutes));
            }
          }}
          className="mt-2 text-sm text-purple-400 hover:text-purple-300"
        >
          {useCustomInterval ? "Use preset intervals" : "Set custom interval"}
        </button>
      </div>

      {/* Sound Selection */}
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">
          Notification Sound
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SOUND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSoundChange(option.value)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                sound === option.value
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/25"
                  : "bg-gray-800/50 border-purple-500/30 text-gray-300 hover:border-purple-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Click to preview sound</p>
      </div>
      
      <div className="space-y-4 pt-4 border-t border-purple-500/20">
        <h4 className="text-sm font-medium text-purple-200">
          Advanced Options
        </h4>
        
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useTimeWindow}
              onChange={(e) => setUseTimeWindow(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500/30 bg-gray-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">
              Only remind during specific hours
            </span>
          </label>
          
          {useTimeWindow && (
            <div className="mt-2 flex items-center gap-2 ml-6">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2 py-1 border border-purple-500/30 rounded bg-gray-800/50 text-white text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-2 py-1 border border-purple-500/30 rounded bg-gray-800/50 text-white text-sm"
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useDaysFilter}
              onChange={(e) => setUseDaysFilter(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500/30 bg-gray-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">
              Only remind on specific days
            </span>
          </label>
          
          {useDaysFilter && (
            <div className="mt-2 flex gap-1 ml-6">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-8 rounded text-xs font-medium transition-all ${
                    activeDays.includes(day.value)
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-purple-500/30 bg-gray-800 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-300">
            Enable this reminder
          </span>
        </label>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-purple-500/30 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
        >
          {submitting ? "Saving..." : reminder ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
