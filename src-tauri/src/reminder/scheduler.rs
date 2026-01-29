use crate::storage::{get_enabled_reminders, update_last_triggered, Reminder};
use chrono::{DateTime, Local, NaiveTime, Utc, Datelike};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use std::collections::HashMap;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::mpsc;
use tokio::time::sleep;

static SCHEDULER_TX: Lazy<Mutex<Option<mpsc::Sender<SchedulerCommand>>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug)]
pub enum SchedulerCommand {
    Refresh,
    Stop,
}

pub async fn start_scheduler(app_handle: AppHandle) {
    let (tx, mut rx) = mpsc::channel::<SchedulerCommand>(32);
    
    {
        let mut scheduler_tx = SCHEDULER_TX.lock();
        *scheduler_tx = Some(tx);
    }
    
    let handle = app_handle.clone();
    let mut next_triggers: HashMap<i64, DateTime<Utc>> = HashMap::new();
    
    loop {
            // Load enabled reminders
            let reminders = match get_enabled_reminders() {
                Ok(r) => r,
                Err(e) => {
                    eprintln!("Failed to load reminders: {}", e);
                    sleep(Duration::from_secs(5)).await;
                    continue;
                }
            };
            
            // Calculate next trigger times
            for reminder in &reminders {
                if !next_triggers.contains_key(&reminder.id) {
                    let next = calculate_next_trigger(reminder);
                    next_triggers.insert(reminder.id, next);
                }
            }
            
            // Remove triggers for deleted/disabled reminders
            let active_ids: Vec<i64> = reminders.iter().map(|r| r.id).collect();
            next_triggers.retain(|id, _| active_ids.contains(id));
            
            // Find the next reminder to trigger
            let now = Utc::now();
            let mut soonest: Option<(i64, DateTime<Utc>, &Reminder)> = None;
            
            for reminder in &reminders {
                if let Some(next_time) = next_triggers.get(&reminder.id) {
                    if is_within_active_window(reminder) {
                        if soonest.is_none() || next_time < &soonest.as_ref().unwrap().1 {
                            soonest = Some((reminder.id, *next_time, reminder));
                        }
                    }
                }
            }
            
            // Calculate sleep duration
            let sleep_duration = if let Some((id, next_time, reminder)) = soonest {
                let duration = next_time.signed_duration_since(now);
                
                if duration.num_milliseconds() <= 0 {
                    // Trigger now!
                    trigger_reminder(&handle, reminder).await;
                    
                    // Update last triggered
                    if let Err(e) = update_last_triggered(id) {
                        eprintln!("Failed to update last_triggered: {}", e);
                    }
                    
                    // Calculate next trigger time
                    let next = calculate_next_trigger(reminder);
                    next_triggers.insert(id, next);
                    
                    Duration::from_millis(100) // Small delay before next check
                } else {
                    // Sleep until next trigger (max 1 minute to allow for refresh)
                    Duration::from_millis(duration.num_milliseconds().min(60000) as u64)
                }
            } else {
                // No reminders, sleep for a bit
                Duration::from_secs(10)
            };
            
            // Sleep with ability to be interrupted by commands
        // Sleep with ability to be interrupted by commands
        tokio::select! {
            _ = sleep(sleep_duration) => {}
            cmd = rx.recv() => {
                match cmd {
                    Some(SchedulerCommand::Refresh) => {
                        // Clear next triggers to recalculate
                        next_triggers.clear();
                    }
                    Some(SchedulerCommand::Stop) | None => {
                        break;
                    }
                }
            }
        }
    }
}

fn calculate_next_trigger(reminder: &Reminder) -> DateTime<Utc> {
    let now = Utc::now();
    
    if let Some(last_triggered) = &reminder.last_triggered {
        if let Ok(last) = DateTime::parse_from_rfc3339(last_triggered) {
            let last_utc = last.with_timezone(&Utc);
            let next = last_utc + chrono::Duration::minutes(reminder.interval_minutes as i64);
            
            if next > now {
                return next;
            }
        }
    }
    
    // If no last trigger or it's in the past, trigger after interval from now
    now + chrono::Duration::minutes(reminder.interval_minutes as i64)
}

fn is_within_active_window(reminder: &Reminder) -> bool {
    let local = Local::now();
    
    // Check day of week
    if let Some(days) = &reminder.active_days {
        let current_day = local.weekday().num_days_from_monday() as u8;
        if !days.contains(&current_day) {
            return false;
        }
    }
    
    // Check time window
    if let (Some(start_str), Some(end_str)) = (&reminder.active_start_time, &reminder.active_end_time) {
        if let (Ok(start), Ok(end)) = (
            NaiveTime::parse_from_str(start_str, "%H:%M"),
            NaiveTime::parse_from_str(end_str, "%H:%M"),
        ) {
            let current_time = local.time();
            
            if start <= end {
                // Normal window (e.g., 09:00 to 18:00)
                if current_time < start || current_time > end {
                    return false;
                }
            } else {
                // Overnight window (e.g., 22:00 to 06:00)
                if current_time < start && current_time > end {
                    return false;
                }
            }
        }
    }
    
    true
}

async fn trigger_reminder(app_handle: &AppHandle, reminder: &Reminder) {
    println!("Triggering reminder: {} (ID: {})", reminder.name, reminder.id);
    
    // Emit event to frontend
    if let Err(e) = app_handle.emit("reminder-triggered", reminder.clone()) {
        eprintln!("Failed to emit reminder event: {}", e);
    }
    
    // Create popup window
    let popup_label = format!("popup-{}", reminder.id);
    
    // Close existing popup if any
    if let Some(window) = app_handle.get_webview_window(&popup_label) {
        let _ = window.close();
    }
    
    // Build popup URL with reminder data
    let url = format!("/#/popup?id={}&name={}&message={}&sound={}", 
        reminder.id,
        urlencoding::encode(&reminder.name),
        urlencoding::encode(reminder.message.as_deref().unwrap_or("")),
        urlencoding::encode(&reminder.sound)
    );
    
    match WebviewWindowBuilder::new(
        app_handle,
        &popup_label,
        WebviewUrl::App(url.into()),
    )
    .title(&format!("Reminder: {}", reminder.name))
    .inner_size(450.0, 500.0)
    .resizable(false)
    .center()
    .always_on_top(true)
    .focused(true)
    .decorations(true)
    .build()
    {
        Ok(window) => {
            // Ensure window is visible and focused
            let _ = window.show();
            let _ = window.set_focus();
        }
        Err(e) => {
            eprintln!("Failed to create popup window: {}", e);
        }
    }
}

pub fn refresh_scheduler() {
    if let Some(tx) = SCHEDULER_TX.lock().as_ref() {
        let _ = tx.try_send(SchedulerCommand::Refresh);
    }
}

pub fn stop_scheduler() {
    if let Some(tx) = SCHEDULER_TX.lock().as_ref() {
        let _ = tx.try_send(SchedulerCommand::Stop);
    }
}
