// Voice recognition & speech synthesis engine for Echo the Captain Agent
import { useState, useEffect, useCallback, useRef } from "react";

export interface SpeechRecognitionResultState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// Check if speech recognition is available in browser
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

// Clean markdown and symbols for clean speech synthesis
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " code snippet provided in chat. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`>-]/g, " ")
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/\s+/g, " ")
    .trim();
}

// Voice synthesizer helper
export class EchoVoiceSynthesizer {
  private static instance: EchoVoiceSynthesizer;
  private isMuted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  private constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("echo_voice_muted");
      this.isMuted = savedMute === "true";
    }
  }

  public static getInstance(): EchoVoiceSynthesizer {
    if (!EchoVoiceSynthesizer.instance) {
      EchoVoiceSynthesizer.instance = new EchoVoiceSynthesizer();
    }
    return EchoVoiceSynthesizer.instance;
  }

  public onSpeakingChange(callback: (speaking: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(speaking: boolean) {
    this.listeners.forEach((cb) => cb(speaking));
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("echo_voice_muted", String(this.isMuted));
    }
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }

  public speak(text: string, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    if (this.isMuted) {
      onEnd?.();
      return;
    }

    this.stop();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    this.currentUtterance = utterance;

    // Pick best available natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Alex") ||
            v.name.includes("US English")),
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.rate = 1.05; // Lively, energetic pace
    utterance.pitch = 1.08; // Friendly, slightly upbeat captain tone

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.notify(false);
      this.currentUtterance = null;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.notify(false);
    }
  }
}

// React Hook for Echo's Voice Interactions (STT + TTS)
// Web Speech API interface definitions
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function useEchoVoice(onTranscript?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const synthesizer = EchoVoiceSynthesizer.getInstance();

  useEffect(() => {
    setIsMuted(synthesizer.getIsMuted());
    const unsub = synthesizer.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, [synthesizer]);

  // Toggle voice mute
  const toggleMute = useCallback(() => {
    const nextMute = synthesizer.toggleMute();
    setIsMuted(nextMute);
  }, [synthesizer]);

  // Speak text
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      synthesizer.speak(text, onEnd);
    },
    [synthesizer],
  );

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    synthesizer.stop();
  }, [synthesizer]);

  // Start Speech-to-Text
  const startListening = useCallback(() => {
    setError(null);
    if (typeof window === "undefined") return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            fullTranscript += res[0].transcript + " ";
          }
        }
        const clean = fullTranscript.trim();
        setTranscript(clean);
        if (onTranscript) {
          onTranscript(clean);
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn("[Echo Voice] Speech error:", event.error);
        if (event.error !== "no-speech") {
          setError(`Mic error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to start microphone";
      setError(msg);
      setIsListening(false);
    }
  }, [onTranscript]);

  // Stop Speech-to-Text
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    isMuted,
    transcript,
    error,
    toggleMute,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    toggleListening,
  };
}
