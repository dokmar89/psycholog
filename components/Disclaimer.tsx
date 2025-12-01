import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface DisclaimerProps {
  onAccept: () => void;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mb-4 text-sage-600">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-serif font-semibold text-stone-800">Vítejte v MindfulSpace</h2>
          <p className="text-stone-500 mt-2 text-sm">Realistická simulace terapie s umělou inteligencí</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div className="space-y-2 text-sm text-amber-900">
              <p className="font-semibold">Důležité upozornění:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Tato aplikace využívá umělou inteligenci a <strong>nenahrazuje</strong> odbornou lékařskou či psychologickou péči.</li>
                <li>AI může dělat chyby. Informace si ověřujte.</li>
                <li>Pokud prožíváte krizi nebo máte myšlenky na sebepoškozování, prosím okamžitě kontaktujte linku bezpečí (116 111) nebo vyhledejte lékaře.</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onAccept}
          className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg transform active:scale-95"
        >
          Rozumím a chci pokračovat
        </button>
      </div>
    </div>
  );
};