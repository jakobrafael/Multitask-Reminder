mod storage;
mod reminder;

use storage::{CreateReminder, Reminder, UpdateReminder};
use reminder::{refresh_scheduler, start_scheduler};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

// CRUD Commands
#[tauri::command]
fn get_reminders() -> Result<Vec<Reminder>, String> {
    storage::get_all_reminders()
}

#[tauri::command]
fn get_reminder(id: i64) -> Result<Option<Reminder>, String> {
    storage::get_reminder_by_id(id)
}

#[tauri::command]
fn create_reminder(reminder: CreateReminder) -> Result<Reminder, String> {
    let result = storage::create_reminder(reminder)?;
    refresh_scheduler();
    Ok(result)
}

#[tauri::command]
fn update_reminder(reminder: UpdateReminder) -> Result<Reminder, String> {
    let result = storage::update_reminder(reminder)?;
    refresh_scheduler();
    Ok(result)
}

#[tauri::command]
fn delete_reminder(id: i64) -> Result<(), String> {
    storage::delete_reminder(id)?;
    refresh_scheduler();
    Ok(())
}

#[tauri::command]
fn toggle_reminder(id: i64, enabled: bool) -> Result<Reminder, String> {
    let result = storage::toggle_reminder(id, enabled)?;
    refresh_scheduler();
    Ok(result)
}

#[tauri::command]
fn dismiss_reminder(id: i64) -> Result<(), String> {
    storage::update_last_triggered(id)?;
    refresh_scheduler();
    Ok(())
}

#[tauri::command]
fn snooze_reminder(id: i64, _minutes: i32) -> Result<(), String> {
    // For snooze, just update the last_triggered to reset the timer
    // The scheduler will recalculate based on the interval
    storage::update_last_triggered(id)?;
    refresh_scheduler();
    Ok(())
}

#[tauri::command]
fn close_popup(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItemBuilder::new("Show Settings").id("show").build(app)?;
    let pause_item = MenuItemBuilder::new("Pause All").id("pause").build(app)?;
    let quit_item = MenuItemBuilder::new("Quit").id("quit").build(app)?;
    
    let menu = MenuBuilder::new(app)
        .item(&show_item)
        .separator()
        .item(&pause_item)
        .separator()
        .item(&quit_item)
        .build()?;
    
    // Load icon - use the app's default icon
    let icon = app.default_window_icon().cloned();
    
    let mut tray_builder = TrayIconBuilder::new()
        .menu(&menu);
    
    // Set icon if available
    if let Some(icon) = icon {
        tray_builder = tray_builder.icon(icon).icon_as_template(true);
    }
    
    let _tray = tray_builder
        .tooltip("MultiTask Reminder")
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "pause" => {
                    // TODO: Implement pause functionality
                    println!("Pause clicked");
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_reminders,
            get_reminder,
            create_reminder,
            update_reminder,
            delete_reminder,
            toggle_reminder,
            dismiss_reminder,
            snooze_reminder,
            close_popup,
        ])
        .setup(|app| {
            // Setup system tray
            if let Err(e) = setup_tray(app) {
                eprintln!("Failed to setup tray: {}", e);
            }
            
            // Start the reminder scheduler in a background thread with its own tokio runtime
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let rt = tokio::runtime::Builder::new_multi_thread()
                    .enable_all()
                    .build()
                    .expect("Failed to create tokio runtime");
                rt.block_on(async {
                    start_scheduler(handle).await;
                });
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
