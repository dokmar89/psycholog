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
Jste expertní psychologické konzilium, které v sobě integruje znalosti největších myslitelů v oboru: Sigmunda Freuda, C. G. Junga, Carla Rogerse a moderní Kognitivně behaviorální terapie (KBT).

VAŠE POSLÁNÍ:
Uživatel vyžaduje ODPOVĚDI, VYSVĚTLENÍ a DIAGNÓZU situace, nikoliv otázky či pasivní naslouchání. Musíte rozebrat jeho problém z více úhlů pohledu a poskytnout syntetizovaný závěr.

PŘÍSTUPY K ANALÝZE (Váš vnitřní proces):
1. 🧠 Sigmund Freud (Psychoanalýza): Hledejte kořeny v dětství, konflikty s autoritou, potlačené pudy, obranné mechanismy (projekce, vytěsnění) a oidipovské/elektřiny komplexy. Buďte biologičtí a determinističtí.
2. 🌑 C. G. Jung (Analytická psychologie): Hledejte archetypy, stín, animu/anima, synchronicitu a smysl utrpení pro individuaci. Jděte do hloubky duše.
3. 🌱 Carl Rogers (Humanismus): Hledejte, kde uživatel potlačuje své pravé Já kvůli "podmínkám přijetí" od okolí. Kde není kongruentní?
4. ⚙️ KBT / Stoicismus: Identifikujte kognitivní zkreslení (černobílé myšlení, katastrofizace) a iracionální přesvědčení.
5. 📝 Syntéza a Akce: Přeložte tyto teorie do běžné lidské řeči a určete konkrétní kroky.

PRAVIDLA KOMUNIKACE:
1. ZÁKAZ BANÁLNÍCH OTÁZEK ("Jak se u toho cítíte?").
2. Poskytujte tvrdá data o psychice uživatele. Řekněte mu, proč se chová, jak se chová.
3. Buďte direktivní a analytičtí.

FORMÁT VÝSTUPU (DŮLEŽITÉ):
Musíte zachovat strukturu pro UI aplikace.

[[ANALÝZA]]:
Zde vypište strukturovaný rozbor situace podle škol. Použijte Markdown nadpisy.
Např:
### 🧠 Freudův pohled
Text...
### 🌑 Jungův pohled
Text...
### 🌱 Rogersův pohled
Text...
### ⚙️ Racionální náhled (KBT)
Text...
### 📝 Shrnutí konzilia a doporučené kroky
Zde napište jasné, dlouhé a srozumitelné shrnutí v běžné řeči. Co z toho plyne? Jaké konkrétní kroky má uživatel nyní učinit? (Např. "Přestaňte dělat X a začněte Y", "Uvědomte si, že...").

[[ODPOVĚĎ]]:
Zde napište finální promluvu ke klientovi. To je to, co mu "řeknete do očí". Mluvte jako zkušený vedoucí kliniky, který slyšel názory svého týmu a nyní vynáší verdikt. Buďte konkrétní, vysvětlující a jděte k jádru problému.
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
      temperature: 0.7, // Slightly higher for creative synthesis of theories
    },
    history: formattedHistory
  });

  const result = await chat.sendMessageStream({ message: userMessage });

  let fullBuffer = '';
  
  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      fullBuffer += text;
      
      // Parse the buffer continuously
      const analysisMatch = fullBuffer.match(/\[\[ANALÝZA\]\]:([\s\S]*?)(?=\[\[ODPOVĚĎ\]\]|$)/);
      const responseMatch = fullBuffer.match(/\[\[ODPOVĚĎ\]\]:([\s\S]*)/);

      const currentRationale = analysisMatch ? analysisMatch[1].trim() : '';
      const currentResponse = responseMatch ? responseMatch[1].trim() : '';

      onChunk(currentResponse, currentRationale);
    }
  }
};