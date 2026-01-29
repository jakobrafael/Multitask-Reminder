import { useState } from "react";
import { useReminders } from "../hooks/useReminders";
import { ReminderList } from "../components/ReminderList";
import { ReminderForm } from "../components/ReminderForm";
import { Reminder, CreateReminderData, UpdateReminderData } from "../lib/tauri";

export function Settings() {
  const { 
    reminders, 
    loading, 
    error, 
    createReminder, 
    updateReminder, 
    deleteReminder, 
    toggleReminder 
  } = useReminders();
  
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const handleCreate = () => {
    setEditingReminder(null);
    setShowForm(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      await deleteReminder(id);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await toggleReminder(id, enabled);
  };

  const handleSubmit = async (data: CreateReminderData | UpdateReminderData) => {
    if ("id" in data) {
      await updateReminder(data);
    } else {
      await createReminder(data);
    }
    setShowForm(false);
    setEditingReminder(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-2xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MultiTask Reminder
            </h1>
          </div>
          <p className="text-gray-400 mt-1 ml-13">
            Manage your recurring reminders
          </p>
        </header>

        {showForm ? (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-500/20 p-6">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              {editingReminder ? "Edit Reminder" : "Create Reminder"}
            </h2>
            <ReminderForm
              reminder={editingReminder}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-purple-200">
                Your Reminders
              </h2>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Reminder
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading reminders...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                Error: {error}
              </div>
            ) : (
              <ReminderList
                reminders={reminders}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            )}
          </>
        )}

        <footer className="mt-12 text-center text-xs text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
            Win a mini-game to dismiss each reminder!
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
          </p>
        </footer>
      </div>
    </div>
  );
}
