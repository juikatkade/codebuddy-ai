import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, ChevronRight, Settings, Eye, EyeOff, Save, Trash2, Key, Clock, GripHorizontal, AlertTriangle, BarChart2, Shield } from 'lucide-react';
import './content.css';

const isExtension = typeof chrome !== 'undefined' && chrome.storage !== undefined;

const TONE_POOLS: Record<string, string[]> = {
  friendly: [
    "Welcome back! Let's get back to coding.",
    "Your problem is waiting for you.",
    "Distractions happen, but you've got this!",
    "Stay focused, you're doing great.",
    "Take a deep breath and let's solve this."
  ],
  sarcastic: [
    "That's it? Even a goldfish stayed focused longer.",
    "Your LeetCode problem misses you already.",
    "Runtime Error: Attention Span Exceeded.",
    "The problem wasn't going to solve itself.",
    "Focus Mode means focusing. Revolutionary concept.",
    "You escaped after 43 seconds. Impressive.",
    "Your code is still waiting for you.",
    "LeetCode called. It wants its programmer back.",
    "Achievement Unlocked: Tab Switching Specialist.",
    "The interviewer noticed that tab switch.",
    "Accepted? Not yet. Distracted? Definitely.",
    "You left before the warm-up ended.",
    "Focus combo broken.",
    "Your concentration has disconnected from the server.",
    "The bug is still there. Nice try."
  ],
  brutal: [
    "Did you just give up? Pathetic.",
    "Focus harder. That was weak.",
    "You call that an attempt?",
    "If you code like you focus, no wonder you have bugs.",
    "Back to work. Stop wasting time."
  ]
};

export default function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Draggable position state
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 450 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Timer states
  const [sessionTime, setSessionTime] = useState(0);
  const [dailyTime, setDailyTime] = useState(0);
  const [weeklyTime, setWeeklyTime] = useState(0);

  // Focus Laps
  const [laps, setLaps] = useState<Record<string, { time: number, title: string }>>({});
  const [currentProblemSlug, setCurrentProblemSlug] = useState<string | null>(null);
  const [currentProblemTitle, setCurrentProblemTitle] = useState<string | null>(null);

  const currentProblemSlugRef = useRef<string | null>(null);
  const currentProblemTitleRef = useRef<string | null>(null);
  
  useEffect(() => {
    currentProblemSlugRef.current = currentProblemSlug;
    currentProblemTitleRef.current = currentProblemTitle;
  }, [currentProblemSlug, currentProblemTitle]);

  // Focus Mode state
  const [focusMode, setFocusMode] = useState(false);
  const focusModeRef = useRef(false);

  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);
  const [examMode, setExamMode] = useState(false);
  const [violationLimit, setViolationLimit] = useState<number | 'unlimited'>(3);
  const [focusViolations, setFocusViolations] = useState(0);
  const [showViolationOverlay, setShowViolationOverlay] = useState(false);
  const [showReportOverlay, setShowReportOverlay] = useState(false);
  const [focusGuardTone, setFocusGuardTone] = useState<string>('sarcastic');
  const [violationMessage, setViolationMessage] = useState<string>('');
  
  const focusSessionStartTime = useRef<number | null>(null);
  const focusStreakStart = useRef<number | null>(null);
  const [longestStreak, setLongestStreak] = useState(0);

  // Gemini API states
  const [localApiKey, setLocalApiKey] = useState('');
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [settingsShowKey, setSettingsShowKey] = useState(false);
  const [settingsValidationStatus, setSettingsValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'error' | 'deleted'>('idle');

  // Track URL to reset on navigation
  const [currentUrl, setCurrentUrl] = useState(window.location.href);

  // Inactivity tracking
  const lastActivityTime = useRef(Date.now());
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Helper to calculate week string
  const getWeekString = (date: Date): string => {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  };

  // 1. Initial configuration load on mount
  useEffect(() => {
    const loadConfig = () => {
      const initUrl = window.location.href;
      setCurrentUrl(initUrl);

      if (isExtension) {
        chrome.storage.local.get([
          'geminiApiKey',
          'email',
          'telegramUsername',
          'focusModeEnabled',
          'examModeEnabled',
          'violationLimit',
          'focusViolations',
          'focusGuardTone',
          'dailyTime',
          'weeklyTime',
          'sessionTime',
          'focusLaps',
          'lastDate',
          'lastWeek',
          'cachedUrl',
          'cachedHints',
          'cachedLevel'
        ], (result) => {
          if (result.geminiApiKey) {
            setLocalApiKey(result.geminiApiKey);
            setSettingsApiKey(result.geminiApiKey);
          }
          if (result.email) setEmail(result.email);
          if (result.telegramUsername) setTelegramUsername(result.telegramUsername);
          setFocusMode(!!result.focusModeEnabled);
          setDailyTime(result.dailyTime || 0);
          setWeeklyTime(result.weeklyTime || 0);
          if (result.sessionTime !== undefined) setSessionTime(result.sessionTime);
          if (result.focusLaps !== undefined) setLaps(result.focusLaps);

          if (result.examModeEnabled !== undefined) setExamMode(!!result.examModeEnabled);
          if (result.violationLimit !== undefined) setViolationLimit(result.violationLimit);
          if (result.focusViolations !== undefined) setFocusViolations(result.focusViolations);
          if (result.focusGuardTone !== undefined) setFocusGuardTone(result.focusGuardTone);

          // Load cached hints if matching current URL
          if (result.cachedUrl === initUrl && result.cachedHints) {
            setHints(result.cachedHints);
            setHintLevel(result.cachedLevel || 0);
          }
        });
      } else {
        const savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
          setLocalApiKey(savedKey);
          setSettingsApiKey(savedKey);
        }
        const savedEmail = localStorage.getItem('email');
        if (savedEmail) setEmail(savedEmail);
        const savedTelegram = localStorage.getItem('telegramUsername');
        if (savedTelegram) setTelegramUsername(savedTelegram);
        
        setFocusMode(localStorage.getItem('focusModeEnabled') === 'true');
        setDailyTime(Number(localStorage.getItem('dailyTime')) || 0);
        setWeeklyTime(Number(localStorage.getItem('weeklyTime')) || 0);
        setSessionTime(Number(localStorage.getItem('sessionTime')) || 0);
        const savedLaps = localStorage.getItem('focusLaps');
        if (savedLaps) setLaps(JSON.parse(savedLaps));

        const savedTone = localStorage.getItem('focusGuardTone');
        if (savedTone) setFocusGuardTone(savedTone);

        const cachedUrl = localStorage.getItem('cachedUrl');
        const cachedHints = localStorage.getItem('cachedHints');
        if (cachedUrl === initUrl && cachedHints) {
          setHints(JSON.parse(cachedHints));
          setHintLevel(Number(localStorage.getItem('cachedLevel')) || 0);
        }
      }
    };

    loadConfig();
  }, []);

  // Sync settings/focus mode with Storage changes (e.g. from popup)
  useEffect(() => {
    if (isExtension) {
      const handleStorageChange = (changes: any, namespace: string) => {
        if (namespace === 'local') {
          if (changes.geminiApiKey) {
            setLocalApiKey(changes.geminiApiKey.newValue || '');
            setSettingsApiKey(changes.geminiApiKey.newValue || '');
          }
          if (changes.email) setEmail(changes.email.newValue || '');
          if (changes.telegramUsername) setTelegramUsername(changes.telegramUsername.newValue || '');
          if (changes.focusModeEnabled) {
            setFocusMode(!!changes.focusModeEnabled.newValue);
          }
          if (changes.examModeEnabled) setExamMode(!!changes.examModeEnabled.newValue);
          if (changes.violationLimit) setViolationLimit(changes.violationLimit.newValue);
          if (changes.focusGuardTone) setFocusGuardTone(changes.focusGuardTone.newValue);
          if (changes.focusViolations) {
            const newViolations = changes.focusViolations.newValue;
            if (newViolations > focusViolations && focusMode && !showReportOverlay) {
              setFocusViolations(newViolations);
              handleViolationInternal(newViolations);
            } else {
              setFocusViolations(newViolations);
            }
          }
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, [focusMode, focusViolations, showReportOverlay, violationLimit, focusGuardTone]);

  const handleViolationInternal = (newCount: number) => {
    if (showViolationOverlay || showReportOverlay) return;
    
    // Pick a random message
    let activeTone = focusGuardTone;
    if (activeTone === 'random') {
      const tones = ['friendly', 'sarcastic', 'brutal'];
      activeTone = tones[Math.floor(Math.random() * tones.length)];
    }
    const pool = TONE_POOLS[activeTone] || TONE_POOLS['sarcastic'];
    const msg = pool[Math.floor(Math.random() * pool.length)];
    setViolationMessage(msg);

    setShowViolationOverlay(true);
    
    // Use setTimeout to allow the React overlay to render first, then show system alert
    setTimeout(() => {
      window.alert(`🚫 FOCUS VIOLATION DETECTED!\n\n${msg}\n\nReturn to your code immediately to avoid further penalties.`);
    }, 50);

    if (focusStreakStart.current) {
      const currentStreak = Date.now() - focusStreakStart.current;
      setLongestStreak(prev => Math.max(prev, currentStreak));
    }
    focusStreakStart.current = Date.now();

    if (violationLimit !== 'unlimited' && newCount >= violationLimit) {
      endFocusSession();
    }
  };

  // Blur and Visibility Detection for Violations
  useEffect(() => {
    if (!focusMode || showViolationOverlay || showReportOverlay) return;

    const onBlurOrHide = () => {
      if (document.hidden || !document.hasFocus()) {
        const newViolations = focusViolations + 1;
        setFocusViolations(newViolations);
        if (isExtension) {
          chrome.storage.local.set({ focusViolations: newViolations });
        }
        handleViolationInternal(newViolations);
      }
    };

    document.addEventListener('visibilitychange', onBlurOrHide);
    window.addEventListener('blur', onBlurOrHide);

    return () => {
      document.removeEventListener('visibilitychange', onBlurOrHide);
      window.removeEventListener('blur', onBlurOrHide);
    };
  }, [focusMode, focusViolations, violationLimit, showViolationOverlay, showReportOverlay]);

  // 2. Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { x: position.x, y: position.y };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      const newX = Math.max(10, Math.min(window.innerWidth - 360, posStart.current.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - (isOpen ? 450 : 100), posStart.current.y + dy));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isOpen]);

  // Adjust position when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - 360;
        const maxY = window.innerHeight - (isOpen ? 450 : 100);
        return {
          x: Math.max(10, Math.min(maxX, prev.x)),
          y: Math.max(10, Math.min(maxY, prev.y))
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Readjust position upwards when expanding to avoid going off bottom
  useEffect(() => {
    if (isOpen) {
      setPosition(prev => {
        const maxY = window.innerHeight - 450;
        return { x: prev.x, y: Math.max(10, Math.min(maxY, prev.y)) };
      });
    }
  }, [isOpen]);

  // 3. Session Timer Tick & Inactivity Listeners
  useEffect(() => {
    const handleActivity = () => {
      lastActivityTime.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const timer = setInterval(() => {
      const now = Date.now();
      const isUserActive = (now - lastActivityTime.current) < INACTIVITY_TIMEOUT;
      const isTabVisible = !document.hidden;

      const slug = currentProblemSlugRef.current;
      const title = currentProblemTitleRef.current;
      const isFocusMode = focusModeRef.current;

      if (isUserActive && isTabVisible && slug) {
        // Daily and Weekly times should ALWAYS tick up when on Leetcode
        // Update daily and weekly times
        const dateNow = new Date();
        const todayStr = dateNow.toISOString().split('T')[0];
        const weekStr = getWeekString(dateNow);

        setDailyTime(prevDaily => {
          const newDaily = prevDaily + 1;
          setWeeklyTime(prevWeekly => {
            const newWeekly = prevWeekly + 1;

            // Session Time and Laps should ONLY tick up if Focus Mode is ON
            if (isFocusMode) {
              setSessionTime(prevSession => {
                const newSessionTime = prevSession + 1;
                
                setLaps(prevLaps => {
                  const newLaps = { ...prevLaps };
                  const existingTime = newLaps[slug]?.time || 0;
                  newLaps[slug] = {
                    time: existingTime + 1,
                    title: title || slug
                  };
                  
                  // Persist laps immediately
                  if (isExtension) {
                    chrome.storage.local.set({ focusLaps: newLaps });
                  } else {
                    localStorage.setItem('focusLaps', JSON.stringify(newLaps));
                  }
                  
                  return newLaps;
                });

                // Persist all to storage
                if (isExtension) {
                  chrome.storage.local.get(['lastDate', 'lastWeek'], (res) => {
                    let d = newDaily;
                    let w = newWeekly;

                    if (res.lastDate !== todayStr) d = 1;
                    if (res.lastWeek !== weekStr) w = 1;

                    chrome.storage.local.set({
                      dailyTime: d,
                      weeklyTime: w,
                      sessionTime: newSessionTime,
                      lastDate: todayStr,
                      lastWeek: weekStr
                    });
                  });
                } else {
                  let d = newDaily;
                  let w = newWeekly;
                  if (localStorage.getItem('lastDate') !== todayStr) d = 1;
                  if (localStorage.getItem('lastWeek') !== weekStr) w = 1;

                  localStorage.setItem('dailyTime', String(d));
                  localStorage.setItem('weeklyTime', String(w));
                  localStorage.setItem('sessionTime', String(newSessionTime));
                  localStorage.setItem('lastDate', todayStr);
                  localStorage.setItem('lastWeek', weekStr);
                }

                return newSessionTime;
              });
            } else {
              // Focus Mode is OFF. Just persist daily/weekly time.
              if (isExtension) {
                chrome.storage.local.get(['lastDate', 'lastWeek'], (res) => {
                  let d = newDaily;
                  let w = newWeekly;

                  if (res.lastDate !== todayStr) d = 1;
                  if (res.lastWeek !== weekStr) w = 1;

                  chrome.storage.local.set({
                    dailyTime: d,
                    weeklyTime: w,
                    lastDate: todayStr,
                    lastWeek: weekStr
                  });
                });
              } else {
                let d = newDaily;
                let w = newWeekly;
                if (localStorage.getItem('lastDate') !== todayStr) d = 1;
                if (localStorage.getItem('lastWeek') !== weekStr) w = 1;

                localStorage.setItem('dailyTime', String(d));
                localStorage.setItem('weeklyTime', String(w));
                localStorage.setItem('lastDate', todayStr);
                localStorage.setItem('lastWeek', weekStr);
              }
            }

            return newWeekly;
          });
          return newDaily;
        });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // 4. Focus Mode Observer & Styles
  useEffect(() => {
    if (!focusMode) {
      restoreDynamicFocusElements();
      return;
    }

    // Apply Focus Mode initially
    hideDynamicFocusElements();

    // Monitor DOM changes in LeetCode dynamically (for late loaded divs, tabs, acceptance rate etc.)
    const observer = new MutationObserver(() => {
      hideDynamicFocusElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      restoreDynamicFocusElements();
    };
  }, [focusMode]);

  const hideDynamicFocusElements = () => {
    let styleEl = document.getElementById('codebuddy-focus-mode-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'codebuddy-focus-mode-style';
      styleEl.innerHTML = `
        /* Hide tabs on Leetcode modern UI */
        div[data-key="editorial"],
        div[data-key="solutions"],
        div[data-key="discussion"],
        a[href*="/editorial"],
        a[href*="/solutions"],
        a[href*="/discuss"],
        button[id*="editorial"],
        button[id*="solution"],
        button[id*="discuss"],
        div[class*="TabHeader"] div:nth-child(2),
        div[class*="TabHeader"] div:nth-child(3),
        div[class*="TabHeader"] div:nth-child(5) {
          display: none !important;
        }
        /* Hide comment sections */
        div[class*="comment-list"],
        div[class*="comment-wrapper"],
        div[class*="comments-container"],
        div[id*="comments"],
        div[class*="comment_"],
        .comment-list-wrapper,
        div.comment-list-wrapper {
          display: none !important;
        }
        /* Broadly hide global navigation headers and footers */
        nav, header, footer, 
        [id*="navbar"], [class*="navbar"], 
        [id*="header"], [class*="header"]:not([class*="TabHeader"]), 
        [id*="footer"], [class*="footer"] {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Hide Acceptance Statistics
    const divs = document.querySelectorAll('div');
    divs.forEach(div => {
      if (div.textContent && (div.textContent.trim().startsWith('Acceptance') || div.textContent.trim().startsWith('Submissions')) && div.classList.contains('text-sm')) {
        const parent = div.parentElement;
        if (parent && parent.classList.contains('flex') && parent.style.display !== 'none') {
          parent.style.setProperty('display', 'none', 'important');
          parent.setAttribute('data-codebuddy-hidden', 'stats');
        }
      }
    });

    // Hide Related recommendations (Related Questions)
    const spans = document.querySelectorAll('span');
    spans.forEach(span => {
      const text = span.textContent?.trim();
      if (text === 'Related Questions' || text === 'Recommended Articles') {
        let parent = span.parentElement;
        for (let i = 0; i < 5; i++) {
          if (parent) {
            if (parent.tagName === 'DIV' && parent.parentElement && parent.parentElement.classList.contains('flex-col')) {
              if (parent.style.display !== 'none') {
                parent.style.setProperty('display', 'none', 'important');
                parent.setAttribute('data-codebuddy-hidden', 'recommendations');
              }
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
    });
  };

  const restoreDynamicFocusElements = () => {
    const styleEl = document.getElementById('codebuddy-focus-mode-style');
    if (styleEl) {
      styleEl.remove();
    }

    const hiddenElements = document.querySelectorAll('[data-codebuddy-hidden]');
    hiddenElements.forEach(el => {
      (el as HTMLElement).style.removeProperty('display');
      el.removeAttribute('data-codebuddy-hidden');
    });
  };

  const endFocusSession = () => {
    if (focusStreakStart.current) {
      const currentStreak = Date.now() - focusStreakStart.current;
      setLongestStreak(prev => Math.max(prev, currentStreak));
    }

    setFocusMode(false);
    setShowViolationOverlay(false);
    setShowReportOverlay(true);

    if (isExtension) {
      chrome.storage.local.set({ focusModeEnabled: false, focusSessionActive: false });
    } else {
      localStorage.setItem('focusModeEnabled', 'false');
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.warn("Could not exit fullscreen:", err);
      });
    }
  };

  const toggleFocusMode = () => {
    if (focusMode) {
      endFocusSession();
    } else {
      // Start Focus Mode
      setFocusViolations(0);
      setLongestStreak(0);
      setSessionTime(0);
      setLaps({});
      focusSessionStartTime.current = Date.now();
      focusStreakStart.current = Date.now();
      
      setFocusMode(true);
      if (isExtension) {
        chrome.storage.local.set({ 
          focusModeEnabled: true, 
          focusSessionActive: true, 
          focusViolations: 0,
          sessionTime: 0,
          focusLaps: {}
        });
      } else {
        localStorage.setItem('focusModeEnabled', 'true');
        localStorage.setItem('sessionTime', '0');
        localStorage.setItem('focusLaps', '{}');
      }

      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Could not request fullscreen:", err);
      });
    }
  };

  // 5. URL change monitor (SPA routing reset)
  useEffect(() => {
    const urlMonitor = setInterval(() => {
      const nowUrl = window.location.href;
      if (nowUrl !== currentUrl) {
        setCurrentUrl(nowUrl);
        setHints([]);
        setHintLevel(0);
        setErrorMsg('');
        
        // Remove caches for old problem
        if (isExtension) {
          chrome.storage.local.remove(['cachedUrl', 'cachedHints', 'cachedLevel']);
        } else {
          localStorage.removeItem('cachedUrl');
          localStorage.removeItem('cachedHints');
          localStorage.removeItem('cachedLevel');
        }
      }

      // Track active problem
      try {
        const match = window.location.pathname.match(/\/problems\/([^/]+)/);
        if (match) {
          const slug = match[1];
          setCurrentProblemSlug(slug);
          let title = '';
          const titleEl = document.querySelector('div.text-title-large') || 
                          document.querySelector('div[class*="text-title-large"]') ||
                          document.querySelector('div[data-cy="question-title"]') ||
                          document.querySelector('.css-v3d350');
          if (titleEl) {
            title = titleEl.textContent?.trim() || slug;
          } else {
            title = document.title.split('-')[0].trim() || slug;
          }
          setCurrentProblemTitle(title);
        } else {
          setCurrentProblemSlug(null);
          setCurrentProblemTitle(null);
        }
      } catch (e) {}
    }, 1000);

    return () => clearInterval(urlMonitor);
  }, [currentUrl]);

  // 6. Extraction & Gemini Hints Generation
  const extractProblemDetails = () => {
    let title = '';
    const titleEl = document.querySelector('div.text-title-large') || 
                    document.querySelector('div[class*="text-title-large"]') ||
                    document.querySelector('div[data-cy="question-title"]') ||
                    document.querySelector('h4');
    if (titleEl) {
      title = titleEl.textContent?.trim() || '';
    }

    const descEl = document.querySelector('[data-track-load="description_content"]') ||
                   document.querySelector('div.question-content__JfgR') ||
                   document.querySelector('div[class*="question-content"]') ||
                   document.querySelector('div[class*="description__"]');
                   
    let description = '';
    if (descEl) {
      description = descEl.textContent || '';
    }

    if (!description) {
      const mainEl = document.querySelector('div#qd-content');
      description = mainEl ? (mainEl.textContent || '') : (document.body.textContent || '');
    }

    return {
      title: title || document.title.replace(' - LeetCode', ''),
      description: description.substring(0, 10000)
    };
  };

  const getHints = async () => {
    if (!localApiKey) {
      setErrorMsg("Please configure your Gemini API Key first.");
      setShowSettings(true);
      return;
    }

    setLoadingHints(true);
    setErrorMsg('');

    try {
      const { title, description } = extractProblemDetails();
      
      const prompt = `
You are Code Buddy, an elite coding interview coach.
Your job is to guide the user through the LeetCode problem "${title}".

Here is the problem content:
${description}

Generate a progressive set of exactly 5 hint levels for this problem.
Follow these constraints strictly for each level:
- Level 1 (Tiny observation): Only a very small observation about constraints, edge cases, or mathematical properties. Do not suggest any algorithms.
- Level 2 (Approach guidance): General strategy or technique to think about (e.g. "Can we build the answer incrementally?", "What happens if we process elements from right to left?").
- Level 3 (Algorithm/Data Structure suggestion): Name specific algorithms, data structures, or patterns (e.g. "We can use a hash map to...", "This maps to the sliding window pattern...").
- Level 4 (High-level pseudocode): Clear, language-agnostic steps or logic structure. Do not write copy-pasteable code, just structured logical flow.
- Level 5 (Complete explanation): Detailed breakdown of the optimal solution, explaining how the code should work, the time/space complexity, and why it is optimal.

Return the response ONLY as a JSON object with the keys "level1", "level2", "level3", "level4", and "level5". Do not include any markdown formatting, backticks, or extra text.
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${localApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before requesting more hints. (Gemini API 429)");
        }
        if (response.status === 503) {
          throw new Error("Gemini service is temporarily unavailable. Please try again later. (Gemini API 503)");
        }
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response from Gemini.");
      }

      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanText);
      if (!parsed.level1 || !parsed.level2 || !parsed.level3 || !parsed.level4 || !parsed.level5) {
        throw new Error("Could not parse all 5 progressive levels.");
      }

      const hintList = [
        parsed.level1,
        parsed.level2,
        parsed.level3,
        parsed.level4,
        parsed.level5
      ];

      setHints(hintList);
      setHintLevel(0);

      // Save to cache
      if (isExtension) {
        chrome.storage.local.set({
          cachedUrl: window.location.href,
          cachedHints: hintList,
          cachedLevel: 0
        });
      } else {
        localStorage.setItem('cachedUrl', window.location.href);
        localStorage.setItem('cachedHints', JSON.stringify(hintList));
        localStorage.setItem('cachedLevel', '0');
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate hints. Please try again.");
    } finally {
      setLoadingHints(false);
    }
  };

  const handleNextHint = () => {
    if (hintLevel < hints.length - 1) {
      const nextLvl = hintLevel + 1;
      setHintLevel(nextLvl);
      
      // Save Level
      if (isExtension) {
        chrome.storage.local.set({ cachedLevel: nextLvl });
      } else {
        localStorage.setItem('cachedLevel', String(nextLvl));
      }
    }
  };

  // 7. API key settings handlers inside widget
  const validateAndSaveKey = async () => {
    if (!settingsApiKey.trim()) {
      setSettingsValidationStatus('invalid');
      return;
    }

    setSettingsValidationStatus('validating');

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settingsApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Success Check"
            }]
          }]
        })
      });

      if (response.ok) {
        try {
          await fetch('http://localhost:3000/api/settings/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, telegramUsername })
          });
        } catch (e) {
          console.warn('Could not save notifications to backend', e);
        }

        setLocalApiKey(settingsApiKey);
        setSettingsValidationStatus('valid');
        if (isExtension) {
          chrome.storage.local.set({ geminiApiKey: settingsApiKey, email, telegramUsername });
        } else {
          localStorage.setItem('geminiApiKey', settingsApiKey);
          localStorage.setItem('email', email);
          localStorage.setItem('telegramUsername', telegramUsername);
        }
      } else {
        setSettingsValidationStatus('invalid');
      }
    } catch (err) {
      console.error(err);
      setSettingsValidationStatus('error');
    }
  };

  const deleteKey = () => {
    setLocalApiKey('');
    setSettingsApiKey('');
    setSettingsValidationStatus('deleted');
    if (isExtension) {
      chrome.storage.local.remove('geminiApiKey');
    } else {
      localStorage.removeItem('geminiApiKey');
    }
  };

  // Progressive level helper text
  const levelLabels = [
    "Level 1: Observation",
    "Level 2: Approach",
    "Level 3: Algorithm/DS",
    "Level 4: Pseudocode",
    "Level 5: Explanation"
  ];

  const isHintDelayed = examMode && focusMode && sessionTime < 1200;
  const hintDelayRemaining = Math.max(0, 1200 - sessionTime);

  const currentLapTime = currentProblemSlug ? laps[currentProblemSlug]?.time || 0 : 0;

  return (
    <>
      {showViolationOverlay && createPortal(
        <div 
          className="flex flex-col items-center justify-center bg-dark-950/80 font-sans"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999999, margin: 0, padding: 0 }}
        >
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-10 max-w-[500px] flex flex-col items-center shadow-xl">
            <AlertTriangle size={64} className="text-red-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-200 mb-3 tracking-tight">Focus Violation Detected</h1>
            <p className="text-xl text-red-400 mb-10 text-center font-medium italic">
              "{violationMessage}"
            </p>
            
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => {
                  setShowViolationOverlay(false);
                  focusStreakStart.current = Date.now();
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-dark-900 rounded-md font-bold text-lg transition-colors"
              >
                Resume Focus
              </button>
              <button
                onClick={() => endFocusSession()}
                className="flex-1 py-3 bg-dark-800 border border-dark-700 hover:bg-dark-700 text-gray-300 rounded-md font-bold text-lg transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>,
        document.documentElement
      )}

      {showReportOverlay && createPortal(
        <div 
          className="flex flex-col items-center justify-center bg-dark-950/80 font-sans"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999999, margin: 0, padding: 0 }}
        >
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-8 min-w-[500px] shadow-xl">
            <div className="flex flex-col items-center mb-8">
              <BarChart2 size={48} className="text-primary-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-200">Focus Session Report</h1>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg bg-dark-800 p-3 rounded-md border border-dark-700">
                <span className="text-gray-300 font-medium">Total Session Time</span>
                <span className="font-mono font-bold text-primary-400 text-xl">
                  {formatTime(sessionTime)}
                </span>
              </div>

              {Object.keys(laps).length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  <span className="text-gray-400 font-medium mb-1 text-xs uppercase tracking-wider">Questions Visited</span>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2">
                    {Object.entries(laps).map(([slug, data], idx) => (
                      <div key={slug} className="flex justify-between items-center bg-dark-800/60 p-2.5 rounded-md border border-dark-700">
                        <span className="text-gray-300 font-medium flex items-center gap-2 truncate pr-4 text-sm">
                          <span className="text-dark-400 font-bold">{idx + 1}.</span> 
                          <span className="truncate">{data.title}</span>
                        </span>
                        <span className="font-mono text-primary-400/90 text-sm">{formatTime(data.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-lg bg-dark-800 p-3 rounded-md border border-dark-700 mt-4">
                <span className="text-gray-300 font-medium">Violations</span>
                <span className="font-bold text-red-400 text-xl">{focusViolations}</span>
              </div>
              <div className="flex justify-between items-center text-lg bg-dark-800 p-3 rounded-md border border-dark-700">
                <span className="text-gray-300 font-medium">Longest Streak</span>
                <span className="font-mono font-bold text-green-500 text-xl">
                  {formatTime(Math.floor(longestStreak / 1000))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xl bg-dark-800 p-4 rounded-md border border-primary-900 mt-6">
                <span className="text-gray-200 font-bold">Productivity Score</span>
                <span className="font-bold text-3xl text-primary-500">
                  {Math.max(0, 100 - (focusViolations * 15))}%
                </span>
              </div>
            </div>

            <button 
              onClick={() => setShowReportOverlay(false)}
              className="mt-8 w-full py-3 bg-primary-600 hover:bg-primary-500 text-dark-900 rounded-md font-bold text-lg transition-colors"
            >
              Close Report
            </button>
          </div>
        </div>,
        document.documentElement
      )}

      <div 
        className="font-sans text-gray-200 select-none"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          bottom: 'auto',
          right: 'auto',
          zIndex: 999999
        }}
      >
        {!isOpen ? (
          /* Collapsed Pill UI */
          <button
            onClick={() => setIsOpen(true)}
            onMouseDown={handleMouseDown}
            className="flex items-center gap-2 bg-dark-800 hover:bg-dark-750 text-gray-200 px-3 py-2 rounded-md shadow-md transition-colors border border-dark-700 cursor-grab active:cursor-grabbing"
          >
            <Sparkles className="text-primary-500" size={16} />
            <span className="font-semibold text-xs tracking-wider">Code Buddy</span>
            <div className="flex items-center gap-1">
              {currentProblemSlug && (
                <span className="bg-primary-900/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border border-primary-500/20 text-primary-300" title="Current Problem Time">
                  {formatTime(currentLapTime)}
                </span>
              )}
              <span className="bg-dark-950/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border border-white/5" title="Total Session Time">
                {formatTime(sessionTime)}
              </span>
            </div>
          </button>
        ) : (
          /* Expanded Panel UI */
          <div className="w-[340px] bg-dark-900 border border-dark-700 rounded-md shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

          {/* Header Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            className="bg-dark-850 px-3 py-2 border-b border-dark-750 flex justify-between items-center cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="text-gray-600 hover:text-gray-400" size={16} />
              <Sparkles className="text-primary-500" size={16} />
              <h2 className="font-bold text-sm tracking-wide text-gray-100">Code Buddy</h2>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setErrorMsg('');
                }} 
                title="Settings"
                className={`p-1 rounded-sm hover:bg-dark-750 transition-colors ${showSettings ? 'text-primary-500 bg-dark-750' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Settings size={14} />
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowSettings(false);
                }} 
                className="p-1 text-gray-400 hover:text-gray-200 hover:bg-dark-750 rounded-sm transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {showSettings ? (
            /* Settings View inside Widget */
            <div className="p-4 flex flex-col gap-3 min-h-[220px]">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-primary-500" />
                <span className="text-xs font-bold text-gray-300">Gemini API Configuration</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Enter your Gemini API key below. Validation is performed before saving.
              </p>

              <div className="flex justify-between border-t border-dark-800/50 pt-2 text-[10px] text-gray-500 font-medium">
                <div>Daily: <span className="font-mono text-gray-400">{formatTime(dailyTime)}</span></div>
                <div>Weekly: <span className="font-mono text-gray-400">{formatTime(weeklyTime)}</span></div>
              </div>

              <div className="relative mt-1">
                <input
                  type={settingsShowKey ? 'text' : 'password'}
                  value={settingsApiKey}
                  onChange={(e) => {
                    setSettingsApiKey(e.target.value);
                    setSettingsValidationStatus('idle');
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-dark-900 border border-dark-800 rounded-lg px-2.5 py-1.5 pr-8 text-xs text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setSettingsShowKey(!settingsShowKey)}
                  className="absolute right-2.5 top-2 text-gray-500 hover:text-white transition-colors"
                >
                  {settingsShowKey ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>

              <div className="relative mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for Contest Reminders"
                  className="w-full bg-dark-900 border border-dark-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="relative mt-1 flex gap-2">
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="Telegram Username (e.g. johndoe)"
                  className="flex-1 bg-dark-900 border border-dark-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <a
                  href="https://t.me/CodeBuddyBot?start=connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-[#24A1DE] hover:bg-[#1d8ec4] text-white px-2 rounded-lg text-[10px] font-semibold transition-colors"
                >
                  Connect Telegram
                </a>
              </div>

              {/* Status Indicator */}
              <div className="text-[10px] font-medium h-4">
                {settingsValidationStatus === 'validating' && (
                  <span className="text-yellow-500">Validating API Key...</span>
                )}
                {settingsValidationStatus === 'valid' && (
                  <span className="text-primary-500">✓ API Key is valid and saved!</span>
                )}
                {settingsValidationStatus === 'invalid' && (
                  <span className="text-red-500">✗ Invalid API Key. Please verify.</span>
                )}
                {settingsValidationStatus === 'error' && (
                  <span className="text-red-400">✗ Connection error. Cannot validate.</span>
                )}
                {settingsValidationStatus === 'deleted' && (
                  <span className="text-gray-400">API Key deleted.</span>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={validateAndSaveKey}
                  disabled={settingsValidationStatus === 'validating'}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-400 disabled:bg-dark-700 disabled:text-gray-500 text-dark-900 py-1.5 rounded-md text-xs font-bold transition-colors"
                >
                  <Save size={12} />
                  Save
                </button>
                {localApiKey && (
                  <button
                    onClick={deleteKey}
                    title="Delete Key"
                    className="flex items-center justify-center bg-red-950 border border-red-900/50 hover:bg-red-900 text-red-200 px-2 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-dark-800 hover:bg-dark-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            /* Main Content View */
            <div className="flex flex-col flex-1">
              
              {/* Session timer / Focus mode header row */}
              <div className="p-3 bg-dark-850 border-b border-dark-800 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-gray-400" title="Total Session Time">
                    <Clock size={12} />
                    <span className="font-mono font-bold text-gray-200">{formatTime(sessionTime)}</span>
                  </div>
                  {currentProblemSlug && (
                    <div className="flex items-center gap-1.5 text-primary-500" title="Current Problem Time">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      <span className="font-mono font-bold text-primary-500">{formatTime(currentLapTime)}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={toggleFocusMode}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                    focusMode 
                      ? 'bg-primary-500/10 border-primary-500/30 text-primary-500' 
                      : 'bg-dark-800 border-dark-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Focus Mode: {focusMode ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Chat / Hints body */}
              <div className="p-4 flex-1 flex flex-col gap-3 max-h-[300px] min-h-[180px] overflow-y-auto">
                {hints.length === 0 ? (
                  /* Initial state before fetching hints */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3 gap-2">
                    <Sparkles className="text-primary-500 animate-bounce" size={24} />
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                      Extract problem details and generate hints tailored to this challenge.
                    </p>
                    {errorMsg && <p className="text-xs text-red-400 mt-2">{errorMsg}</p>}
                    
                    <button
                      onClick={getHints}
                      disabled={loadingHints || isHintDelayed}
                      className={`mt-3 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all shadow-md ${
                        isHintDelayed 
                          ? 'bg-dark-800 text-gray-500 cursor-not-allowed border border-dark-700' 
                          : 'bg-primary-500 hover:bg-primary-400 text-dark-900'
                      }`}
                    >
                      {loadingHints ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : isHintDelayed ? (
                        <>
                          <Shield size={12} />
                          Hints Locked ({formatTime(hintDelayRemaining)})
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Get Hint
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Display unlocked progressive hints */
                  <div className="space-y-3">
                    {hints.slice(0, hintLevel + 1).map((hint, idx) => (
                      <div 
                        key={idx} 
                        className="bg-dark-850 border border-dark-750 p-3 rounded-md text-xs text-gray-300 animate-in slide-in-from-bottom-2 duration-200"
                      >
                        <span className="font-bold text-primary-500 block mb-1 text-[10px] uppercase tracking-wider">
                          {levelLabels[idx]}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed text-gray-200">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer / Progression Controls */}
              {hints.length > 0 && (
                <div className="px-4 py-3 border-t border-dark-800/80 bg-dark-900/60 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-gray-500">Hint {hintLevel + 1} of {hints.length}</span>
                  <button
                    onClick={handleNextHint}
                    disabled={hintLevel === hints.length - 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      hintLevel === hints.length - 1 
                        ? 'bg-dark-800 text-gray-600 cursor-not-allowed border border-dark-750'
                        : 'bg-dark-800 hover:bg-dark-750 text-gray-200 border border-dark-700 shadow-md'
                    }`}
                  >
                    Next Hint
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}
      </div>
    </>
  );
}
