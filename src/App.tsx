/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Settings as SettingsIcon, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Shield, 
  ShieldOff, 
  Menu, 
  X,
  Globe,
  Moon,
  Sun,
  Monitor,
  Home,
  Bookmark,
  History,
  ChevronRight,
  MoreVertical,
  Share,
  Printer,
  Download,
  ExternalLink,
  Smartphone,
  SearchCode,
  Layers,
  Languages,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Theme, Language, translations, Profile, PasswordEntry, HistoryItem, BookmarkEntry, SearchEngine, defaultSearchEngines } from './types';

export default function App() {
  // --- Profiles & State ---
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('nexus-profiles');
    if (saved) return JSON.parse(saved);
    
    const defaultProfile: Profile = {
      id: 'default',
      name: 'Default User',
      avatar: '👤',
      settings: {
        adBlockEnabled: false,
        theme: 'system',
        language: navigator.language.startsWith('ru') ? 'ru' : 'en',
        searchEngineId: 'bing',
        customSearchEngines: [],
      },
      history: [],
      bookmarks: [],
      passwords: [],
    };
    return [defaultProfile];
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem('nexus-active-profile') || 'default';
  });

  const [isIncognito, setIsIncognito] = useState(false);
  const [isProfilesOpen, setIsProfilesOpen] = useState(false);
  const [isPasswordsOpen, setIsPasswordsOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [isStandardMode, setIsStandardMode] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isTabsOpen, setIsTabsOpen] = useState(false);
  const [translateTo, setTranslateTo] = useState<string | null>(null);
  const [findQuery, setFindQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAddSearchOpen, setIsAddSearchOpen] = useState(false);
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [passwordToSave, setPasswordToSave] = useState<PasswordEntry | null>(null);
  const [availablePasswords, setAvailablePasswords] = useState<PasswordEntry[]>([]);

  // --- Tabs ---
  const [tabs, setTabs] = useState<{ id: string, url: string, title: string }[]>(() => {
    return [{ id: 'default', url: 'https://www.bing.com', title: 'Bing' }];
  });
  const [activeTabId, setActiveTabId] = useState('default');

  const activeTab = useMemo(() => 
    tabs.find(t => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === activeProfileId) || profiles[0], 
    [profiles, activeProfileId]
  );

  const [url, setUrl] = useState(activeTab.url);
  const [inputUrl, setInputUrl] = useState(activeTab.url);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Navigation History
  const [historyStack, setHistoryStack] = useState<string[]>(['https://www.bing.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0); // For reloading

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'PASSWORD_DETECTED') {
        const { site, username, password } = e.data;
        try {
          const hostname = new URL(site).hostname;
          // Only prompt if this password isn't already saved
          const exists = activeProfile.passwords.find(p => p.site === hostname && p.username === username && p.password === password);
          if (!exists) {
            setPasswordToSave({
              id: Math.random().toString(36).substr(2, 9),
              site: hostname,
              username,
              password
            });
          }
        } catch (err) {
          console.error('Invalid URL in password detection', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeProfile.passwords]);

  // Check for available passwords on URL change
  useEffect(() => {
    try {
      const hostname = new URL(url).hostname;
      const matches = activeProfile.passwords.filter(p => p.site === hostname);
      setAvailablePasswords(matches);
    } catch (e) {
      setAvailablePasswords([]);
    }
  }, [url, activeProfile.passwords]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingProgress(10);
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 300);
    } else {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isFindOpen && findQuery) {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'FIND_ON_PAGE', query: findQuery }, '*');
      }
    }
  }, [findQuery, isFindOpen]);
  useEffect(() => {
    localStorage.setItem('nexus-profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('nexus-active-profile', activeProfileId);
  }, [activeProfileId]);

  // Theme handling
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (theme: Theme) => {
      let effectiveTheme = theme;
      
      if (theme === 'system') {
        if (isIncognito) {
          effectiveTheme = 'dark';
        } else {
          effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
      }
      
      // If incognito and system, we force dark. 
      // But if user explicitly chose 'light', we should probably respect it if they want to override.
      // The user said: "I want to override the system. You'll do light, and the light theme will be applied."
      
      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme(activeProfile.settings.theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (activeProfile.settings.theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [activeProfile.settings.theme, isIncognito]);

  // --- Helpers ---
  const t = useMemo(() => translations[activeProfile.settings.language], [activeProfile.settings.language]);

  const allSearchEngines = useMemo(() => [
    ...defaultSearchEngines,
    ...(activeProfile.settings.customSearchEngines || [])
  ], [activeProfile.settings.customSearchEngines]);

  const currentSearchEngine = useMemo(() => 
    allSearchEngines.find(e => e.id === activeProfile.settings.searchEngineId) || defaultSearchEngines[0],
    [allSearchEngines, activeProfile.settings.searchEngineId]
  );

  const updateActiveProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates } : p));
  };

  const updateSettings = (updates: Partial<Settings>) => {
    updateActiveProfile({ settings: { ...activeProfile.settings, ...updates } });
  };

  const navigateTo = (targetUrl: string, addToStack = true) => {
    // Prevent recursion: don't navigate to our own app URL inside the browser
    const appUrl = window.location.origin;
    if (targetUrl.startsWith(appUrl) && targetUrl !== appUrl + '/') {
      return;
    }

    setUrl(targetUrl);
    setInputUrl(targetUrl);
    setIsLoading(true);
    setIsIframeLoading(true);
    
    // Update current tab
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: targetUrl, title: targetUrl } : t));

    if (addToStack) {
      const newStack = historyStack.slice(0, historyIndex + 1);
      newStack.push(targetUrl);
      setHistoryStack(newStack);
      setHistoryIndex(newStack.length - 1);
    }

    // Save to history if not incognito
    if (!isIncognito) {
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        url: targetUrl,
        title: targetUrl,
        timestamp: Date.now(),
      };
      updateActiveProfile({ history: [newItem, ...activeProfile.history].slice(0, 100) });
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = inputUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        const baseUrl = currentSearchEngine.url;
        targetUrl = baseUrl.includes('%s') 
          ? baseUrl.replace('%s', encodeURIComponent(targetUrl))
          : baseUrl + encodeURIComponent(targetUrl);
      }
    }
    navigateTo(targetUrl);

    if (isStandardMode) {
      window.open(targetUrl, '_blank');
    }
  };

  const savePassword = () => {
    if (passwordToSave) {
      updateActiveProfile({ passwords: [...activeProfile.passwords, passwordToSave] });
      setPasswordToSave(null);
    }
  };

  const autofillPassword = (p: PasswordEntry) => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ 
        type: 'AUTOFILL_PASSWORD', 
        username: p.username, 
        password: p.password 
      }, '*');
      setAvailablePasswords([]); // Close prompt after use
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prevUrl = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setUrl(prevUrl);
      setInputUrl(prevUrl);
    }
  };

  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextUrl = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setUrl(nextUrl);
      setInputUrl(nextUrl);
    }
  };

  const reload = () => {
    setIframeKey(prev => prev + 1);
  };

  const addTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTab = { id: newId, url: 'https://www.bing.com', title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setUrl(newTab.url);
    setInputUrl(newTab.url);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const lastTab = newTabs[newTabs.length - 1];
      setActiveTabId(lastTab.id);
      setUrl(lastTab.url);
      setInputUrl(lastTab.url);
    }
  };

  const switchTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      setUrl(tab.url);
      setInputUrl(tab.url);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}&adblock=${activeProfile.settings.adBlockEnabled}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'page.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.download = 'page.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        alert(`File selected: ${file.name}`);
      }
    };
    input.click();
  };

  const handleFindOnPage = () => {
    setIsFindOpen(true);
    setIsMenuOpen(false);
  };

  const handleTranslate = () => {
    const lang = prompt('Enter language code (e.g., ru, en, es, fr, de):', 'ru');
    if (lang) {
      setTranslateTo(lang);
      reload();
    }
    setIsMenuOpen(false);
  };

  const handleUndoTranslate = () => {
    setTranslateTo(null);
    reload();
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nexus Browser',
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('URL copied to clipboard');
    }
  };

  const handlePrint = () => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'PRINT' }, '*');
    }
  };

  const handleSetDefault = () => {
    setIsDefaultModalOpen(true);
  };

  const openInNewTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTab = { id: newId, url: url, title: url };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setIsMenuOpen(false);
  };

  const openInStandardWindow = () => {
    // This opens a popup window which is "standard" and not an iframe
    window.open(url, 'NexusStandardWindow', 'width=1000,height=800,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes');
  };

  const toggleAdBlock = () => {
    updateSettings({ adBlockEnabled: !activeProfile.settings.adBlockEnabled });
  };

  const toggleIncognito = () => {
    setIsIncognito(!isIncognito);
    if (!isIncognito) {
      setUrl('about:blank');
      setInputUrl('');
    } else {
      const homeUrl = 'https://www.bing.com';
      setUrl(homeUrl);
      setInputUrl(homeUrl);
      setHistoryStack([homeUrl]);
      setHistoryIndex(0);
    }
  };

  const addBookmark = () => {
    if (isIncognito) return;
    const newBookmark: BookmarkEntry = {
      id: Math.random().toString(36).substr(2, 9),
      url: url,
      title: url,
    };
    updateActiveProfile({ bookmarks: [newBookmark, ...activeProfile.bookmarks] });
  };

  const createProfile = (name: string) => {
    const newProfile: Profile = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      avatar: ['🦊', '🐱', '🐶', '🐼', '🐨'][Math.floor(Math.random() * 5)],
      settings: { ...activeProfile.settings },
      history: [],
      bookmarks: [],
      passwords: [],
    };
    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
    setIsProfilesOpen(false);
  };

  const handleAddSearchEngine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEngineName && newEngineUrl) {
      const newEngine: SearchEngine = {
        id: Math.random().toString(36).substr(2, 9),
        name: newEngineName,
        url: newEngineUrl,
      };
      updateSettings({ 
        customSearchEngines: [...(activeProfile.settings.customSearchEngines || []), newEngine] 
      });
      setNewEngineName('');
      setNewEngineUrl('');
      setIsAddSearchOpen(false);
    }
  };

  // --- Components ---
  const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-500/10 text-blue-500 font-medium' 
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`}>
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className={`flex h-screen w-full font-sans transition-colors duration-300 overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}>
      
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 border-r p-4 gap-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold italic ${isIncognito ? 'bg-zinc-700' : 'bg-blue-600'}`}>N</div>
            <span className="text-xl font-bold tracking-tight">Nexus</span>
          </div>
          {isIncognito && <div className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-400">Private</div>}
        </div>
        
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <SidebarItem icon={Home} label={t.home} active={url === 'https://www.bing.com'} onClick={() => navigateTo('https://www.bing.com')} />
          <SidebarItem icon={Bookmark} label={t.bookmarks} onClick={() => setIsBookmarksOpen(true)} />
          <SidebarItem icon={History} label={t.history} onClick={() => setIsHistoryOpen(true)} />
          <div className="mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">{t.bookmarks}</div>
          {activeProfile.bookmarks.slice(0, 5).map(b => (
            <button key={b.id} onClick={() => navigateTo(b.url)} className="text-xs text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg truncate text-zinc-600 dark:text-zinc-400">
              {b.title}
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-1">
          <button 
            onClick={() => setIsPasswordsOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <Shield size={20} />
            <span className="text-sm">{t.passwords}</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <SettingsIcon size={20} />
            <span className="text-sm">{t.settings}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Bar / Address Bar */}
        <header className={`h-16 border-b flex items-center px-4 gap-4 backdrop-blur-md z-10 bg-white/80 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800`}>
          <button className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-1">
            <button 
              className={`p-2 rounded-lg transition-colors ${historyIndex > 0 ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'}`}
              onClick={goBack}
              disabled={historyIndex === 0}
            >
              <ArrowLeft size={18} />
            </button>
            <button 
              className={`p-2 rounded-lg transition-colors ${historyIndex < historyStack.length - 1 ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'}`}
              onClick={goForward}
              disabled={historyIndex === historyStack.length - 1}
            >
              <ArrowRight size={18} />
            </button>
            <button 
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" 
              onClick={reload}
            >
              <RotateCw size={18} />
            </button>
          </div>

          {/* Tabs UI removed from top bar as requested */}

          <form onSubmit={handleUrlSubmit} className="flex-1 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100`}
            />
          </form>

          <div className="flex items-center gap-2">
            <button 
              onClick={addBookmark}
              className={`p-2 rounded-lg transition-colors ${isIncognito ? 'hidden' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title={t.bookmarks}
            >
              <Bookmark size={20} />
            </button>
            <button 
              onClick={toggleIncognito}
              className={`p-2 rounded-lg transition-colors ${isIncognito ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title={t.incognito}
            >
              <Monitor size={20} />
            </button>
            <button 
              onClick={toggleAdBlock}
              className={`p-2 rounded-lg transition-colors ${activeProfile.settings.adBlockEnabled ? 'text-green-500 bg-green-500/10' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title={t.adBlock}
            >
              {activeProfile.settings.adBlockEnabled ? <Shield size={20} /> : <ShieldOff size={20} />}
            </button>
            
            <div className="relative flex items-center gap-1">
              <button 
                onClick={() => setIsTabsOpen(true)}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors relative"
                title={t.tabs}
              >
                <Layers size={20} />
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950">
                  {tabs.length}
                </span>
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 z-30 py-2 overflow-hidden origin-top-right"
                    >
                      <button 
                        onClick={() => { handleSetDefault(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-blue-600 font-medium"
                      >
                        <Smartphone size={18} />
                        <span>{t.setDefault}</span>
                      </button>
                      <button 
                        onClick={() => { addTab(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <X size={18} className="rotate-45" />
                        <span>{t.openInNewTab}</span>
                      </button>
                      <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />
                      <button 
                        onClick={() => { handleShare(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Share size={18} />
                        <span>{t.share}</span>
                      </button>
                      <button 
                        onClick={() => { addBookmark(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Bookmark size={18} />
                        <span>{t.addBookmark}</span>
                      </button>
                      <button 
                        onClick={() => { setIsBookmarksOpen(true); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Bookmark size={18} />
                        <span>{t.bookmarks}</span>
                      </button>
                      <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />
                      <button 
                        onClick={() => { setIsDesktopMode(!isDesktopMode); reload(); setIsMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDesktopMode ? 'text-blue-500' : ''}`}
                      >
                        <Monitor size={18} />
                        <span>{t.desktopVersion}</span>
                      </button>
                      <button 
                        onClick={() => { openInStandardWindow(); setIsMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isStandardMode ? 'text-blue-500' : ''}`}
                      >
                        <ExternalLink size={18} />
                        <span>{t.launchSite}</span>
                      </button>
                      <button 
                        onClick={handleFindOnPage}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <SearchCode size={18} />
                        <span>{t.findOnPage}</span>
                      </button>
                      <button 
                        onClick={handleTranslate}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Languages size={18} />
                        <span>{t.translate}</span>
                      </button>
                      {translateTo && (
                        <button 
                          onClick={handleUndoTranslate}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-red-500"
                        >
                          <Undo2 size={18} />
                          <span>{t.undoTranslate}</span>
                        </button>
                      )}
                      <button 
                        onClick={() => { handlePrint(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Printer size={18} />
                        <span>{t.printPage}</span>
                      </button>
                      <button 
                        onClick={() => { handleUpload(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Download size={18} className="rotate-180" />
                        <span>Upload File</span>
                      </button>
                      <button 
                        onClick={() => { handleDownload(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Download size={18} />
                        <span>{t.downloads}</span>
                      </button>
                      <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />
                      <button 
                        onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <SettingsIcon size={18} />
                        <span>{t.settings}</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block" />

            <button 
              onClick={() => setIsProfilesOpen(true)}
              className="flex items-center gap-2 p-1 pr-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-lg">
                {activeProfile.avatar}
              </div>
              <span className="text-xs font-medium hidden md:block">{activeProfile.name}</span>
            </button>
          </div>
        </header>

        {/* Browser Viewport */}
        <div className={`flex-1 relative flex flex-col bg-zinc-50 dark:bg-zinc-900`}>
          {/* Progress Bar */}
          <AnimatePresence>
            {loadingProgress > 0 && loadingProgress < 100 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-30"
                style={{ width: `${loadingProgress}%`, transition: 'width 0.3s ease-out' }}
              />
            )}
          </AnimatePresence>

          {/* Find on Page Bar */}
          <AnimatePresence>
            {isFindOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center gap-4 z-20"
              >
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                  <input 
                    autoFocus
                    type="text" 
                    value={findQuery}
                    onChange={(e) => setFindQuery(e.target.value)}
                    placeholder="Find on page..."
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg py-1.5 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <button onClick={() => setIsFindOpen(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isIncognito && url === 'about:blank' ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-zinc-50 dark:bg-zinc-950">
              <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Monitor size={48} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">{t.incognito}</h1>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-md">{t.incognitoDesc}</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col overflow-hidden relative">
              {isIframeLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-zinc-950">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-medium text-zinc-500 animate-pulse">{t.refresh}...</p>
                  </div>
                </div>
              )}
              <iframe 
                key={iframeKey}
                onLoad={() => {
                  setIsLoading(false);
                  setIsIframeLoading(false);
                }}
                src={`/api/proxy?url=${encodeURIComponent(url)}&adblock=${activeProfile.settings.adBlockEnabled}&desktop=${isDesktopMode}${translateTo ? `&translate=${translateTo}` : ''}`} 
                className={`flex-1 w-full border-none bg-white transition-opacity duration-300 ${
                  isIframeLoading ? 'opacity-0' : 'opacity-100'
                } ${
                  isDesktopMode ? 'max-w-5xl mx-auto shadow-2xl scale-95 origin-top' : ''
                }`}
                title="Browser Viewport"
                allow="geolocation; microphone; camera; midi; encrypted-media; clipboard-read; clipboard-write"
                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
              />
            </div>
          )}
          
          {/* AdBlock Simulation Overlay */}
          <AnimatePresence>
            {!activeProfile.settings.adBlockEnabled && !isIncognito && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm flex items-center gap-3 max-w-[90%] md:max-w-md"
              >
                <ShieldOff size={20} className="text-orange-400 shrink-0" />
                <p className="text-xs font-medium">{t.adBlockWarning}</p>
                <button 
                  onClick={toggleAdBlock}
                  className="bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                  {t.enabled}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Save Prompt */}
          <AnimatePresence>
            {passwordToSave && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute top-4 right-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-72 z-20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{t.savePassword}</h3>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400">{passwordToSave.site}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">{t.username}</div>
                  <div className="text-xs font-medium">{passwordToSave.username}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={savePassword}
                    className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    {t.save}
                  </button>
                  <button 
                    onClick={() => setPasswordToSave(null)}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t.delete}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Autofill Prompt */}
          <AnimatePresence>
            {availablePasswords.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute top-4 left-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-72 z-20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{t.autofill}</h3>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400">{new URL(url).hostname}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {availablePasswords.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => autofillPassword(p)}
                      className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{p.username}</span>
                        <span className="text-[10px] text-zinc-500">••••••••</span>
                      </div>
                      <ChevronRight size={14} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                  <button 
                    onClick={() => setAvailablePasswords([])}
                    className="w-full py-2 text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-bold uppercase tracking-widest"
                  >
                    {t.noThanks}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Bar */}
        <footer className="md:hidden h-16 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-4 bg-white dark:bg-zinc-950">
          <button className="p-2 text-blue-500" onClick={() => navigateTo('https://www.bing.com')}><Home size={24} /></button>
          <button className="p-2 text-zinc-600 dark:text-zinc-400 relative" onClick={() => setIsTabsOpen(true)}>
            <Layers size={24} />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-zinc-950">
              {tabs.length}
            </span>
          </button>
          <button className="p-2 text-zinc-600 dark:text-zinc-400" onClick={() => setIsBookmarksOpen(true)}><Bookmark size={24} /></button>
          <button className="p-2 text-zinc-600 dark:text-zinc-400" onClick={() => setIsHistoryOpen(true)}><History size={24} /></button>
          <button className="p-2 text-zinc-600 dark:text-zinc-400" onClick={() => setIsSettingsOpen(true)}><SettingsIcon size={24} /></button>
        </footer>
      </main>

      {/* Tabs Modal */}
      <AnimatePresence>
        {isTabsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTabsOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.tabs}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { addTab(); setIsTabsOpen(false); }}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <X size={20} className="rotate-45" />
                  </button>
                  <button onClick={() => setIsTabsOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tabs.map(tab => (
                  <div 
                    key={tab.id}
                    onClick={() => { switchTab(tab.id); setIsTabsOpen(false); }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                      activeTabId === tab.id ? 'border-blue-600 bg-blue-600/5' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Globe size={14} className="text-zinc-500 dark:text-zinc-400" />
                        <span className="text-sm font-bold truncate">{tab.title}</span>
                      </div>
                      <button 
                        onClick={(e) => closeTab(tab.id, e)}
                        className="p-1 hover:bg-red-500/10 text-zinc-500 dark:text-zinc-400 hover:text-red-500 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">{tab.url}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t.settings}</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-8">
                {/* AdBlock Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeProfile.settings.adBlockEnabled ? 'bg-green-500/10 text-green-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">{t.adBlock}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">{activeProfile.settings.adBlockEnabled ? t.enabled : t.disabled}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleAdBlock}
                    className={`w-12 h-6 rounded-full transition-colors relative ${activeProfile.settings.adBlockEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <motion.div 
                      animate={{ x: activeProfile.settings.adBlockEnabled ? 24 : 4 }}
                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {/* Theme Selection */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                      <Sun size={20} />
                    </div>
                    <p className="font-semibold">{t.theme}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', icon: Sun, label: t.light },
                      { id: 'dark', icon: Moon, label: t.dark },
                      { id: 'system', icon: Monitor, label: t.system }
                    ].map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => updateSettings({ theme: item.id as Theme })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                          activeProfile.settings.theme === item.id 
                            ? 'border-blue-600 bg-blue-600/5 text-blue-600' 
                            : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                      <Globe size={20} />
                    </div>
                    <p className="font-semibold">{t.language}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'ru', label: 'Русский' },
                      { id: 'en', label: 'English' }
                    ].map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => updateSettings({ language: item.id as Language })}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          activeProfile.settings.language === item.id 
                            ? 'border-blue-600 bg-blue-600/5 text-blue-600' 
                            : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
                        {activeProfile.settings.language === item.id && <ChevronRight size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Engine Selection */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                      <Search size={20} />
                    </div>
                    <p className="font-semibold">{t.searchEngine}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {allSearchEngines.map((engine) => (
                      <div key={engine.id} className="flex items-center gap-2">
                        <button 
                          onClick={() => updateSettings({ searchEngineId: engine.id })}
                          className={`flex-1 flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            activeProfile.settings.searchEngineId === engine.id 
                              ? 'border-blue-600 bg-blue-600/5 text-blue-600' 
                              : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span className="font-medium">{engine.name}</span>
                          {activeProfile.settings.searchEngineId === engine.id && <ChevronRight size={16} />}
                        </button>
                        {activeProfile.settings.customSearchEngines?.some(e => e.id === engine.id) && (
                          <button 
                            onClick={() => updateSettings({ 
                              customSearchEngines: activeProfile.settings.customSearchEngines.filter(e => e.id !== engine.id),
                              searchEngineId: activeProfile.settings.searchEngineId === engine.id ? 'bing' : activeProfile.settings.searchEngineId
                            })}
                            className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => setIsAddSearchOpen(true)}
                      className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-blue-500 hover:border-blue-500 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <X size={16} className="rotate-45" />
                      {t.addSearchEngine}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Search Engine Modal */}
      <AnimatePresence>
        {isAddSearchOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddSearchOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6">
              <h2 className="text-xl font-bold mb-6">{t.addSearchEngine}</h2>
              <form onSubmit={handleAddSearchEngine} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1 block">{t.engineName}</label>
                  <input 
                    type="text" 
                    value={newEngineName}
                    onChange={(e) => setNewEngineName(e.target.value)}
                    placeholder="e.g., DuckDuckGo"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1 block">{t.engineUrl}</label>
                  <input 
                    type="text" 
                    value={newEngineUrl}
                    onChange={(e) => setNewEngineUrl(e.target.value)}
                    placeholder="https://duckduckgo.com/?q=%s"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setIsAddSearchOpen(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">{t.delete}</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">{t.save}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profiles Modal */}
      <AnimatePresence>
        {isProfilesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfilesOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.profiles}</h2>
                <button onClick={() => setIsProfilesOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                {profiles.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => { setActiveProfileId(p.id); setIsProfilesOpen(false); }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      activeProfileId === p.id ? 'border-blue-600 bg-blue-600/5' : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xl">{p.avatar}</div>
                      <div className="text-left">
                        <div className="font-bold">{p.name}</div>
                        {activeProfileId === p.id && <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{t.active}</div>}
                      </div>
                    </div>
                    {activeProfileId === p.id && <ChevronRight size={20} className="text-blue-600" />}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => createProfile(`User ${profiles.length + 1}`)}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <X size={20} className="rotate-45" />
                {t.addProfile}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Passwords Modal */}
      <AnimatePresence>
        {isPasswordsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPasswordsOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.passwords}</h2>
                <button onClick={() => setIsPasswordsOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                {activeProfile.passwords.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">{t.noPasswords}</div>
                ) : (
                  activeProfile.passwords.map(p => (
                    <div key={p.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">{p.site}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">{p.username}</div>
                      </div>
                      <button 
                        onClick={() => updateActiveProfile({ passwords: activeProfile.passwords.filter(pw => pw.id !== p.id) })}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bookmarks Modal */}
      <AnimatePresence>
        {isBookmarksOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBookmarksOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.bookmarks}</h2>
                <button onClick={() => setIsBookmarksOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                {activeProfile.bookmarks.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">{t.noBookmarks}</div>
                ) : (
                  activeProfile.bookmarks.map(b => (
                    <div key={b.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                      <button 
                        onClick={() => { navigateTo(b.url); setIsBookmarksOpen(false); }}
                        className="flex-1 text-left"
                      >
                        <div className="font-bold text-sm truncate">{b.title}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{b.url}</div>
                      </button>
                      <button 
                        onClick={() => updateActiveProfile({ bookmarks: activeProfile.bookmarks.filter(bm => bm.id !== b.id) })}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.history}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateActiveProfile({ history: [] })}
                    className="text-xs text-red-500 font-bold uppercase tracking-widest px-3 py-1 hover:bg-red-500/10 rounded-lg"
                  >
                    {t.delete}
                  </button>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                {activeProfile.history.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">{t.noHistory}</div>
                ) : (
                  activeProfile.history.map(h => (
                    <div key={h.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                      <button 
                        onClick={() => { navigateTo(h.url); setIsHistoryOpen(false); }}
                        className="flex-1 text-left"
                      >
                        <div className="font-bold text-sm truncate">{h.title}</div>
                        <div className="text-[10px] text-zinc-600 dark:text-zinc-400">{new Date(h.timestamp).toLocaleString()}</div>
                      </button>
                      <button 
                        onClick={() => updateActiveProfile({ history: activeProfile.history.filter(hi => hi.id !== h.id) })}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Default Browser Modal */}
      <AnimatePresence>
        {isDefaultModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDefaultModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.defaultBrowserTitle}</h2>
                <button onClick={() => setIsDefaultModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-2xl mb-6">
                <div className="flex items-center gap-3 mb-2 text-blue-600">
                  <Smartphone size={24} />
                  <span className="font-bold">{t.setDefault}</span>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-600 dark:text-zinc-400">
                  {t.defaultBrowserSteps}
                </pre>
              </div>
              <button 
                onClick={() => setIsDefaultModalOpen(false)}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 p-6 flex flex-col gap-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold italic">N</div>
                  <span className="text-xl font-bold tracking-tight">Nexus</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-1 flex-1">
                <SidebarItem icon={Home} label={t.home} active={url === 'https://www.bing.com'} onClick={() => { navigateTo('https://www.bing.com'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={Bookmark} label={t.bookmarks} onClick={() => { setIsBookmarksOpen(true); setIsSidebarOpen(false); }} />
                <SidebarItem icon={History} label={t.history} onClick={() => { setIsHistoryOpen(true); setIsSidebarOpen(false); }} />
              </nav>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <SettingsIcon size={20} />
                  <span className="text-sm">{t.settings}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
