import React from 'react';
import { BrainCircuit, Eye, Lock, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LoadingState } from '../types';

interface InsightPanelProps {
  rationale: string | undefined;
  isVisible: boolean;
  loadingState: LoadingState;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ rationale, isVisible, loadingState }) => {
  if (!isVisible) return null;

  const isThinking = loadingState === 'thinking';
  const isStreaming = loadingState === 'streaming';

  return (
    <div className="h-full flex flex-col bg-stone-100 border-l border-stone-200 w-full md:w-80 lg:w-96 shadow-inner overflow-hidden transition-all duration-300">
      <div className="p-4 border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-stone-700">
          {isThinking ? (
            <Loader2 className="animate-spin text-sage-600" size={20} />
          ) : (
            <BrainCircuit size={20} />
          )}
          <h3 className="font-serif font-medium">
            {isThinking ? 'Probíhá porada...' : 'Klinická diagnostika'}
          </h3>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {isThinking 
            ? 'Experti formulují hypotézy...' 
            : 'Interní záznam o stavu a hlubinná analýza pacienta.'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* State: Thinking (Loading) */}
        {isThinking && (
          <div className="animate-pulse space-y-4 p-2">
            <div className="h-4 bg-stone-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-stone-200 rounded"></div>
              <div className="h-3 bg-stone-200 rounded w-5/6"></div>
              <div className="h-3 bg-stone-200 rounded w-4/6"></div>
            </div>
            <div className="h-4 bg-stone-200 rounded w-1/2 mt-4"></div>
             <div className="space-y-2">
              <div className="h-3 bg-stone-200 rounded"></div>
              <div className="h-3 bg-stone-200 rounded w-5/6"></div>
            </div>
          </div>
        )}

        {/* State: Idle/Streaming but empty rationale */}
        {!isThinking && !rationale && (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center opacity-60">
            <Lock size={48} className="mb-4 text-stone-300" />
            <p className="text-sm">Diagnostický záznam se vytvoří během terapie.</p>
          </div>
        )}

        {/* State: Has content (Streaming or Done) */}
        {rationale && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-stone-700 text-sm leading-relaxed">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    <FileText size={12} />
                    <span>Záznam z konzilia</span>
                </div>
                <div className="prose prose-stone prose-sm max-w-none prose-headings:font-serif prose-headings:text-stone-800 prose-headings:text-base prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1">
                  <ReactMarkdown>{rationale}</ReactMarkdown>
                </div>
                {isStreaming && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-stone-400">
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};