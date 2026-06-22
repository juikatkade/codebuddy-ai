import { useState, useEffect } from 'react';
import { Target, Flame, Trophy, Terminal, Settings, Eye, EyeOff, Save, Trash2, Key, Clock, Shield, BookOpen } from 'lucide-react';

const isExtension = typeof chrome !== 'undefined' && chrome.storage !== undefined;

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'error' | 'deleted'>('idle');
  
  // Stats state
  const [dailyTime, setDailyTime] = useState(0);
  const [weeklyTime, setWeeklyTime] = useState(0);

  // Focus Settings state
  const [violationLimit, setViolationLimit] = useState<number | 'unlimited'>(3);
  const [examModeEnabled, setExamModeEnabled] = useState(false);
  const [focusGuardTone, setFocusGuardTone] = useState<string>('sarcastic');

  // Load key and stats on mount
  useEffect(() => {
    const loadData = async () => {
      if (isExtension) {
        chrome.storage.local.get(['geminiApiKey', 'email', 'telegramUsername', 'dailyTime', 'weeklyTime', 'violationLimit', 'examModeEnabled', 'focusGuardTone'], (result) => {
          if (result.geminiApiKey) {
            setApiKey(result.geminiApiKey);
            setValidationStatus('valid'); // Assumed valid if saved
          }
          if (result.email) setEmail(result.email);
          if (result.telegramUsername) setTelegramUsername(result.telegramUsername);
          setDailyTime(result.dailyTime || 0);
          setWeeklyTime(result.weeklyTime || 0);
          if (result.violationLimit !== undefined) setViolationLimit(result.violationLimit);
          if (result.examModeEnabled !== undefined) setExamModeEnabled(!!result.examModeEnabled);
          if (result.focusGuardTone !== undefined) setFocusGuardTone(result.focusGuardTone);
        });
      } else {
        const savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
          setApiKey(savedKey);
          setValidationStatus('valid');
        }
        const savedEmail = localStorage.getItem('email');
        if (savedEmail) setEmail(savedEmail);
        const savedTelegram = localStorage.getItem('telegramUsername');
        if (savedTelegram) setTelegramUsername(savedTelegram);
        
        setDailyTime(Number(localStorage.getItem('dailyTime')) || 0);
        setWeeklyTime(Number(localStorage.getItem('weeklyTime')) || 0);

        const savedLimit = localStorage.getItem('violationLimit');
        if (savedLimit) setViolationLimit(savedLimit === 'unlimited' ? 'unlimited' : Number(savedLimit));
        setExamModeEnabled(localStorage.getItem('examModeEnabled') === 'true');
        const savedTone = localStorage.getItem('focusGuardTone');
        if (savedTone) setFocusGuardTone(savedTone);
      }
    };
    loadData();
  }, []);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const saveFocusSettings = () => {
    if (isExtension) {
      chrome.storage.local.set({ violationLimit, examModeEnabled, focusGuardTone });
    } else {
      localStorage.setItem('violationLimit', String(violationLimit));
      localStorage.setItem('examModeEnabled', String(examModeEnabled));
      localStorage.setItem('focusGuardTone', focusGuardTone);
    }
  };

  // Auto-save Focus Settings when changed
  useEffect(() => {
    saveFocusSettings();
  }, [violationLimit, examModeEnabled, focusGuardTone]);

  const validateAndSaveKey = async () => {
    if (!apiKey.trim()) {
      setValidationStatus('invalid');
      return;
    }

    setValidationStatus('validating');

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello. Just say 'Success'."
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

        if (isExtension) {
          chrome.storage.local.set({ geminiApiKey: apiKey, email, telegramUsername }, () => {
            setValidationStatus('valid');
          });
        } else {
          localStorage.setItem('geminiApiKey', apiKey);
          localStorage.setItem('email', email);
          localStorage.setItem('telegramUsername', telegramUsername);
          setValidationStatus('valid');
        }
      } else {
        setValidationStatus('invalid');
      }
    } catch (err) {
      console.error(err);
      setValidationStatus('error');
    }
  };

  const deleteKey = async () => {
    if (isExtension) {
      chrome.storage.local.remove('geminiApiKey', () => {
        setApiKey('');
        setValidationStatus('deleted');
      });
    } else {
      localStorage.removeItem('geminiApiKey');
      setApiKey('');
      setValidationStatus('deleted');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-dark-950 text-gray-100 font-sans border border-dark-800">
      {/* Header */}
      <header className="p-4 bg-dark-900 border-b border-dark-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="text-primary-500" size={24} />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
            CodeBuddy AI
          </h1>
        </div>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-dark-800 text-white' : 'hover:bg-dark-800 text-gray-400'}`}
        >
          <Settings size={20} className={activeTab === 'settings' ? 'text-white' : 'text-gray-400 hover:text-white'} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'settings' ? (
          /* Settings Panel */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="text-primary-500" size={20} />
                <h2 className="font-semibold text-gray-100">Gemini API Configuration</h2>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter your Google Gemini API Key. The key will be stored locally on your device and will be used to generate smart hints.
              </p>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationStatus('idle');
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 pr-10 text-sm text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative mt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for Contest Reminders"
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="relative mt-2 flex gap-2">
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="Telegram Username (e.g. johndoe)"
                  className="flex-1 bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <a
                  href="https://t.me/CodeBuddyBot?start=connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-[#24A1DE] hover:bg-[#1d8ec4] text-white px-3 rounded-lg text-xs font-semibold transition-colors shadow-lg"
                >
                  Connect Telegram
                </a>
              </div>

              {/* Status Indicator */}
              <div className="text-xs">
                {validationStatus === 'validating' && (
                  <span className="text-yellow-500">Validating API Key...</span>
                )}
                {validationStatus === 'valid' && (
                  <span className="text-primary-500">✓ API Key is valid and saved!</span>
                )}
                {validationStatus === 'invalid' && (
                  <span className="text-red-500">✗ Invalid API Key. Please verify.</span>
                )}
                {validationStatus === 'error' && (
                  <span className="text-red-400">✗ Connection error. Could not validate.</span>
                )}
                {validationStatus === 'deleted' && (
                  <span className="text-gray-400">API Key deleted.</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={validateAndSaveKey}
                  disabled={validationStatus === 'validating'}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Save size={16} />
                  Save Key
                </button>
                {validationStatus === 'valid' && (
                  <button
                    onClick={deleteKey}
                    className="flex items-center justify-center bg-red-950 border border-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded-lg text-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Focus Mode Settings */}
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 space-y-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-primary-500" size={20} />
                <h2 className="font-semibold text-gray-100">Focus Mode Configuration</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Violation Limit</span>
                  <select 
                    value={violationLimit} 
                    onChange={(e) => setViolationLimit(e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value))}
                    className="bg-dark-950 border border-dark-800 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value={3}>3 Violations</option>
                    <option value={5}>5 Violations</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Focus Guard Tone</span>
                  <select 
                    value={focusGuardTone} 
                    onChange={(e) => setFocusGuardTone(e.target.value)}
                    className="bg-dark-950 border border-dark-800 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="sarcastic">Sarcastic</option>
                    <option value="brutal">Brutal</option>
                    <option value="random">Random</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300">Exam Mode</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={examModeEnabled}
                      onChange={(e) => setExamModeEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-dark-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Exam Mode strictly hides solutions, discussions, and delays AI hints for the first 20 minutes to simulate real exam conditions.
                </p>
              </div>
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          /* Analytics Panel */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-primary-500" size={20} />
                <h2 className="font-semibold text-gray-100">Coding Time Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Time</p>
                    <p className="text-xl font-bold font-mono text-primary-400 mt-1">{formatDuration(dailyTime)}</p>
                  </div>
                  <Clock size={28} className="text-primary-500/50" />
                </div>

                <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">This Week's Time</p>
                    <p className="text-xl font-bold font-mono text-primary-400 mt-1">{formatDuration(weeklyTime)}</p>
                  </div>
                  <Trophy size={28} className="text-yellow-500/50" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Home Panel */
          <>
            {/* Daily Motivation */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame size={48} className="text-primary-500" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Daily Motivation</p>
              <p className="text-md italic text-gray-200">
                "Your future interviewer is practicing right now."
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 flex flex-col items-center justify-center gap-2">
                <Flame className="text-orange-500" size={28} />
                <div className="text-center">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-gray-400">Day Streak</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 flex flex-col items-center justify-center gap-2">
                <Target className="text-primary-500" size={28} />
                <div className="text-center">
                  <p className="text-2xl font-bold">3/5</p>
                  <p className="text-xs text-gray-400">Daily Goal</p>
                </div>
              </div>
            </div>

            {/* Upcoming Contests */}
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-800">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="text-yellow-500" size={20} />
                <h2 className="font-semibold">Upcoming Contests</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">LeetCode Weekly</span>
                  <span className="text-primary-400 font-mono">1d 14h</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Codeforces Round</span>
                  <span className="text-primary-400 font-mono">2d 02h</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="flex justify-around items-center p-3 bg-dark-900 border-t border-dark-800">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'home' ? 'text-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Target size={20} />
          <span className="text-[10px]">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'analytics' ? 'text-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Clock size={20} />
          <span className="text-[10px]">Analytics</span>
        </button>
      </footer>
    </div>
  );
}

export default App;

