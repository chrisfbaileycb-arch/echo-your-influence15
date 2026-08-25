import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, Sparkles, Mic, HelpCircle } from "lucide-react";
import { EchoVoiceSynthesizer } from "@/lib/agent/voice";

export type EchoExpression = "idle" | "listening" | "thinking" | "speaking" | "celebrating";

interface EchoCaptainCharacterProps {
  expression?: EchoExpression;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  interactive?: boolean;
  showTooltip?: boolean;
  onClick?: () => void;
}

export function EchoCaptainCharacter({
  expression = "idle",
  size = "md",
  className,
  interactive = true,
  showTooltip = false,
  onClick,
}: EchoCaptainCharacterProps) {
  const [blink, setBlink] = useState(false);
  const [hatTip, setHatTip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Natural blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking on Echo
  const handleClick = () => {
    setHatTip(true);
    setTimeout(() => setHatTip(false), 900);

    if (onClick) {
      onClick();
    } else {
      // Cheerful voice greeting if speech synth available
      const voice = EchoVoiceSynthesizer.getInstance();
      const greetings = [
        "Ahoy! Captain Echo reporting for duty! What shall we navigate next?",
        "Ready to launch campaigns and conquer the feeds!",
        "All hands on deck! Let's craft some viral content!",
        "Aye aye! I'm ready to automate your marketing workflow!",
      ];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      voice.speak(randomGreeting);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const expressionLabels: Record<EchoExpression, { label: string; color: string }> = {
    idle: { label: "Ready to Guide", color: "text-emerald-500" },
    listening: { label: "Listening to You...", color: "text-amber-500" },
    thinking: { label: "Analyzing Workflow...", color: "text-indigo-500" },
    speaking: { label: "Speaking...", color: "text-sky-500" },
    celebrating: { label: "Mission Complete!", color: "text-amber-400" },
  };

  return (
    <div
      className={cn("relative inline-flex flex-col items-center select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Listening Sonar Wave Rings */}
      {expression === "listening" && (
        <>
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className="absolute -inset-1 rounded-full border-2 border-amber-400/60 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="absolute -inset-1 rounded-full border-2 border-amber-400/40 pointer-events-none"
          />
        </>
      )}

      {/* Speaking Sound Waves */}
      {expression === "speaking" && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
          className="absolute -inset-1.5 rounded-full bg-sky-400/20 blur-xs pointer-events-none"
        />
      )}

      {/* Celebrating Aura */}
      {expression === "celebrating" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute -inset-2 rounded-full border border-dashed border-amber-400/50 pointer-events-none"
        />
      )}

      {/* Interactive Container */}
      <motion.button
        type="button"
        disabled={!interactive}
        onClick={handleClick}
        whileHover={interactive ? { scale: 1.08 } : undefined}
        whileTap={interactive ? { scale: 0.94 } : undefined}
        animate={
          expression === "celebrating" || hatTip
            ? { y: [0, -6, 0, -4, 0] }
            : expression === "speaking"
              ? { y: [0, -2, 0, -2, 0] }
              : expression === "thinking"
                ? { rotate: [-2, 2, -2] }
                : { y: [0, -1.5, 0] }
        }
        transition={{
          repeat: expression === "celebrating" || hatTip ? 0 : Infinity,
          duration: expression === "speaking" ? 0.6 : expression === "thinking" ? 2 : 3.5,
          ease: "easeInOut",
        }}
        className={cn(
          "relative flex items-center justify-center rounded-full p-0.5 focus:outline-none transition-shadow",
          sizeClasses[size],
          interactive && "cursor-pointer hover:drop-shadow-md",
        )}
        title="Echo - Marketing Co-Captain (Click to talk)"
      >
        {/* Echo SVG Character */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            <linearGradient
              id="bodyGrad"
              x1="20"
              y1="20"
              x2="80"
              y2="85"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFDE43" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient
              id="hatCrownGrad"
              x1="25"
              y1="10"
              x2="75"
              y2="35"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient
              id="hatBrimGrad"
              x1="20"
              y1="32"
              x2="80"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#1E293B" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient
              id="goldGrad"
              x1="45"
              y1="25"
              x2="55"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="echoShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="1.5"
                floodColor="#78350F"
                floodOpacity="0.15"
              />
            </filter>
          </defs>

          {/* MAIN YELLOW ROUND BODY */}
          <g filter="url(#echoShadow)">
            <circle cx="50" cy="58" r="32" fill="url(#bodyGrad)" />
            {/* Subtle light highlight on forehead */}
            <ellipse cx="42" cy="42" rx="10" ry="6" fill="#FFFBEB" fillOpacity="0.4" />
          </g>

          {/* CHEEKS */}
          <ellipse cx="33" cy="64" rx="4.5" ry="3" fill="#F43F5E" fillOpacity="0.35" />
          <ellipse cx="67" cy="64" rx="4.5" ry="3" fill="#F43F5E" fillOpacity="0.35" />

          {/* EYES LAYER DEPENDING ON EXPRESSION */}
          {expression === "idle" && (
            <g>
              {blink ? (
                // Blinking closed happy curves
                <>
                  <path
                    d="M34 56 Q39 60 44 56"
                    stroke="#1E293B"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M56 56 Q61 60 66 56"
                    stroke="#1E293B"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                // Cheerful open eyes with spark
                <>
                  <circle cx="39" cy="55" r="4.2" fill="#0F172A" />
                  <circle cx="61" cy="55" r="4.2" fill="#0F172A" />
                  <circle cx="37.5" cy="53.5" r="1.4" fill="#FFFFFF" />
                  <circle cx="59.5" cy="53.5" r="1.4" fill="#FFFFFF" />
                </>
              )}
            </g>
          )}

          {expression === "listening" && (
            <g>
              {/* Focused attentive wide eyes */}
              <circle cx="39" cy="55" r="4.8" fill="#0F172A" />
              <circle cx="61" cy="55" r="4.8" fill="#0F172A" />
              <circle cx="37.5" cy="53" r="1.8" fill="#FFFFFF" />
              <circle cx="59.5" cy="53" r="1.8" fill="#FFFFFF" />
              {/* Cute listening eyebrows */}
              <path
                d="M34 47 Q39 45 44 48"
                stroke="#78350F"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M56 48 Q61 45 66 47"
                stroke="#78350F"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {expression === "thinking" && (
            <g>
              {/* Looking up thoughtfully */}
              <circle cx="41" cy="51" r="4" fill="#0F172A" />
              <circle cx="63" cy="51" r="4" fill="#0F172A" />
              <circle cx="40" cy="49.5" r="1.4" fill="#FFFFFF" />
              <circle cx="62" cy="49.5" r="1.4" fill="#FFFFFF" />
              {/* Quizzical eyebrows */}
              <path
                d="M35 48 Q40 46 44 49"
                stroke="#78350F"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M56 46 Q61 43 65 44"
                stroke="#78350F"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {expression === "speaking" && (
            <g>
              {/* Expressive animated happy eyes */}
              <path
                d="M34 54 Q39 49 44 54"
                stroke="#0F172A"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M56 54 Q61 49 66 54"
                stroke="#0F172A"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {expression === "celebrating" && (
            <g>
              {/* Starry eyes for celebration */}
              <path
                d="M39 50 L40.5 53.5 L44 54 L41.2 56.5 L42 60 L39 58 L36 60 L36.8 56.5 L34 54 L37.5 53.5 Z"
                fill="#0F172A"
              />
              <path
                d="M61 50 L62.5 53.5 L66 54 L63.2 56.5 L64 60 L61 58 L58 60 L58.8 56.5 L56 54 L59.5 53.5 Z"
                fill="#0F172A"
              />
            </g>
          )}

          {/* MOUTH LAYER DEPENDING ON EXPRESSION */}
          {expression === "idle" && (
            <path
              d="M44 64 Q50 70 56 64"
              stroke="#0F172A"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {expression === "listening" && <circle cx="50" cy="65" r="2.8" fill="#0F172A" />}

          {expression === "thinking" && (
            <path
              d="M46 66 Q51 64 54 67"
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {expression === "speaking" && (
            // Open animated mouth with tongue
            <g>
              <path d="M43 62 Q50 72 57 62 Z" fill="#0F172A" />
              <path d="M46 67 Q50 71 54 67 Z" fill="#F43F5E" />
            </g>
          )}

          {expression === "celebrating" && (
            // Big joyful open grin
            <g>
              <path d="M42 62 Q50 74 58 62 Z" fill="#0F172A" />
              <ellipse cx="50" cy="67" rx="3.5" ry="2.2" fill="#F43F5E" />
            </g>
          )}

          {/* CAPTAIN'S SAILOR HAT */}
          <g
            className="transition-transform duration-300 origin-[50px_35px]"
            style={{
              transform: hatTip || isHovered ? "rotate(-8deg) translateY(-2px)" : "none",
            }}
          >
            {/* White Crown Dome */}
            <path
              d="M26 34 C24 22, 34 11, 50 11 C66 11, 76 22, 74 34 Z"
              fill="url(#hatCrownGrad)"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />

            {/* Hat Crease Detail */}
            <path
              d="M42 16 Q50 20 58 16"
              stroke="#94A3B8"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />

            {/* Gold Braided Rope / Cord */}
            <path
              d="M24 33 Q50 38 76 33"
              stroke="url(#goldGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray="2.5 1.5"
            />

            {/* Navy Visor / Brim */}
            <path
              d="M21 34 Q50 43 79 34 Q76 39 50 42 Q24 39 21 34 Z"
              fill="url(#hatBrimGrad)"
              stroke="#0F172A"
              strokeWidth="1"
            />

            {/* Visor Gloss Highlight */}
            <path d="M30 36 Q50 41 70 36" stroke="#64748B" strokeWidth="0.9" fill="none" />

            {/* Golden Anchor Insignia Badge */}
            <g transform="translate(44, 18) scale(0.65)">
              <circle cx="9" cy="9" r="8" fill="url(#goldGrad)" />
              <circle cx="9" cy="9" r="7" fill="#0F172A" />
              {/* Anchor vector */}
              <circle cx="9" cy="5" r="1.5" fill="#FDE047" />
              <path d="M9 6 L9 13" stroke="#FDE047" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M6 8 L12 8" stroke="#FDE047" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d="M5 11 Q9 15 13 11"
                stroke="#FDE047"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* FLOATING ACCESSORIES FOR EXPRESSIONS */}
          {expression === "thinking" && (
            <g transform="translate(68, 12)">
              <circle cx="3" cy="10" r="1.5" fill="#6366F1" opacity="0.6" />
              <circle cx="8" cy="5" r="2" fill="#6366F1" opacity="0.8" />
              <circle cx="15" cy="0" r="3" fill="#6366F1" />
              <path
                d="M15 -3 L15 3 M12 0 L18 0"
                stroke="#FFFFFF"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {expression === "celebrating" && (
            <g>
              {/* Confetti and sparkles */}
              <circle cx="20" cy="22" r="1.8" fill="#F59E0B" />
              <circle cx="82" cy="26" r="1.8" fill="#EC4899" />
              <circle cx="16" cy="46" r="1.5" fill="#10B981" />
              <circle cx="84" cy="48" r="1.5" fill="#3B82F6" />
              <path d="M78 18 L80 22 L84 20 L81 24 Z" fill="#FBBF24" />
              <path d="M18 34 L21 36 L19 39 L17 37 Z" fill="#60A5FA" />
            </g>
          )}
        </svg>
      </motion.button>

      {/* Tooltip / Status Subtitle */}
      {showTooltip && (
        <span
          className={cn(
            "mt-1 text-[10px] font-bold tracking-tight",
            expressionLabels[expression].color,
          )}
        >
          {expressionLabels[expression].label}
        </span>
      )}
    </div>
  );
}

// Compact voice badge with interactive controls
interface EchoVoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  onToggleMic: () => void;
  onToggleMute: () => void;
  onSpeakGreeting?: () => void;
}

export function EchoVoiceControls({
  isListening,
  isSpeaking,
  isMuted,
  onToggleMic,
  onToggleMute,
  onSpeakGreeting,
}: EchoVoiceControlsProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-2.5 py-1 text-xs shadow-2xs">
      {/* Mic Input Trigger */}
      <button
        type="button"
        onClick={onToggleMic}
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[11px] transition",
          isListening
            ? "bg-amber-500 text-white animate-pulse"
            : "bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground",
        )}
        title={isListening ? "Listening... Click to stop" : "Speak to Echo (Speech-to-Text)"}
      >
        <Mic className={cn("h-3 w-3", isListening && "text-white animate-bounce")} />
        <span>{isListening ? "Listening" : "Voice Input"}</span>
      </button>

      {/* Voice Output Speaker Mute Toggle */}
      <button
        type="button"
        onClick={onToggleMute}
        className={cn(
          "rounded-full p-1 transition",
          isMuted ? "text-muted-foreground hover:bg-muted" : "text-primary hover:bg-primary/10",
        )}
        title={isMuted ? "Unmute Echo Voice (Text-to-Speech)" : "Mute Echo Voice"}
      >
        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>

      {/* Greeting info */}
      {onSpeakGreeting && (
        <button
          type="button"
          onClick={onSpeakGreeting}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          title="Ask Echo to introduce himself"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        </button>
      )}
    </div>
  );
}
