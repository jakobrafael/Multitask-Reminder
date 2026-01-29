use chrono::Utc;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use rusqlite::{Connection, Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let conn = init_db().expect("Failed to initialize database");
    Mutex::new(conn)
});

fn get_db_path() -> PathBuf {
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("multitask-reminder");
    
    std::fs::create_dir_all(&data_dir).ok();
    data_dir.join("reminders.db")
}

fn init_db() -> SqliteResult<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(db_path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT,
            interval_minutes INTEGER NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            active_start_time TEXT,
            active_end_time TEXT,
            active_days TEXT,
            sound TEXT DEFAULT 'chime',
            last_triggered TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    
    // Migration: add sound column if it doesn't exist
    let _ = conn.execute("ALTER TABLE reminders ADD COLUMN sound TEXT DEFAULT 'chime'", []);
    
    Ok(conn)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reminder {
    pub id: i64,
    pub name: String,
    pub message: Option<String>,
    pub interval_minutes: i32,
    pub enabled: bool,
    pub active_start_time: Option<String>,
    pub active_end_time: Option<String>,
    pub active_days: Option<Vec<u8>>,
    pub sound: String,
    pub last_triggered: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReminder {
    pub name: String,
    pub message: Option<String>,
    pub interval_minutes: i32,
    pub enabled: bool,
    pub active_start_time: Option<String>,
    pub active_end_time: Option<String>,
    pub active_days: Option<Vec<u8>>,
    pub sound: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateReminder {
    pub id: i64,
    pub name: String,
    pub message: Option<String>,
    pub interval_minutes: i32,
    pub enabled: bool,
    pub active_start_time: Option<String>,
    pub active_end_time: Option<String>,
    pub active_days: Option<Vec<u8>>,
    pub sound: String,
}

pub fn get_all_reminders() -> Result<Vec<Reminder>, String> {
    let conn = DB.lock();
    
    let mut stmt = conn
        .prepare("SELECT id, name, message, interval_minutes, enabled, active_start_time, active_end_time, active_days, sound, last_triggered, created_at FROM reminders ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let reminders = stmt
        .query_map([], |row| {
            let active_days_str: Option<String> = row.get(7)?;
            let active_days: Option<Vec<u8>> = active_days_str
                .and_then(|s| serde_json::from_str(&s).ok());
            
            Ok(Reminder {
                id: row.get(0)?,
                name: row.get(1)?,
                message: row.get(2)?,
                interval_minutes: row.get(3)?,
                enabled: row.get::<_, i32>(4)? != 0,
                active_start_time: row.get(5)?,
                active_end_time: row.get(6)?,
                active_days,
                sound: row.get::<_, Option<String>>(8)?.unwrap_or_else(|| "chime".to_string()),
                last_triggered: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(reminders)
}

pub fn get_enabled_reminders() -> Result<Vec<Reminder>, String> {
    let all = get_all_reminders()?;
    Ok(all.into_iter().filter(|r| r.enabled).collect())
}

pub fn get_reminder_by_id(id: i64) -> Result<Option<Reminder>, String> {
    let conn = DB.lock();
    
    let mut stmt = conn
        .prepare("SELECT id, name, message, interval_minutes, enabled, active_start_time, active_end_time, active_days, sound, last_triggered, created_at FROM reminders WHERE id = ?")
        .map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;
    
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let active_days_str: Option<String> = row.get(7).map_err(|e| e.to_string())?;
        let active_days: Option<Vec<u8>> = active_days_str
            .and_then(|s| serde_json::from_str(&s).ok());
        
        Ok(Some(Reminder {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            message: row.get(2).map_err(|e| e.to_string())?,
            interval_minutes: row.get(3).map_err(|e| e.to_string())?,
            enabled: row.get::<_, i32>(4).map_err(|e| e.to_string())? != 0,
            active_start_time: row.get(5).map_err(|e| e.to_string())?,
            active_end_time: row.get(6).map_err(|e| e.to_string())?,
            active_days,
            sound: row.get::<_, Option<String>>(8).map_err(|e| e.to_string())?.unwrap_or_else(|| "chime".to_string()),
            last_triggered: row.get(9).map_err(|e| e.to_string())?,
            created_at: row.get(10).map_err(|e| e.to_string())?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_reminder(reminder: CreateReminder) -> Result<Reminder, String> {
    let conn = DB.lock();
    let now = Utc::now().to_rfc3339();
    let active_days_json = reminder.active_days.as_ref().map(|d| serde_json::to_string(d).unwrap());
    
    conn.execute(
        "INSERT INTO reminders (name, message, interval_minutes, enabled, active_start_time, active_end_time, active_days, sound, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            reminder.name,
            reminder.message,
            reminder.interval_minutes,
            reminder.enabled as i32,
            reminder.active_start_time,
            reminder.active_end_time,
            active_days_json,
            reminder.sound,
            now
        ],
    ).map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();
    drop(conn);
    
    get_reminder_by_id(id)?.ok_or("Failed to retrieve created reminder".to_string())
}

pub fn update_reminder(reminder: UpdateReminder) -> Result<Reminder, String> {
    let conn = DB.lock();
    let active_days_json = reminder.active_days.as_ref().map(|d| serde_json::to_string(d).unwrap());
    
    conn.execute(
        "UPDATE reminders SET name = ?, message = ?, interval_minutes = ?, enabled = ?, active_start_time = ?, active_end_time = ?, active_days = ?, sound = ? WHERE id = ?",
        params![
            reminder.name,
            reminder.message,
            reminder.interval_minutes,
            reminder.enabled as i32,
            reminder.active_start_time,
            reminder.active_end_time,
            active_days_json,
            reminder.sound,
            reminder.id
        ],
    ).map_err(|e| e.to_string())?;
    
    drop(conn);
    
    get_reminder_by_id(reminder.id)?.ok_or("Failed to retrieve updated reminder".to_string())
}

pub fn delete_reminder(id: i64) -> Result<(), String> {
    let conn = DB.lock();
    conn.execute("DELETE FROM reminders WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_last_triggered(id: i64) -> Result<(), String> {
    let conn = DB.lock();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE reminders SET last_triggered = ? WHERE id = ?",
        params![now, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn toggle_reminder(id: i64, enabled: bool) -> Result<Reminder, String> {
    let conn = DB.lock();
    conn.execute(
        "UPDATE reminders SET enabled = ? WHERE id = ?",
        params![enabled as i32, id],
    ).map_err(|e| e.to_string())?;
    drop(conn);
    
    get_reminder_by_id(id)?.ok_or("Failed to retrieve updated reminder".to_string())
}
