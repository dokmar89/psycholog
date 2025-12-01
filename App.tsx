import React, { useState, useRef, useEffect } from 'react';
import { Send, PanelRightOpen, PanelRightClose, PlusCircle, Users } from 'lucide-react';
import { Disclaimer } from './components/Disclaimer';
import { ChatMessage } from './components/ChatMessage';
import { InsightPanel } from './components/InsightPanel';
import { streamTherapyResponse } from './services/gemini';
import { Message, LoadingState } from './types';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [showInsight, setShowInsight] = useState(true);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSendMessage = async () => {
    if (!inputText.trim() || loadingState !== 'idle') return;

    const userMsgId = uuidv4();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setLoadingState('thinking');

    if (inputRef.current) inputRef.current.style.height = 'auto';

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
      await streamTherapyResponse(
        [...messages, newUserMessage], 
        newUserMessage.content,
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
      // Remove the empty AI message on error or add error message
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, content: "Omlouvám se, spojení s konziliem bylo přerušeno. Zkuste to prosím znovu." } 
          : msg
      ));
    } finally {
      setLoadingState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewSession = () => {
    if (confirm('Chcete opravdu začít nové sezení? Historie chatu bude vymazána.')) {
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
              <h1 className="font-serif font-semibold text-stone-800 leading-tight">Psychologické Konzilium</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-500 animate-pulse"></span>
                <span className="text-xs text-stone-500 font-medium">Freud • Jung • Rogers • KBT</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={startNewSession}
              title="Nové sezení"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <PlusCircle size={22} />
            </button>
            <button 
              onClick={() => setShowInsight(!showInsight)}
              className={`p-2 rounded-lg transition-colors ${showInsight ? 'bg-stone-200 text-stone-800' : 'text-stone-500 hover:bg-stone-100'}`}
              title={showInsight ? "Skrýt analýzu" : "Zobrazit multiperspektivní analýzu"}
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
                    <h2 className="text-xl font-serif text-stone-800 mb-2">Vítejte na konzultaci.</h2>
                    <p className="text-stone-600 mb-4">
                      Váš problém bude analyzován skrze optiku <strong>Freuda, Junga, Rogerse a KBT</strong>.
                      Nebudeme klást zbytečné otázky. Dostanete odpovědi a různé úhly pohledu na vaši situaci.
                    </p>
                    <p className="text-sm text-stone-700 font-medium bg-stone-100 py-2 px-3 rounded-lg inline-block border border-stone-200">
                      Co vás trápí? Buďte upřímní, jsme zde, abychom to rozklíčovali.
                    </p>
                  </div>
               </div>
             )}
            
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {loadingState === 'thinking' && messages[messages.length-1]?.role !== 'model' && (
               <div className="flex items-center gap-2 text-stone-400 text-sm ml-4 animate-pulse">
                 <span className="w-2 h-2 bg-stone-300 rounded-full"></span>
                 <span className="w-2 h-2 bg-stone-300 rounded-full animation-delay-200"></span>
                 <span className="w-2 h-2 bg-stone-300 rounded-full animation-delay-400"></span>
                 <span className="ml-2 font-serif italic">Konzilium se radí...</span>
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
              placeholder="Popište svůj problém..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-4 text-stone-800 placeholder-stone-400"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || loadingState !== 'idle'}
              className="p-3 mb-1 bg-stone-700 text-white rounded-full hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md transform active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-stone-400">
              AI simulace. Nenahrazuje odbornou péči. Odpovědi jsou generovány modelem.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel (Insight) */}
      <div className={`${showInsight ? 'w-80 lg:w-96 translate-x-0' : 'w-0 translate-x-full'} hidden md:block transition-all duration-300 ease-in-out`}>
         <InsightPanel 
           rationale={currentAiMessage?.rationale} 
           isVisible={true}
           isTyping={loadingState === 'streaming' && messages[messages.length - 1]?.role === 'model'}
         />
      </div>
      
      {/* Mobile Overlay Insight */}
      {showInsight && (
        <div className="md:hidden absolute inset-0 z-20 bg-black/20" onClick={() => setShowInsight(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm" onClick={e => e.stopPropagation()}>
              <InsightPanel 
                rationale={currentAiMessage?.rationale} 
                isVisible={true}
                isTyping={loadingState === 'streaming' && messages[messages.length - 1]?.role === 'model'}
              />
           </div>
        </div>
      )}

    </div>
  );
}