import React, { useState } from 'react';
import { Users, Plus, ArrowRight, UserCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSelectorProps {
  profiles: UserProfile[];
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (name: string) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelectProfile, onCreateProfile }) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      onCreateProfile(newProfileName.trim());
      setNewProfileName('');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-50 p-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="p-8 text-center bg-stone-800 text-stone-50">
          <div className="w-16 h-16 bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users size={32} className="text-sage-300" />
          </div>
          <h2 className="text-3xl font-serif font-medium mb-2">Klinika Duše</h2>
          <p className="text-stone-400 text-sm">Zabezpečený prostor pro psychoanalýzu</p>
        </div>

        <div className="p-6 md:p-8">
          <h3 className="text-lg font-medium text-stone-800 mb-4 font-serif">Kdo přichází na sezení?</h3>
          
          <div className="space-y-3 max-h-60 overflow-y-auto mb-6 pr-1 custom-scrollbar">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50 hover:bg-white hover:border-sage-300 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <UserCircle2 className="text-stone-400 group-hover:text-sage-600 transition-colors" size={24} />
                  <div>
                    <div className="font-medium text-stone-700 group-hover:text-stone-900">{profile.name}</div>
                    <div className="text-xs text-stone-400">
                      Poslední návštěva: {new Date(profile.lastActive).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-stone-300 group-hover:text-sage-600 transform group-hover:translate-x-1 transition-all" />
              </button>
            ))}

            {profiles.length === 0 && (
              <div className="text-center text-stone-400 py-4 italic text-sm">
                Zatím zde nejsou žádné záznamy.
              </div>
            )}
          </div>

          {isCreating ? (
            <form onSubmit={handleCreate} className="animate-in slide-in-from-bottom-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Jméno / Identifikátor"
                  autoFocus
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:outline-none text-stone-800 placeholder-stone-400"
                />
                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="bg-sage-600 hover:bg-sage-700 text-white px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vytvořit
                </button>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="text-xs text-stone-400 mt-2 hover:text-stone-600 underline"
              >
                Zrušit
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-500 font-medium hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nový klient
            </button>
          )}
        </div>
        
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 text-center">
            <p className="text-[10px] text-stone-400">
                Data jsou uložena pouze ve vašem prohlížeči. Každý profil má oddělenou historii.
            </p>
        </div>
      </div>
    </div>
  );
};