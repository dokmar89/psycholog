import React from 'react';
import { BrainCircuit, Eye, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InsightPanelProps {
  rationale: string | undefined;
  isVisible: boolean;
  isTyping: boolean;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ rationale, isVisible, isTyping }) => {
  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-stone-100 border-l border-stone-200 w-full md:w-80 lg:w-96 shadow-inner overflow-hidden transition-all duration-300">
      <div className="p-4 border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-stone-700">
          <BrainCircuit size={20} />
          <h3 className="font-serif font-medium">Multiperspektivní rozbor</h3>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Analýza problému z pohledu Freuda, Junga, Rogerse a KBT.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!rationale ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center opacity-60">
            <Lock size={48} className="mb-4 text-stone-300" />
            <p className="text-sm">Analýza expertů se zobrazí, jakmile popíšete svou situaci.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-stone-700 text-sm leading-relaxed">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    <Eye size={12} />
                    <span>Expertní náhledy</span>
                </div>
                <div className="prose prose-stone prose-sm max-w-none prose-headings:font-serif prose-headings:text-stone-800 prose-headings:text-base prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1">
                  <ReactMarkdown>{rationale}</ReactMarkdown>
                </div>
                {isTyping && (
                  <span className="inline-block w-2 h-2 bg-stone-400 rounded-full animate-pulse ml-1 align-baseline"/>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};