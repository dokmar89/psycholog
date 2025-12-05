import React, { useState, useRef, useEffect } from 'react';
import { Send, PanelRightOpen, PanelRightClose, PlusCircle, Users, Loader2, LogOut, Save, User, FileText } from 'lucide-react';
import { Disclaimer } from './components/Disclaimer';
import { ChatMessage } from './components/ChatMessage';
import { InsightPanel } from './components/InsightPanel';
import { ProfileSelector } from './components/ProfileSelector';
import { streamTherapyResponse } from './services/gemini';
import { Message, LoadingState, UserProfile } from './types';
import { v4 as uuidv4 } from 'uuid';

const LEGACY_STORAGE_KEY = 'mindfulspace_session_v1';
const PROFILES_STORAGE_KEY = 'mindfulspace_profiles_v1';

export default function App() {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [showInsight, setShowInsight] = useState(true);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Load Profiles & Legacy Migration on Mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    let loadedProfiles: UserProfile[] = [];

    if (savedProfiles) {
      try {
        loadedProfiles = JSON.parse(savedProfiles);
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }

    // Migration Check: If we have legacy data but no profiles, create a default profile
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData && loadedProfiles.length === 0) {
      const defaultProfile: UserProfile = {
        id: uuidv4(),
        name: 'Výchozí klient',
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      loadedProfiles.push(defaultProfile);
      // Migrate messages to new key format
      localStorage.setItem(`mindfulspace_session_${defaultProfile.id}`, legacyData);
      localStorage.removeItem(LEGACY_STORAGE_KEY); // Cleanup
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(loadedProfiles));
    }

    // Sort by last active
    loadedProfiles.sort((a, b) => b.lastActive - a.lastActive);
    setProfiles(loadedProfiles);
  }, []);

  // 2. Load Messages when Profile Changes
  useEffect(() => {
    if (currentProfile) {
      const sessionKey = `mindfulspace_session_${currentProfile.id}`;
      const savedSession = localStorage.getItem(sessionKey);
      
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setHasAcceptedDisclaimer(true); // Skip disclaimer if returning
          } else {
            setMessages([]);
            setHasAcceptedDisclaimer(false); // New session for existing profile needs disclaimer? Maybe not, but let's be safe or just keep history.
            // Actually if empty, let's keep empty.
          }
        } catch (e) {
          console.error("Failed to load session", e);
          setMessages([]);
        }
      } else {
        setMessages([]);
        setHasAcceptedDisclaimer(false);
      }
    }
  }, [currentProfile]);

  // 3. Save Messages & Update Profile LastActive
  useEffect(() => {
    if (currentProfile) {
      const sessionKey = `mindfulspace_session_${currentProfile.id}`;
      // Only save if we have messages or if it was cleared (empty array)
      localStorage.setItem(sessionKey, JSON.stringify(messages));
    }
  }, [messages, currentProfile]);

  const updateProfileTimestamp = (profileId: string) => {
    setProfiles(prev => {
      const updated = prev.map(p => p.id === profileId ? { ...p, lastActive: Date.now() } : p);
      updated.sort((a, b) => b.lastActive - a.lastActive);
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateProfile = (name: string) => {
    const newProfile: UserProfile = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    const updatedProfiles = [newProfile, ...profiles];
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
    setCurrentProfile(newProfile);
  };

  const handleSelectProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      // Update timestamp immediately on select
      updateProfileTimestamp(profileId);
      // We need to fetch the fresh one because updateProfileTimestamp updates state but maybe async logic...
      // actually updateProfileTimestamp sets state. Let's just set CurrentProfile to 'profile' but with new timestamp
      setCurrentProfile({ ...profile, lastActive: Date.now() });
    }
  };

  const handleLogout = () => {
    setCurrentProfile(null);
    setMessages([]);
    setHasAcceptedDisclaimer(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  // Adjust textarea height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const processResponse = async (newHistory: Message[]) => {
    if (!currentProfile) return;
    
    setLoadingState('thinking');
    updateProfileTimestamp(currentProfile.id);
    
    // Prepare placeholder for AI response
    const aiMsgId = uuidv4();
    const newAiMessage: Message = {
      id: aiMsgId,
      role: 'model',
      content: '',
      rationale: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newAiMessage]);

    try {
      // Find the user prompt for the API call (last message)
      const lastUserMsg = newHistory[newHistory.length - 1];

      await streamTherapyResponse(
        newHistory, 
        lastUserMsg.content,
        (content, rationale) => {
          setLoadingState('streaming');
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, content, rationale } 
              : msg
          ));
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, content: "Omlouvám se, spojení s konziliem bylo přerušeno. Zkuste to prosím znovu." } 
          : msg
      ));
    } finally {
      setLoadingState('idle');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loadingState !== 'idle') return;

    const userMsgId = uuidv4();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, newUserMessage];
    setMessages(newHistory);
    setInputText('');
    
    if (inputRef.current) inputRef.current.style.height = 'auto';

    await processResponse(newHistory);
  };

  const handleSummarize = async () => {
    if (loadingState !== 'idle' || messages.length === 0) return;

    const userMsgId = uuidv4();
    const summaryRequest: Message = {
      id: userMsgId,
      role: 'user',
      content: "Potřebuji se zorientovat. Prosím o průběžné shrnutí toho, co jsme zatím probrali, jaké vzorce vidíte, co nám ještě chybí a kam směřujeme. Mluvte jasně a srozumitelně.",
      timestamp: Date.now(),
    };

    const newHistory = [...messages, summaryRequest];
    setMessages(newHistory);
    
    await processResponse(newHistory);
  };

  const handleEndSession = async () => {
    if (loadingState !== 'idle' || messages.length === 0) return;

    if (!confirm('Chcete ukončit dnešní sezení? AI provede závěrečné shrnutí a uloží kontext pro příště.')) return;

    const userMsgId = uuidv4();
    const endMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: "Cítím se pro dnešek vyčerpaně a chci sezení ukončit. Prosím o závěrečné shrnutí toho, co jsme dnes probrali, uložení kontextu a konkrétní rady nebo cvičení do příštího setkání. Chci navázat tam, kde jsme skončili.",
      timestamp: Date.now(),
    };

    const newHistory = [...messages, endMessage];
    setMessages(newHistory);
    
    await processResponse(newHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewSession = () => {
    if (confirm('Chcete smazat historii tohoto pacienta a začít od začátku? Data nelze obnovit.')) {
      setMessages([]);
      setInputText('');
    }
  };

  // Helper to get current rationale for the side panel
  const currentAiMessage = messages.length > 0 && messages[messages.length - 1].role === 'model' 
    ? messages[messages.length - 1] 
    : messages.length > 1 && messages[messages.length - 2].role === 'model'
      ? messages[messages.length - 2]
      : undefined;

  const isAiWorking = loadingState === 'thinking' || (loadingState === 'streaming' && messages.length > 0 && messages[messages.length-1].role === 'model' && !messages[messages.length-1].content);

  // If no profile selected, show selector
  if (!currentProfile) {
    return (
      <ProfileSelector 
        profiles={profiles} 
        onSelectProfile={handleSelectProfile} 
        onCreateProfile={handleCreateProfile} 
      />
    );
  }

  return (
    <div className="flex h-full w-full bg-stone-50 overflow-hidden relative">
      {!hasAcceptedDisclaimer && <Disclaimer onAccept={() => setHasAcceptedDisclaimer(true)} />}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-stone-200 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
              <Users size={20} />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-stone-800 leading-tight hidden md:block">Klinická Psychoanalýza</h1>
              <h1 className="font-serif font-semibold text-stone-800 leading-tight md:hidden">MindfulSpace</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-500 animate-pulse"></span>
                  <span className="text-xs text-stone-500 font-medium hidden sm:inline">Investigativní režim</span>
                </div>
                <div className="text-xs text-stone-400 border-l border-stone-300 pl-2 ml-1 flex items-center gap-1">
                  <User size={10} />
                  <span className="font-medium text-stone-600">{currentProfile.name}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors text-sm font-medium"
              title="Změnit profil / Odhlásit"
            >
              <LogOut size={18} />
              <span>Změnit</span>
            </button>

             <button 
              onClick={handleSummarize}
              disabled={loadingState !== 'idle' || messages.length === 0}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-stone-200"
              title="Vytvořit průběžné shrnutí"
            >
              <FileText size={18} />
              <span>Shrnutí</span>
            </button>

            <button 
              onClick={handleEndSession}
              disabled={loadingState !== 'idle' || messages.length === 0}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-stone-200"
              title="Ukončit dnešní sezení a uložit progres"
            >
              <Save size={18} />
              <span>Uložit</span>
            </button>

            <button 
              onClick={startNewSession}
              title="Smazat a začít nové sezení pro tento profil"
              className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <PlusCircle size={22} />
            </button>
            <button 
              onClick={() => setShowInsight(!showInsight)}
              className={`p-2 rounded-lg transition-colors ${showInsight ? 'bg-stone-200 text-stone-800' : 'text-stone-500 hover:bg-stone-100'}`}
              title={showInsight ? "Skrýt diagnostiku" : "Zobrazit klinickou diagnostiku"}
            >
              {showInsight ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
            </button>
          </div>
        </header>

        {/* Chat List */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-2">
             {messages.length === 0 && (
               <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-in fade-in duration-700">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 max-w-md">
                    <h2 className="text-xl font-serif text-stone-800 mb-2">Vítejte, {currentProfile.name}</h2>
                    <p className="text-stone-600 mb-4">
                      Konzilium je připraveno pokračovat v hlubinné analýze.
                      Jako tým (Freud, Jung, Rogers, KBT) budeme klást <strong>nekompromisní otázky</strong>, abychom našli skutečné příčiny (jizvy) vašich problémů.
                    </p>
                    <p className="text-sm text-stone-700 font-medium bg-stone-100 py-2 px-3 rounded-lg inline-block border border-stone-200">
                      Otevřete se. Co vás dnes tíží?
                    </p>
                  </div>
               </div>
             )}
            
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isAiWorking && (
               <div className="flex items-center gap-2 text-stone-400 text-sm ml-4 animate-pulse py-2">
                 <Loader2 size={14} className="animate-spin" />
                 <span className="font-serif italic">
                   {loadingState === 'thinking' ? 'Konzilium studuje případ...' : 'Probíhá diagnostika...'}
                 </span>
               </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-stone-200 shrink-0">
          <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-stone-50 border border-stone-200 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-stone-300 focus-within:border-stone-400 transition-all">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Odpovězte upřímně..."
              disabled={loadingState !== 'idle'}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-4 text-stone-800 placeholder-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || loadingState !== 'idle'}
              className="p-3 mb-1 bg-stone-700 text-white rounded-full hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md transform active:scale-95 flex items-center justify-center min-w-[44px]"
            >
              {loadingState !== 'idle' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-2">
             <div className="flex gap-4 md:hidden">
                <button 
                  onClick={handleSummarize}
                  className="flex items-center gap-1 text-[10px] text-stone-500 uppercase tracking-wider font-semibold hover:text-stone-800"
                  disabled={loadingState !== 'idle' || messages.length === 0}
                >
                  <FileText size={12} />
                  Shrnutí
                </button>
                <button 
                  onClick={handleEndSession}
                  className="flex items-center gap-1 text-[10px] text-stone-500 uppercase tracking-wider font-semibold hover:text-stone-800"
                  disabled={loadingState !== 'idle' || messages.length === 0}
                >
                  <Save size={12} />
                  Uložit
                </button>
             </div>
             
             {/* Spacer for desktop layout where buttons are hidden */}
             <div className="hidden md:block"></div>

            <p className="text-[10px] text-stone-400 text-right">
              AI diagnostika. Slouží k seberozvoji, nenahrazuje psychiatrickou péči.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel (Insight) */}
      <div className={`${showInsight ? 'w-80 lg:w-96 translate-x-0' : 'w-0 translate-x-full'} hidden md:block transition-all duration-300 ease-in-out`}>
         <InsightPanel 
           rationale={currentAiMessage?.rationale} 
           isVisible={true}
           loadingState={loadingState}
         />
      </div>
      
      {/* Mobile Overlay Insight */}
      {showInsight && (
        <div className="md:hidden absolute inset-0 z-20 bg-black/20" onClick={() => setShowInsight(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm" onClick={e => e.stopPropagation()}>
              <InsightPanel 
                rationale={currentAiMessage?.rationale} 
                isVisible={true}
                loadingState={loadingState}
              />
           </div>
        </div>
      )}

    </div>
  );
}