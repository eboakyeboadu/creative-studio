import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Play, Square, Loader2, Download, Languages, Sparkles, Globe, Settings, Cpu, Key, AlertCircle, User, Search, Sliders, Music, Headphones, Filter, RefreshCw, Check, X } from 'lucide-react';
import { detectLanguage } from '@/services/geminiService';
import { generateStudioSpeech, generateElevenLabsSpeech, validateElevenLabsApiKey, getElevenLabsVoices, getElevenLabsModels, TTSEngine } from '@/services/ttsService';

export interface StudioVoice {
  id: string;
  name: string;
  style: string;
  gender: 'Female' | 'Male';
  pitch: string;
  description: string;
  sampleText: string;
}

export const STUDIO_VOICES: StudioVoice[] = [
  // Female Voices
  { 
    id: 'Kore', 
    name: 'Kore', 
    style: 'Clear, Professional & Executive', 
    gender: 'Female', 
    pitch: 'Medium-High', 
    description: 'Articulate and polished tone, ideal for corporate presentations, news, and explainer videos.',
    sampleText: 'Hello, I am Kore. I deliver clear and articulate voiceovers for your professional needs.'
  },
  { 
    id: 'Aoede', 
    name: 'Aoede', 
    style: 'Soothing, Warm & Conversational', 
    gender: 'Female', 
    pitch: 'Warm Alto', 
    description: 'Gentle and reassuring tone perfect for audiobooks, podcasts, and relaxation content.',
    sampleText: 'Welcome. I am Aoede. My voice is warm, calm, and soothing.'
  },
  { 
    id: 'Zephyr', 
    name: 'Zephyr', 
    style: 'Bright, Vibrant & Energetic', 
    gender: 'Female', 
    pitch: 'Soprano', 
    description: 'Upbeat and cheerful voice for marketing, app walkthroughs, and social media shorts.',
    sampleText: 'Hi there! I am Zephyr, bringing high energy and crystal clarity to your content.'
  },
  { 
    id: 'Ursa', 
    name: 'Ursa', 
    style: 'Deep, Confident & Grounded', 
    gender: 'Female', 
    pitch: 'Deep Contralto', 
    description: 'Commanding and confident female voice suited for documentaries, training, and tutorials.',
    sampleText: 'Greetings. I am Ursa, offering a grounded and confident narrative.'
  },

  // Male Voices
  { 
    id: 'Charon', 
    name: 'Charon', 
    style: 'Deep, Authoritative & Serious', 
    gender: 'Male', 
    pitch: 'Deep Bass', 
    description: 'Resonant and powerful bass voice for movie trailers, keynotes, and announcements.',
    sampleText: 'This is Charon. Experience deep, authoritative, and impactful voiceovers.'
  },
  { 
    id: 'Fenrir', 
    name: 'Fenrir', 
    style: 'Strong, Bold & Intense', 
    gender: 'Male', 
    pitch: 'Low Baritone', 
    description: 'Intense and dramatic voice for action trailers, sports, and gaming characters.',
    sampleText: 'I am Fenrir. Bold, intense, and unyielding.'
  },
  { 
    id: 'Puck', 
    name: 'Puck', 
    style: 'Upbeat, Youthful & Friendly', 
    gender: 'Male', 
    pitch: 'High Tenor', 
    description: 'Friendly, youthful tenor voice for casual dialogue, gaming, and commercials.',
    sampleText: 'Hey there! I am Puck, ready for upbeat and fun voiceovers!'
  },
];

export const SUPPORTED_LANGUAGES = [
  { id: 'Auto', name: 'Auto-Detect Language' },
  { id: 'English', name: 'English (US/UK)' },
  { id: 'Spanish', name: 'Spanish / Español' },
  { id: 'French', name: 'French / Français' },
  { id: 'German', name: 'German / Deutsch' },
  { id: 'Portuguese', name: 'Portuguese / Português' },
  { id: 'Arabic', name: 'Arabic / العربية' },
  { id: 'Russian', name: 'Russian / Русский' },
  { id: 'Chinese', name: 'Chinese / 中文' },
  { id: 'Japanese', name: 'Japanese / 日本語' },
  { id: 'Hindi', name: 'Hindi / हिन्दी' },
  { id: 'Italian', name: 'Italian / Italiano' },
];

export const MULTILINGUAL_SAMPLE_TEXTS: Record<string, Record<string, string>> = {
  English: {
    Kore: "Hello, I am Kore. I deliver clear and articulate voiceovers for your professional needs.",
    Aoede: "Welcome. I am Aoede. My voice is warm, calm, and soothing.",
    Zephyr: "Hi there! I am Zephyr, bringing high energy and crystal clarity to your content.",
    Ursa: "Greetings. I am Ursa, offering a grounded and confident narrative.",
    Callisto: "Once upon a time. I am Callisto, crafting rich stories for you.",
    Leda: "Breathe in deeply. I am Leda, bringing peace and tranquility.",
    Charon: "This is Charon. Experience deep, authoritative, and impactful voiceovers.",
    Fenrir: "I am Fenrir. Bold, intense, and unyielding.",
    Hyperion: "Hello. I am Hyperion, your steady and reliable narrator.",
    Atlas: "Welcome to the lesson. I am Atlas, delivering clear and precise information.",
    Orpheus: "Greetings! I am Orpheus, bringing melodious warmth to speech.",
    Puck: "Hey there! I am Puck, ready for upbeat and fun voiceovers!"
  },
  Spanish: {
    Kore: "Hola, soy Kore. Ofrezco locuciones claras y articuladas para tus necesidades profesionales.",
    Aoede: "Bienvenido. Soy Aoede. Mi voz es cálida, serena y envolvente.",
    Zephyr: "¡Hola! Soy Zephyr, aportando gran energía y máxima claridad a tu contenido.",
    Ursa: "Saludos. Soy Ursa, ofreciendo una narrativa firme y con total confianza.",
    Callisto: "Érase una vez. Soy Callisto, creando historias cautivadoras para ti.",
    Leda: "Respira profundamente. Soy Leda, brindándote paz y tranquilidad.",
    Charon: "Habla Charon. Experimenta locuciones profundas, autoritarias e impactantes.",
    Fenrir: "Soy Fenrir. Audaz, intenso y decidido.",
    Hyperion: "Hola. Soy Hyperion, tu narrador constante y confiable.",
    Atlas: "Bienvenido a la lección. Soy Atlas, ofreciendo información clara y precisa.",
    Orpheus: "¡Saludos! Soy Orpheus, aportando calidez melódica a cada palabra.",
    Puck: "¡Hola a todos! ¡Soy Puck, listo para dar vida a tus proyectos de forma divertida!"
  },
  French: {
    Kore: "Bonjour, je suis Kore. Je propose une narration claire et professionnelle pour vos projets.",
    Aoede: "Bienvenue. Je suis Aoede. Ma voix est chaleureuse, calme et apaisante.",
    Zephyr: "Salut ! Je suis Zephyr, apportant une grande énergie et une clarté cristalline.",
    Ursa: "Salutations. Je suis Ursa, offrant une voix posée et confiante.",
    Callisto: "Il était une fois. Je suis Callisto, racontant de magnifiques histoires.",
    Leda: "Inspirez profondément. Je suis Leda, apportant paix et sérénité.",
    Charon: "Ici Charon. Découvrez des voix off profondes, puissantes et captivantes.",
    Fenrir: "Je suis Fenrir. Audacieux, intense et passionné.",
    Hyperion: "Bonjour. Je suis Hyperion, votre narrateur fidèle et rassurant.",
    Atlas: "Bienvenue. Je suis Atlas, transmettant des informations précises et structurées.",
    Orpheus: "Salutations ! Je suis Orpheus, apportant une douceur mélodique à vos textes.",
    Puck: "Salut tout le monde ! Je suis Puck, prêt pour des doublages vivants et dynamiques !"
  },
  German: {
    Kore: "Hallo, ich bin Kore. Ich liefere präzise und professionelle Sprachaufnahmen.",
    Aoede: "Willkommen. Ich bin Aoede. Meine Stimme ist warm, beruhigend und angenehm.",
    Zephyr: "Hallo! Ich bin Zephyr und bringe Frische und Dynamik in Ihre Inhalte.",
    Ursa: "Seien Sie gegrüßt. Ich bin Ursa mit einer starken und selbstbewussten Stimme.",
    Callisto: "Es war einmal. Ich bin Callisto und erzähle faszinierende Geschichten.",
    Leda: "Atmen Sie tief ein. Ich bin Leda und sorge für Entspannung und Ruhe.",
    Charon: "Hier ist Charon. Erleben Sie tiefe, eindrucksvolle und kraftvolle Stimmen.",
    Fenrir: "Ich bin Fenrir. Mutig, intensiv und dynamisch.",
    Hyperion: "Guten Tag. Ich bin Hyperion, Ihr zuverlässiger und klarer Sprecher.",
    Atlas: "Willkommen zum Kurs. Ich bin Atlas und vermittle Wissen präzise und verständlich.",
    Orpheus: "Herzliche Grüße! Ich bin Orpheus und verleihe Worten musikalische Wärme.",
    Puck: "Hi! Ich bin Puck, bereit für mitreißende und unterhaltsame Sprachaufnahmen!"
  },
  Portuguese: {
    Kore: "Olá, sou Kore. Ofereço locuções claras e profissionais para as suas necessidades.",
    Aoede: "Bem-vindo. Sou Aoede. A minha voz é acolhedora, calma e serena.",
    Zephyr: "Olá! Sou Zephyr, trazendo grande energia e clareza para o seu conteúdo.",
    Ursa: "Saudações. Sou Ursa, oferecendo uma narrativa firme e confiante.",
    Callisto: "Era uma vez. Sou Callisto, criando histórias envolventes para você.",
    Leda: "Respire fundo. Sou Leda, trazendo paz e tranquilidade.",
    Charon: "Aqui fala Charon. Experimente locuções profundas, marcantes e impactantes.",
    Fenrir: "Sou Fenrir. Corajoso, intenso e marcante.",
    Hyperion: "Olá. Sou Hyperion, o seu narrador firme e confiável.",
    Atlas: "Bem-vindo à lição. Sou Atlas, transmitindo informações de forma clara.",
    Orpheus: "Saudações! Sou Orpheus, trazendo um tom melodioso e caloroso.",
    Puck: "Olá a todos! Sou o Puck, pronto para gravações divertidas e animadas!"
  },
  Arabic: {
    Kore: "مرحباً، أنا كور. أقدم تعليقاً صوتياً واضحاً ومحترفاً لكافة أعمالك.",
    Aoede: "أهلاً بك. أنا أويدي. صوتی دافئ، هادئ ومريح للمستمع.",
    Zephyr: "مرحباً! أنا زيفير، أضفي طاقة عالية ووضوحاً تاماً على محتواك.",
    Ursa: "تحياتي. أنا أورسا، أقدم سرد صوتی قوياً وواثقاً.",
    Callisto: "كان يا ما كان. أنا كاليستو، أسرد لك أجمل القصص.",
    Leda: "تنفس ببطء. أنا ليدا، أمنحك السلام والهدوء.",
    Charon: "معكم شارون. استمع إلى تعليق صوتي عميق وقوي ومؤثر.",
    Fenrir: "أنا فنرير. قوي، حماسي وجريء.",
    Hyperion: "أهلاً. أنا هايبريون، راويك الصادق والموثوق.",
    Atlas: "أهلاً بك في الدرس. أنا أطلس، أقدم المعلومات بوضوح ودقة.",
    Orpheus: "تحياتي الطيبة! أنا أورفيوس، أضفي نبرة موسيقية دافئة.",
    Puck: "أهلاً بالجميع! أناباك، مستعد لأداء صوتي حماسي وممتع!"
  },
  Russian: {
    Kore: "Здравствуйте, я Коре. Я предоставляю четкий и профессиональный дикторский голос.",
    Aoede: "Добро пожаловать. Я Аэда. Мой голос теплый, спокойный и умиротворяющий.",
    Zephyr: "Привет! Я Зефир, добавляю яркую энергию и чистоту вашему контенту.",
    Ursa: "Приветствую. Я Урса, предлагаю уверенное и глубокое повествование.",
    Callisto: "Однажды в сказке. Я Каллисто, создаю захватывающие истории.",
    Leda: "Сделайте глубокий вдох. Я Леда, приношу покой и гармонию.",
    Charon: "На связи Харон. Оцените глубокий, солидный и впечатляющий голос.",
    Fenrir: "Я Фенрир. Смелый, яркий и решительный.",
    Hyperion: "Здравствуйте. Я Гиперион, ваш надежный и уверенный диктор.",
    Atlas: "Добро пожаловать на урок. Я Атлас, подаю информацию четко и понятно.",
    Orpheus: "Приветствую! Я Орфей, дарю мелодичное тепло каждому слову.",
    Puck: "Всем привет! Я Пак, готов к веселой и динамичной озвучке!"
  },
  Chinese: {
    Kore: "你好，我是 Kore。我为您提供清晰专业的声音朗读服务。",
    Aoede: "欢迎。我是 Aoede。我的声音温和、平静且让人舒心。",
    Zephyr: "你好！我是 Zephyr，为您的内容注入满满的高能与活力。",
    Ursa: "您好。我是 Ursa，提供沉稳、自信且富有力量的解说。",
    Callisto: "从前有个人。我是 Callisto，为您讲述动听的精彩故事。",
    Leda: "深呼吸。我是 Leda，带给您宁静与和平的体验。",
    Charon: "我是 Charon。体验浑厚、震撼且极具权威感的旁白声音。",
    Fenrir: "我是 Fenrir。充满力量、激情与坚定的意志。",
    Hyperion: "你好。我是 Hyperion，您稳定可靠的专业旁白主播。",
    Atlas: "欢迎来到课堂。我是 Atlas，为您清晰准确地传授知识。",
    Orpheus: "您好！我是 Orpheus，为文字赋予如音乐般温暖的韵律。",
    Puck: "嗨！我是 Puck，随时准备为您呈现风趣幽默的精彩配音！"
  },
  Japanese: {
    Kore: "こんにちは、Koreです。プロフェッショナルでクリアなナレーションをお届けします。",
    Aoede: "ようこそ。Aoedeです。温かく落ち着いた声でお包みします。",
    Zephyr: "こんにちは！Zephyrです。明るく元気なエネルギーをお届けします。",
    Ursa: "ご挨拶申し上げます。Ursaです。力強く信頼のおける語りを提供します。",
    Callisto: "昔々あるところに。Callistoです。魅力的な物語をお届けします。",
    Leda: "深呼吸してください。Ledaです。安らぎと平和をお届けします。",
    Charon: "Charonです。重厚で説得力のあるディープボイスをご体感ください。",
    Fenrir: "Fenrirです。情熱的でインパクトのある声をお届けします。",
    Hyperion: "こんにちは。Hyperionです。安心感のある信頼のナレーションです。",
    Atlas: "レッスンへようこそ。Atlasです。分かりやすく正確な情報をお伝えします。",
    Orpheus: "こんにちは！Orpheusです。心地よい温かみのある声をお届けします。",
    Puck: "やあ！Puckだよ！楽しくて活気のある音声をお任せください！"
  },
  Italian: {
    Kore: "Ciao, sono Kore. Offro doppiaggi chiari e professionali per ogni tua esigenza.",
    Aoede: "Benvenuto. Sono Aoede. La mia voce è calda, rilassante e rassicurante.",
    Zephyr: "Ciao! Sono Zephyr, porto grande energia e massima chiarezza ai tuoi contenuti.",
    Ursa: "Saluti. Sono Ursa, offro una narrazione profonda e sicura.",
    Callisto: "C'era una volta. Sono Callisto, creo storie affascinanti per te.",
    Leda: "Fai un respiro profondo. Sono Leda, porto pace e tranquillidade.",
    Charon: "Qui parla Charon. Sperimenta doppiaggi profondi e d'impatto.",
    Fenrir: "Sono Fenrir. Forte, intenso e deciso.",
    Hyperion: "Ciao. Sono Hyperion, il tuo narratore affidabile.",
    Atlas: "Benvenuto alla lezione. Sono Atlas, trasmetto informazioni chiare.",
    Orpheus: "Saluti! Sono Orpheus, porto calore melodico alle tue parole.",
    Puck: "Ciao a tutti! Sono Puck, pronto per doppiaggi divertenti e vivaci!"
  }
};

export default function TTSView({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [text, setText] = useState('');
  const [engine, setEngine] = useState<TTSEngine>('studio');
  const [voice, setVoice] = useState('Kore');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('Auto');
  const [searchQuery, setSearchQuery] = useState('');

  // Web Speech API states
  const [webSpeechVoices, setWebSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechRate, setSpeechRate] = useState(1.0);

  // ElevenLabs states
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [elevenLabsModels, setElevenLabsModels] = useState<any[]>([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('eleven_multilingual_v2');
  const [isLoadingElevenLabs, setIsLoadingElevenLabs] = useState(false);
  const [elevenLabsError, setElevenLabsError] = useState<string | null>(null);

  // Settings panel draft states
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [draftEngine, setDraftEngine] = useState<TTSEngine>('studio');
  const [draftVoice, setDraftVoice] = useState('Kore');
  const [draftSelectedModel, setDraftSelectedModel] = useState<string>('eleven_multilingual_v2');

  // Generation & Audio Playback states
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Voice Preview states
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setWebSpeechVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (showSettings) {
      setDraftEngine(engine);
      setDraftVoice(voice);
      setDraftSelectedModel(selectedModel);
    }
  }, [showSettings, engine, voice, selectedModel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showSettings && settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('.settings-toggle-btn')) return;
        if (target.closest('[role="dialog"]') || target.closest('[role="listbox"]') || target.closest('[data-radix-popper-content-wrapper]') || target.closest('[data-radix-select-viewport]')) return;
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  useEffect(() => {
    const savedKey = localStorage.getItem('elevenlabs_api_key');
    if (savedKey) {
      setElevenLabsApiKey(savedKey);
      setIsApiKeySaved(true);
      loadElevenLabsData(savedKey);
    }
  }, []);

  const loadElevenLabsData = async (apiKey: string) => {
    setIsLoadingElevenLabs(true);
    setElevenLabsError(null);
    try {
      const models = await getElevenLabsModels(apiKey);
      const voices = await getElevenLabsVoices(apiKey);
      if (models.length > 0) setElevenLabsModels(models.filter(m => m.can_do_text_to_speech));
      if (voices.length > 0) {
        setElevenLabsVoices(voices);
        setVoice((prevVoice) => {
          if (!voices.some(v => v.voice_id === prevVoice)) {
            return voices[0].voice_id;
          }
          return prevVoice;
        });
      } else {
        setElevenLabsError("No voices found. Please check your API key.");
      }
    } catch (err: any) {
      console.error(err);
      setElevenLabsError(err.message || "Failed to fetch voices.");
    } finally {
      setIsLoadingElevenLabs(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (elevenLabsApiKey) {
      setIsValidatingKey(true);
      setApiKeyError(null);
      try {
        const isValid = await validateElevenLabsApiKey(elevenLabsApiKey);
        if (isValid) {
          localStorage.setItem('elevenlabs_api_key', elevenLabsApiKey);
          setIsApiKeySaved(true);
          loadElevenLabsData(elevenLabsApiKey);
        } else {
          setApiKeyError("Invalid API Key. Please check and try again.");
          setIsApiKeySaved(false);
        }
      } catch (err) {
        setApiKeyError("Validation failed. Check your connection.");
      } finally {
        setIsValidatingKey(false);
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      setGlobalError(null);
      if (text.trim().length > 5) {
        setIsDetecting(true);
        try {
          const lang = await detectLanguage(text);
          setDetectedLanguage(lang);
        } catch (e: any) {
          console.error('Failed to detect language', e);
          if (e.message?.includes('API_KEY_INVALID') || e.message?.includes('API key not valid')) {
             setGlobalError("Your API Key is invalid. Please update GEMINI_API_KEY in your environment.");
          }
        } finally {
          setIsDetecting(false);
        }
      } else {
        setDetectedLanguage(null);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [text]);

  const getResolvedLanguage = (): string => {
    if (languageFilter !== 'Auto') return languageFilter;
    if (detectedLanguage) {
      const lower = detectedLanguage.toLowerCase();
      if (lower.includes('french') || lower.includes('français')) return 'French';
      if (lower.includes('spanish') || lower.includes('español')) return 'Spanish';
      if (lower.includes('german') || lower.includes('deutsch')) return 'German';
      if (lower.includes('portuguese') || lower.includes('português')) return 'Portuguese';
      if (lower.includes('arabic') || lower.includes('عرب')) return 'Arabic';
      if (lower.includes('russian') || lower.includes('рус')) return 'Russian';
      if (lower.includes('chinese') || lower.includes('中文')) return 'Chinese';
      if (lower.includes('japanese') || lower.includes('日本')) return 'Japanese';
      if (lower.includes('hindi') || lower.includes('हिन्द')) return 'Hindi';
      if (lower.includes('italian') || lower.includes('italiano')) return 'Italian';
      if (lower.includes('english')) return 'English';
    }
    return 'English';
  };

  const activeLanguage = getResolvedLanguage();

  const handlePreviewVoice = async (voiceItem: StudioVoice, sampleTextOverride?: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    if (previewingVoiceId === voiceItem.id) {
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voiceItem.id);
    const sampleToSpeak = sampleTextOverride || MULTILINGUAL_SAMPLE_TEXTS[activeLanguage]?.[voiceItem.id] || voiceItem.sampleText;

    try {
      const base64Audio = await generateStudioSpeech(sampleToSpeak, voiceItem.id);
      
      const binary = atob(base64Audio);
      const pcmData = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        pcmData[i] = binary.charCodeAt(i);
      }
      
      const sampleRate = 24000;
      const numChannels = 1;
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
      
      const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + pcmData.length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, pcmData.length, true);

      const blob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewingVoiceId(null);
      audio.onerror = () => setPreviewingVoiceId(null);
      await audio.play();
    } catch (err: any) {
      console.warn("Preview notice:", err);
      setPreviewingVoiceId(null);
      const errMsg = err?.message || '';
      if (errMsg.includes('rate limit') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        setGlobalError("Gemini Voice API daily preview quota reached. Switch to the browser Web Speech Engine above for free instant previews!");
      } else {
        setGlobalError(err?.message || "Voice preview unavailable.");
      }
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setAudioUrl(null);
    setGlobalError(null);

    try {
      if (engine === 'studio') {
        const base64Audio = await generateStudioSpeech(text, voice);
        
        const binary = atob(base64Audio);
        const pcmData = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          pcmData[i] = binary.charCodeAt(i);
        }
        
        const sampleRate = 24000;
        const numChannels = 1;
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        
        const writeString = (view: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + pcmData.length, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, pcmData.length, true);

        const blob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else if (engine === 'webspeech') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const selectedWebVoice = webSpeechVoices.find(v => v.name === voice);
          if (selectedWebVoice) utterance.voice = selectedWebVoice;
          utterance.pitch = speechPitch;
          utterance.rate = speechRate;
          
          utterance.onstart = () => {
            setIsPlaying(true);
            setIsGenerating(false);
          };
          utterance.onend = () => {
            setIsPlaying(false);
          };
          utterance.onerror = (e) => {
            console.error("WebSpeech error", e);
            setIsPlaying(false);
            setIsGenerating(false);
          };

          window.speechSynthesis.speak(utterance);
          return;
        } else {
          throw new Error("Web Speech API is not supported in this browser.");
        }
      } else {
        if (!elevenLabsApiKey) {
          setShowSettings(true);
          setGlobalError("ElevenLabs API Key is required. Please set it in settings.");
          return;
        }
        const audioBuffer = await generateElevenLabsSpeech(text, voice, {
          apiKey: elevenLabsApiKey,
          modelId: selectedModel
        });
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (error: any) {
      console.warn('Speech generation notice:', error);
      const errMsg = error.message || '';
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
        setGlobalError("Your Gemini API Key is invalid. Please update GEMINI_API_KEY in your environment.");
      } else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        setGlobalError("Gemini Voice API daily preview quota reached. Switch to the Web Speech Engine or ElevenLabs above for instant generation!");
      } else {
        setGlobalError(errMsg || "Failed to generate speech. Please try again.");
      }
    } finally {
      if (engine !== 'webspeech') {
        setIsGenerating(false);
      }
    }
  };

  const togglePlay = () => {
    if (engine === 'webspeech') {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          handleGenerate();
        }
      }
      return;
    }

    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `speech_${new Date().getTime()}.wav`;
    a.click();
  };

  // Helper function to identify gender for ElevenLabs or WebSpeech voices
  const inferGenderFromVoiceName = (name: string, labels?: any): 'Female' | 'Male' | 'Other' => {
    if (labels?.gender) {
      const g = String(labels.gender).toLowerCase();
      if (g.includes('female') || g.includes('woman')) return 'Female';
      if (g.includes('male') || g.includes('man')) return 'Male';
    }
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes('female') || lowerName.includes('woman') || lowerName.includes('girl') ||
      lowerName.includes('samantha') || lowerName.includes('victoria') || lowerName.includes('karen') ||
      lowerName.includes('zira') || lowerName.includes('rachel') || lowerName.includes('bella') ||
      lowerName.includes('elli') || lowerName.includes('gigi') || lowerName.includes('domi') ||
      lowerName.includes('charlotte') || lowerName.includes('freya')
    ) {
      return 'Female';
    }
    if (
      lowerName.includes('male') || lowerName.includes('man') || lowerName.includes('boy') ||
      lowerName.includes('david') || lowerName.includes('mark') || lowerName.includes('daniel') ||
      lowerName.includes('george') || lowerName.includes('adam') || lowerName.includes('antoni') ||
      lowerName.includes('arnold') || lowerName.includes('callum') || lowerName.includes('charlie') ||
      lowerName.includes('clyde') || lowerName.includes('ethan') || lowerName.includes('fin') ||
      lowerName.includes('james') || lowerName.includes('joseph') || lowerName.includes('liam') ||
      lowerName.includes('michael') || lowerName.includes('paul') || lowerName.includes('thomas')
    ) {
      return 'Male';
    }
    return 'Other';
  };

  // Filtered voice lists
  const filteredStudioVoices = STUDIO_VOICES.filter(v => {
    const matchesGender = genderFilter === 'All' || v.gender === genderFilter;
    const matchesSearch = !searchQuery.trim() || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGender && matchesSearch;
  });

  const filteredWebSpeechVoices = webSpeechVoices.filter(v => {
    const gender = inferGenderFromVoiceName(v.name);
    const matchesGender = genderFilter === 'All' || gender === genderFilter || (genderFilter === 'Male' && gender === 'Other');
    const matchesSearch = !searchQuery.trim() || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.lang.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGender && matchesSearch;
  });

  const filteredElevenLabsVoices = elevenLabsVoices.filter(v => {
    const gender = inferGenderFromVoiceName(v.name, v.labels);
    const matchesGender = genderFilter === 'All' || gender === genderFilter;
    const matchesSearch = !searchQuery.trim() || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.labels?.accent && v.labels.accent.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGender && matchesSearch;
  });

  return (
    <div className={isEmbedded ? "w-full" : "flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl relative shadow-2xl"}>
      <section className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {!isEmbedded && (
        <header className="px-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading text-foreground">
                  Text to Speech Studio
                </h2>
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">
                 Generate natural, expressive voices with rich gender options and precise audio controls.
              </p>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="settings-toggle-btn h-8 rounded-xl px-2 md:px-4 gap-1 md:gap-2 font-black uppercase tracking-widest text-[10px] border-primary/20 hover:border-primary/40 bg-background/50"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="hidden md:inline">{showSettings ? "Close Settings" : "Engine Settings"}</span>
            </Button>
          </div>
        </header>
        )}

        <div className={isEmbedded ? "" : "flex-1 overflow-y-auto p-4 md:p-8"}>
          <div className={isEmbedded ? "w-full space-y-8" : "max-w-4xl mx-auto w-full space-y-8"}>

        {globalError && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               {globalError}
            </div>
          </div>
        )}

        {showSettings && (
          <Card ref={settingsRef} className="border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-300 relative z-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> Speech Engine Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Provider Engine</label>
                  <Select value={draftEngine} onValueChange={(val) => {
                    const newEngine = val as TTSEngine;
                    setDraftEngine(newEngine);
                    if (newEngine === 'studio') {
                      setDraftVoice('Kore');
                    } else if (newEngine === 'webspeech') {
                      setDraftVoice(webSpeechVoices.length > 0 ? webSpeechVoices[0].name : '');
                    } else {
                      setDraftVoice(elevenLabsVoices.length > 0 ? elevenLabsVoices[0].voice_id : 'none');
                    }
                  }}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">AI Voice Studio (Gemini Models)</SelectItem>
                      <SelectItem value="webspeech">Browser Web Speech API (Free & Instant)</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs Studio (Premium Voices)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {draftEngine === 'elevenlabs' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      ElevenLabs API Key
                      <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline italic normal-case tracking-normal">Get Key</a>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          type="password" 
                          placeholder="Paste your xi-api-key" 
                          className="bg-background pr-10 rounded-lg shadow-sm focus-visible:ring-primary/20"
                          value={elevenLabsApiKey}
                          onChange={(e) => {
                            setElevenLabsApiKey(e.target.value);
                            setIsApiKeySaved(false);
                          }}
                        />
                        <Key className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <Button 
                        size="sm" 
                        variant={isApiKeySaved ? "secondary" : "default"}
                        className="rounded-lg px-4 font-medium transition-all"
                        onClick={handleSaveApiKey}
                        disabled={!elevenLabsApiKey || isApiKeySaved || isValidatingKey}
                      >
                        {isValidatingKey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isApiKeySaved ? (
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Saved</span>
                        ) : "Save"}
                      </Button>
                    </div>
                    {apiKeyError && (
                      <p className="text-[10px] text-red-500 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                        {apiKeyError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {draftEngine === 'elevenlabs' && elevenLabsApiKey && elevenLabsModels.length > 0 && (
                <div className="space-y-1.5 mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Model</label>
                  <Select value={draftSelectedModel} onValueChange={setDraftSelectedModel}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {elevenLabsModels.map(model => (
                        <SelectItem key={model.model_id} value={model.model_id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-primary/10 mt-4">
                <Button
                  size="sm"
                  className="font-semibold uppercase tracking-widest text-[10px] rounded-lg"
                  onClick={() => {
                    setEngine(draftEngine);
                    setVoice(draftVoice);
                    setSelectedModel(draftSelectedModel);
                    setShowSettings(false);
                  }}
                >
                  Save and apply
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="premium-card">
          <CardHeader className={isEmbedded ? "flex flex-row items-start justify-between space-y-0 pb-4" : ""}>
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" /> Audio Synthesis Engine
              </CardTitle>
              <CardDescription>
                Select a voice actor, customize gender or pitch, and convert multi-lingual text into studio-grade speech.
              </CardDescription>
            </div>
            {isEmbedded && (
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="settings-toggle-btn h-8 rounded-xl px-2 md:px-4 gap-1 md:gap-2 font-black uppercase tracking-widest text-[10px] border-primary/20 hover:border-primary/40 bg-background/50"
                 onClick={() => setShowSettings(!showSettings)}
               >
                 <Settings className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                 <span className="hidden md:inline">{showSettings ? "Close Settings" : "Engine Settings"}</span>
               </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Error / Quota Alert Banner */}
            {globalError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />
                  <span className="font-medium leading-relaxed">{globalError}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {(globalError.includes("quota") || globalError.includes("limit") || globalError.includes("429")) && engine === 'studio' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold bg-background hover:bg-secondary border-primary/30 text-foreground"
                      onClick={() => {
                        setEngine('webspeech');
                        if (webSpeechVoices.length > 0) setVoice(webSpeechVoices[0].name);
                        setGlobalError(null);
                      }}
                    >
                      <Volume2 className="w-3.5 h-3.5 mr-1 text-primary" /> Switch to Browser Engine
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => setGlobalError(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Input Text Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Languages className="w-4 h-4 text-primary" /> Script / Input Text
                </label>
                {(detectedLanguage || isDetecting) && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md animate-in fade-in duration-300">
                    <Globe className="w-3.5 h-3.5" />
                    {isDetecting ? (
                      <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Detecting...</span>
                    ) : (
                      <span>Detected: <span className="text-foreground font-bold">{detectedLanguage}</span></span>
                    )}
                  </div>
                )}
              </div>
              <Textarea 
                placeholder="Enter the text you want to convert into audio... Supports English, French, Spanish, German, Portuguese, and 50+ languages."
                className="min-h-[140px] resize-none bg-background/50 border-white/10 text-base rounded-xl p-4 shadow-inner focus-visible:ring-primary/30"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Voice Engine Toolbar & Filters */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voice Filter:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Language Selector Dropdown */}
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="h-8 text-xs bg-background/80 border-border/50 rounded-lg min-w-[160px]">
                      <Globe className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id} className="text-xs">
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Gender Tabs */}
                  <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40">
                    {(['All', 'Female', 'Male'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGenderFilter(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          genderFilter === g 
                            ? 'bg-background text-foreground shadow-sm font-bold border border-border/50' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <User className={`w-3.5 h-3.5 ${g === 'Female' ? 'text-pink-500' : g === 'Male' ? 'text-blue-500' : 'text-primary'}`} />
                        {g === 'All' ? 'All' : g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Bar for Voices */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search voices by name, style, tone, or accent..."
                  className="pl-9 bg-background/60 text-xs rounded-xl h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Voice Selector Dropdown */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" /> Active Voice Model ({engine === 'studio' ? 'Studio AI' : engine === 'webspeech' ? 'Browser WebSpeech' : 'ElevenLabs'})
                </span>
                <span className="text-[10px] text-muted-foreground italic font-normal">
                  {engine === 'studio' ? `${filteredStudioVoices.length} voices available` : engine === 'webspeech' ? `${filteredWebSpeechVoices.length} system voices` : `${filteredElevenLabsVoices.length} voices`}
                </span>
              </label>

              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="w-full bg-background/50 border-white/10 rounded-xl h-12">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {engine === 'studio' ? (
                    <>
                      {genderFilter !== 'Male' && (
                        <SelectGroup>
                          <SelectLabel className="text-xs font-bold uppercase tracking-widest text-pink-500 flex items-center gap-1.5 py-2">
                            <User className="w-3.5 h-3.5" /> Female Voices ({STUDIO_VOICES.filter(v => v.gender === 'Female').length})
                          </SelectLabel>
                          {filteredStudioVoices.filter(v => v.gender === 'Female').map((v) => (
                            <SelectItem key={v.id} value={v.id} className="py-2">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="font-semibold">{v.name}</span>
                                <span className="text-xs text-muted-foreground italic">— {v.style}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {genderFilter !== 'Female' && (
                        <SelectGroup>
                          <SelectLabel className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1.5 py-2 mt-2">
                            <User className="w-3.5 h-3.5" /> Male Voices ({STUDIO_VOICES.filter(v => v.gender === 'Male').length})
                          </SelectLabel>
                          {filteredStudioVoices.filter(v => v.gender === 'Male').map((v) => (
                            <SelectItem key={v.id} value={v.id} className="py-2">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="font-semibold">{v.name}</span>
                                <span className="text-xs text-muted-foreground italic">— {v.style}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </>
                  ) : engine === 'webspeech' ? (
                    <SelectGroup>
                      <SelectLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground py-2">System Web Speech Voices</SelectLabel>
                      {filteredWebSpeechVoices.length > 0 ? (
                        filteredWebSpeechVoices.map((v) => (
                          <SelectItem key={v.name} value={v.name}>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="font-semibold">{v.name}</span>
                              <span className="text-xs text-muted-foreground italic">({v.lang})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No system voices found matching filter</SelectItem>
                      )}
                    </SelectGroup>
                  ) : (
                    <>
                      {elevenLabsVoices.length > 0 ? (
                        <SelectGroup>
                          <SelectLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground py-2">ElevenLabs Voice Catalog</SelectLabel>
                          {filteredElevenLabsVoices.map((v) => (
                            <SelectItem key={v.voice_id} value={v.voice_id}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="font-semibold">{v.name}</span>
                                {v.labels?.accent && <span className="text-xs text-muted-foreground italic">({v.labels.accent})</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ) : (
                        <SelectItem value="none" disabled>
                          {isLoadingElevenLabs ? "Loading ElevenLabs voices..." : "Provide API Key in Engine Settings to view voices"}
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Cards Grid for Voice Preview */}
            {engine === 'studio' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Voice Previews ({activeLanguage} Native):
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Language: {activeLanguage}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                  {filteredStudioVoices.map((v) => {
                    const isSelected = voice === v.id;
                    const isPreviewing = previewingVoiceId === v.id;
                    const nativeSample = MULTILINGUAL_SAMPLE_TEXTS[activeLanguage]?.[v.id] || v.sampleText;
                    return (
                      <div 
                        key={v.id}
                        onClick={() => setVoice(v.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected 
                            ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30' 
                            : 'bg-card/60 hover:bg-card border-border/50 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{v.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                v.gender === 'Female' ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              }`}>
                                {v.gender} • {v.pitch}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-primary/90 mt-0.5">{v.style}</p>
                          </div>
                          
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full shrink-0 hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewVoice(v, nativeSample);
                            }}
                          >
                            {isPreviewing ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current text-primary" />
                            )}
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground line-clamp-1 italic">{v.description}</p>
                          <p className="text-[11px] text-foreground font-medium italic line-clamp-2 bg-secondary/30 p-1.5 rounded-md border border-border/30">
                            "{nativeSample}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pitch & Rate Controls for Web Speech */}
            {engine === 'webspeech' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-border/40">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Speed / Rate</span>
                    <span>{speechRate}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={speechRate} 
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Voice Pitch</span>
                    <span>{speechPitch}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1" 
                    value={speechPitch} 
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}

            {/* Submit / Generate Audio Button */}
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleGenerate} 
                disabled={!text.trim() || isGenerating || (engine === 'elevenlabs' && voice === 'none')}
                className="w-full sm:w-auto px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-bold uppercase tracking-wider"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Synthesizing Audio...</>
                ) : (
                  <><Volume2 className="w-5 h-5 mr-2" /> Generate Voiceover</>
                )}
              </Button>
            </div>
          </CardContent>

          {audioUrl && (
            <CardFooter className="bg-secondary/20 p-6 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-border/50 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12 shadow-sm shrink-0 border-primary/20 text-primary hover:bg-primary/10"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                </Button>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {isPlaying ? "Playing Audio..." : "Voice Synthesis Ready"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Generated with {engine === 'studio' ? `Studio (${voice})` : engine === 'webspeech' ? `WebSpeech (${voice})` : `ElevenLabs (${voice})`}
                  </div>
                </div>
              </div>
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-xl glass-card text-xs font-semibold uppercase tracking-widest gap-2"
                onClick={downloadAudio}
              >
                <Download className="w-4 h-4" /> Download WAV File
              </Button>
            </CardFooter>
          )}
        </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

