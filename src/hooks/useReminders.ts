import { useState, useEffect, useCallback } from "react";
import { 
  Reminder, 
  CreateReminderData, 
  UpdateReminderData,
  getReminders as fetchReminders,
  createReminder as apiCreateReminder,
  updateReminder as apiUpdateReminder,
  deleteReminder as apiDeleteReminder,
  toggleReminder as apiToggleReminder,
} from "../lib/tauri";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReminders();
      setReminders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const createReminder = useCallback(async (data: CreateReminderData) => {
    try {
      const newReminder = await apiCreateReminder(data);
      setReminders(prev => [newReminder, ...prev]);
      return newReminder;
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }, []);

  const updateReminder = useCallback(async (data: UpdateReminderData) => {
    try {
      const updated = await apiUpdateReminder(data);
      setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }, []);

  const deleteReminder = useCallback(async (id: number) => {
    try {
      await apiDeleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }, []);

  const toggleReminder = useCallback(async (id: number, enabled: boolean) => {
    try {
      const updated = await apiToggleReminder(id, enabled);
      setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }, []);

  return {
    reminders,
    loading,
    error,
    refresh: loadReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
  };
}
