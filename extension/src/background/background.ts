const FALLBACK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("CodeBuddy AI Installed");
  
  // Check for API key and prompt setup
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (!result.geminiApiKey) {
      chrome.runtime.openOptionsPage();
    }
  });

  // Set up daily reminder alarm
  chrome.alarms.create("daily-coding-reminder", {
    when: getNextReminderTime(),
    periodInMinutes: 24 * 60 // repeat every 24 hours
  });
});

// Calculate the next timestamp for 18:00 (default)
function getNextReminderTime() {
  const now = new Date();
  const reminder = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  if (now > reminder) {
    reminder.setDate(reminder.getDate() + 1); // move to tomorrow if it already passed today
  }
  return reminder.getTime();
}

// Listen to alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "daily-coding-reminder") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: FALLBACK_ICON,
      title: "Time to Code! 🚀",
      message: "Your daily problem is waiting for you. Let's keep the streak alive!",
      buttons: [
        { title: "Solve Now" },
        { title: "Snooze 10m" }
      ]
    });
  }
});

// Handle notification button clicks (Snooze logic)
chrome.notifications.onButtonClicked.addListener((_notificationId, buttonIndex) => {
  if (buttonIndex === 1) { // Snooze
    chrome.alarms.create("snooze-reminder", {
      delayInMinutes: 10
    });
    console.log("Reminder snoozed for 10 minutes");
  }
});

// --- Focus Mode Tab Locking ---
let activeFocusTabId: number | null = null;
let isFocusModeEnabled = false;

// Sync state on load
chrome.storage.local.get(['focusModeEnabled'], (result) => {
  isFocusModeEnabled = !!result.focusModeEnabled;
  if (isFocusModeEnabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) activeFocusTabId = tabs[0].id;
    });
  }
});

// Listen for focus mode changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.focusModeEnabled) {
    isFocusModeEnabled = !!changes.focusModeEnabled.newValue;
    if (isFocusModeEnabled) {
      // Set the active tab as the focus tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          activeFocusTabId = tabs[0].id;
        }
      });
    } else {
      activeFocusTabId = null;
    }
  }
});

// Prevent tab switching
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isFocusModeEnabled && activeFocusTabId && activeInfo.tabId !== activeFocusTabId) {
    recordViolationAndNotify();
    // Switch back
    chrome.tabs.update(activeFocusTabId, { active: true });
  }
});

// Prevent switching to another window or desktop application
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (isFocusModeEnabled && activeFocusTabId) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // Browser completely lost focus (switched to another app)
      recordViolationAndNotify();
    } else {
      // Switched to another browser window
      chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
        if (tabs[0] && tabs[0].id !== activeFocusTabId) {
          recordViolationAndNotify();
        }
      });
    }
  }
});

function recordViolationAndNotify() {
  chrome.storage.local.get(['focusViolations', 'focusSessionActive'], (res) => {
    if (res.focusSessionActive !== false) {
      const currentViolations = res.focusViolations || 0;
      chrome.storage.local.set({ 
        focusViolations: currentViolations + 1,
        lastViolationTime: Date.now()
      });
    }
  });

  chrome.notifications.create({
    type: "basic",
    iconUrl: FALLBACK_ICON,
    title: "Focus Violation!",
    message: "You left your active problem window. Stay focused!"
  });
}

