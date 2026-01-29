import { Reminder } from "../lib/tauri";
import { formatDistanceToNow, parseISO, addMinutes } from "date-fns";
import { SOUND_OPTIONS } from "../lib/sounds";

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}

function getNextTriggerTime(reminder: Reminder): string {
  if (!reminder.enabled) return "Disabled";
  
  const lastTriggered = reminder.last_triggered 
    ? parseISO(reminder.last_triggered)
    : parseISO(reminder.created_at);
  
  const nextTrigger = addMinutes(lastTriggered, reminder.interval_minutes);
  const now = new Date();
  
  if (nextTrigger <= now) {
    return "Soon";
  }
  
  return formatDistanceToNow(nextTrigger, { addSuffix: true });
}

function formatInterval(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

function getSoundLabel(sound: string | undefined): string {
  const option = SOUND_OPTIONS.find(o => o.value === sound);
  return option?.label || "Chime";
}

export function ReminderList({ reminders, onEdit, onDelete, onToggle }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg text-purple-200">No reminders yet</p>
        <p className="text-sm mt-2 text-gray-500">Create your first reminder to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className={`p-4 rounded-xl border transition-all ${
            reminder.enabled 
              ? "bg-gradient-to-r from-gray-800/80 to-gray-800/60 border-purple-500/30 shadow-lg shadow-purple-500/5" 
              : "bg-gray-900/50 border-gray-700/50 opacity-60"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className={`font-semibold truncate ${
                  reminder.enabled 
                    ? "text-white" 
                    : "text-gray-400"
                }`}>
                  {reminder.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  reminder.enabled
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-800 text-gray-500 border border-gray-700"
                }`}>
                  {reminder.enabled ? "Active" : "Paused"}
                </span>
              </div>
              
              {reminder.message && (
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {reminder.message}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Every {formatInterval(reminder.interval_minutes)}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {getNextTriggerTime(reminder)}
                </span>
                {reminder.sound && reminder.sound !== "none" && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    {getSoundLabel(reminder.sound)}
                  </span>
                )}
                {reminder.active_start_time && reminder.active_end_time && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {reminder.active_start_time} - {reminder.active_end_time}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(reminder.id, !reminder.enabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  reminder.enabled 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30" 
                    : "bg-gray-700"
                }`}
                title={reminder.enabled ? "Disable" : "Enable"}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${
                    reminder.enabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
              
              <button
                onClick={() => onEdit(reminder)}
                className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => onDelete(reminder.id)}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
