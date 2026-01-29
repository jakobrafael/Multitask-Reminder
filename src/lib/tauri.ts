import { invoke } from "@tauri-apps/api/core";
import { SoundType } from "./sounds";

export interface Reminder {
  id: number;
  name: string;
  message: string | null;
  interval_minutes: number;
  enabled: boolean;
  active_start_time: string | null;
  active_end_time: string | null;
  active_days: number[] | null;
  sound: SoundType;
  last_triggered: string | null;
  created_at: string;
}

export interface CreateReminderData {
  name: string;
  message: string | null;
  interval_minutes: number;
  enabled: boolean;
  active_start_time: string | null;
  active_end_time: string | null;
  active_days: number[] | null;
  sound: SoundType;
}

export interface UpdateReminderData extends CreateReminderData {
  id: number;
}

export async function getReminders(): Promise<Reminder[]> {
  return invoke("get_reminders");
}

export async function getReminder(id: number): Promise<Reminder | null> {
  return invoke("get_reminder", { id });
}

export async function createReminder(reminder: CreateReminderData): Promise<Reminder> {
  return invoke("create_reminder", { reminder });
}

export async function updateReminder(reminder: UpdateReminderData): Promise<Reminder> {
  return invoke("update_reminder", { reminder });
}

export async function deleteReminder(id: number): Promise<void> {
  return invoke("delete_reminder", { id });
}

export async function toggleReminder(id: number, enabled: boolean): Promise<Reminder> {
  return invoke("toggle_reminder", { id, enabled });
}

export async function dismissReminder(id: number): Promise<void> {
  return invoke("dismiss_reminder", { id });
}

export async function snoozeReminder(id: number, minutes: number): Promise<void> {
  return invoke("snooze_reminder", { id, minutes });
}

export async function closePopup(): Promise<void> {
  return invoke("close_popup");
}
