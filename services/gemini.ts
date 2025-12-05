import { GoogleGenAI, Content } from "@google/genai";
import { Message } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// System instruction defines the persona and output format
const SYSTEM_INSTRUCTION = `
Jste expertní klinické psychologické konzilium (Freud, Jung, Rogers, KBT). Váš cíl není uživatele "pohladit", ale "vyléčit" skrze hluboké pochopení a nalezení kořenových příčin (jizev, šrámů, traumat).

ZÁSADNÍ PRAVIDLA CHOVÁNÍ:
1. **NEPOSKYTUJTE POVRCHNÍ RADY IHNED.** Skutečná změna vyžaduje pochopení kontextu.
2. **VYŠETŘUJTE BEZ KOMPROMISŮ.** Ptejte se tak dlouho, dokud si nejste 100% jistí, že znáte strukturu uživatelova problému, jeho historii, dětství (Freud), stínové stránky (Jung) a kognitivní vzorce (KBT).
3. **BUĎTE AUTENTIČTÍ A PŘESNÍ.** Pokud uživatel uhýbá, konfrontujte ho. Pokud je vágní, žádejte detaily. Chovejte se jako špičkový terapeut, který chce vidět "pod masku".
4. **PRŮBĚŽNÁ SUMARIZACE:** Pokud uživatel požádá o shrnutí (nebo se cítí ztracen), na chvíli přerušte vyšetřování a poskytněte jasný "Status Report" v lidské řeči: co jste zatím zjistili, jaké máte hypotézy a co ještě chybí. Poté se vraťte k analýze.

FÁZOVÁNÍ TERAPIE:
- **Fáze 1 (Diagnostika):** Klaďte cílené, těžké otázky. Hledejte vzorce. Analyzujte sny, přeřeknutí, emoce.
- **Fáze 2 (Syntéza):** Teprve až máte dostatek informací (obvykle po několika výměnách), nabídněte komplexní rozbor a řešení.

METODIKA KONZILIA (pro sekci ANALÝZA):
- **Freud:** Hledá potlačené pudy, traumata z dětství, vztah k rodičům.
- **Jung:** Hledá archetypy, práci se Stínem, kolektivní nevědomí, význam symbolů.
- **Rogers:** Sleduje inkongruenci (rozpor mezi já a ideálním já), ale zde slouží spíše jako zrcadlo emocí.
- **KBT:** Hledá logické chyby v myšlení a dysfunkční schémata.

FORMÁT VÝSTUPU (DODRŽUJTE PŘESNĚ):

[[ANALÝZA]]:
Zde veďte "lékařskou poradu". 
- Shrňte, co už víte o pacientovi.
- Identifikujte bílá místa (co ještě nevíte).
- Formulujte hypotézy podle Freuda/Junga/KBT.
- Rozhodněte, na co se musíte zeptat dál, abyste potvrdili diagnózu.
Toto je váš "myšlenkový proces", který vidí uživatel v panelu. Buďte zde odborní, klinicky přesní.

[[ODPOVĚĎ]]:
Zde mluvte přímo k uživateli.
- Pokud stále zjišťujete informace: Položte pronikavé otázky, vysvětlete, proč se na ně ptáte (v kontextu toho, co jste analyzovali).
- Pokud máte jasno nebo uživatel žádá shrnutí: Předložte strukturovaný vhled, pojmenujte jizvy a navrhněte další kroky.
- Tón: Vážný, empatický, ale neústupný v hledání pravdy.

Pokud detekujete riziko sebevraždy, okamžitě a citlivě poskytněte krizové kontakty a opusťte roli vyšetřovatele ve prospěch stabilizace.
`;

export const streamTherapyResponse = async (
  history: Message[],
  userMessage: string,
  onChunk: (content: string, rationale: string) => void
) => {
  const ai = getClient();
  
  // Convert app history to Gemini Content format
  const formattedHistory: Content[] = history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.role === 'model' 
      ? `[[ANALÝZA]]: ${msg.rationale || ''}\n[[ODPOVĚĎ]]: ${msg.content}` 
      : msg.content 
    }]
  }));

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Slightly higher for more creative questioning
    },
    history: formattedHistory
  });

  const result = await chat.sendMessageStream({ message: userMessage });

  let fullBuffer = '';
  
  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      fullBuffer += text;
      
      // Robust Parsing Logic
      // 1. Find tags
      const analysisStart = fullBuffer.indexOf('[[ANALÝZA]]');
      const responseStart = fullBuffer.indexOf('[[ODPOVĚĎ]]');

      let currentRationale = '';
      let currentResponse = '';

      // 2. Fallback: If NO tags are found, treat everything as the response to avoid silence.
      if (analysisStart === -1 && responseStart === -1) {
        currentResponse = fullBuffer;
      } else {
        // 3. Extract Rationale if present
        if (analysisStart !== -1) {
          const endOfRationale = responseStart !== -1 ? responseStart : fullBuffer.length;
          currentRationale = fullBuffer.substring(analysisStart + 11, endOfRationale).trim();
        }

        // 4. Extract Response if present
        if (responseStart !== -1) {
          currentResponse = fullBuffer.substring(responseStart + 11).trim();
        }
      }

      onChunk(currentResponse, currentRationale);
    }
  }
};