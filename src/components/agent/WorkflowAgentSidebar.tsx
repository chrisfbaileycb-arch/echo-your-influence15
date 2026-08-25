import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Send,
  UploadCloud,
  X,
  FileImage,
  Video as VideoIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Layers,
  CalendarDays,
  Package,
  Users,
  Route,
  ShieldCheck,
  Zap,
  Search,
  Copy,
  ExternalLink,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Radio,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { runAgentPrompt, executeAgentActionFn } from "@/lib/agent.functions";
import {
  type AgentAction,
  type AgentAttachment,
  type AgentMessage,
  type CarouselArtifact,
  type VideoScriptArtifact,
  SKILL_REGISTRY,
} from "@/lib/agent/types";
import {
  EchoCaptainCharacter,
  type EchoExpression,
  EchoVoiceControls,
} from "@/components/agent/EchoCaptainCharacter";
import { useEchoVoice, cleanTextForSpeech } from "@/lib/agent/voice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_STARTERS = [
  {
    label: "Ship it in a Weekend (5-Slide Carousel)",
    prompt:
      "Generate a 5-slide teaser carousel design titled 'Ship it in a weekend' for modern creators, complete with problem, playbook, and launch CTA.",
    skill: "carousel_designer",
  },
  {
    label: "15s Viral Video Script & Hook",
    prompt:
      "Write a high-converting 15-second UGC hook and short-form video script for an automated marketing agency app.",
    skill: "video_scriptwriter",
  },
  {
    label: "Launch Full 5-Channel Campaign",
    prompt:
      "Plan and orchestrate a multi-platform launch campaign: create the product offer, schedule 3 publishing slots across TikTok, Reels, & Shorts, and write ad copy.",
    skill: "campaign_orchestrator",
  },
  {
    label: "Generate 5 Viral Hooks",
    prompt:
      "Take our offer and generate 5 high-retention psychological hook variations across pattern interrupts, curiosity gaps, and bold contrarian angles.",
    skill: "hook_optimizer",
  },
  {
    label: "Competitor Market Audit",
    prompt:
      "Perform a competitor and positioning audit to extract uncontested marketing wedges and objection killers for our SaaS tool.",
    skill: "competitor_auditor",
  },
  {
    label: "Create Tech/Lifestyle Persona",
    prompt:
      "Build a high-energy Gen-Z tech and lifestyle influencer persona with custom catchphrases, bio, and voice mapping.",
    skill: "persona_architect",
  },
];

export function WorkflowAgentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "skills">("chat");
  const [requireApproval, setRequireApproval] = useState(true);
  const [inputPrompt, setInputPrompt] = useState("");
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const runPromptFn = useServerFn(runAgentPrompt);
  const executeActionFn = useServerFn(executeAgentActionFn);

  // Voice Interaction Hook (STT & TTS)
  const {
    isListening,
    isSpeaking,
    isMuted,
    transcript,
    error: voiceError,
    toggleMute,
    speak,
    stopSpeaking,
    toggleListening,
    startListening,
    stopListening,
  } = useEchoVoice((liveTranscript) => {
    setInputPrompt(liveTranscript);
  });

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      toast.error(voiceError);
    }
  }, [voiceError]);

  // Initial welcome message from Captain Echo
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "msg-init",
      role: "assistant",
      content:
        "Ahoy! I am Captain Echo, your AI Marketing Co-Captain! ⚓️ Upload an idea, reference image, product link, or video brief — or speak directly to me using your mic. I can autonomously steer and execute your entire workflow across products, personas, viral video scripts, carousels, and multi-channel publishing!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      skillsUsed: ["product_analyzer", "carousel_designer", "calendar_scheduler"],
      carouselArtifact: {
        title: "Launch Week",
        style: "minimalist",
        accentColor: "#6366F1",
        slides: [
          {
            slideNumber: 1,
            eyebrow: "LAUNCH WEEK",
            headline: "Ship it in a weekend.",
            subheadline: "A 5-slide teaser series",
            ctaText: "Swipe next ->",
          },
          {
            slideNumber: 2,
            eyebrow: "THE PROBLEM",
            headline: "Most creators wait months.",
            subheadline: "Perfectionism kills momentum before you even launch.",
            ctaText: "Here's the fix ->",
          },
          {
            slideNumber: 3,
            eyebrow: "THE PLAYBOOK",
            headline: "Automate Content Scheduling",
            subheadline: "Auto-format videos for TikTok, Reels, & Shorts.",
            ctaText: "Next step ->",
          },
          {
            slideNumber: 4,
            eyebrow: "SECURITY",
            headline: "Zero Password Sharing",
            subheadline: "Safe, API-based social publishing.",
            ctaText: "Final step ->",
          },
          {
            slideNumber: 5,
            eyebrow: "LOCAL POWER",
            headline: "Pre-Built Campaign Templates",
            subheadline: "Ready for food, retail, & service businesses.",
            ctaText: "Deploy now ->",
          },
        ],
      },
    },
  ]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Determine current Echo Expression based on active states
  const getCurrentEchoExpression = (): EchoExpression => {
    if (celebrateCount > 0) return "celebrating";
    if (isListening) return "listening";
    if (agentMutation.isPending) return "thinking";
    if (isSpeaking) return "speaking";
    return "idle";
  };

  // Mutation to run agent prompt
  const agentMutation = useMutation({
    mutationFn: async (payload: { prompt: string; attachments: AgentAttachment[] }) => {
      const res = await runPromptFn({
        data: {
          prompt: payload.prompt,
          attachments: payload.attachments,
          contextData: {
            currentPath: location.pathname,
          },
        },
      });
      return res;
    },
    onSuccess: async (data) => {
      const newMsgId = `msg-${Date.now()}`;
      const assistantMsg: AgentMessage = {
        id: newMsgId,
        role: "assistant",
        content: data.thought,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        skillsUsed: data.skillsUsed,
        actions: data.actions,
        carouselArtifact: data.carouselArtifact,
        videoScriptArtifact: data.videoScriptArtifact,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak response aloud via Echo voice if unmuted
      if (!isMuted && data.thought) {
        setSpeakingMessageId(newMsgId);
        speak(data.thought, () => {
          setSpeakingMessageId(null);
        });
      }

      // If in Auto-Execute mode (requireApproval is false), execute actions immediately!
      if (!requireApproval && data.actions && data.actions.length > 0) {
        toast.info("Captain Echo is auto-executing planned actions...");
        for (const act of data.actions) {
          await executeAction(newMsgId, act);
        }
      }
    },
    onError: (err: Error) => {
      toast.error(`Captain Echo encountered an issue: ${err.message}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Rough seas ahead! I encountered an issue processing that idea: ${err.message}. Let's chart another course or rephrase.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    },
  });

  // Execute an action on Supabase
  const executeAction = async (messageId: string, action: AgentAction) => {
    // Set status to executing
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          actions: msg.actions?.map((a) =>
            a.id === action.id ? { ...a, status: "executing" as const } : a,
          ),
        };
      }),
    );

    try {
      const res = await executeActionFn({
        data: {
          action,
        },
      });

      if (res.success) {
        toast.success(res.message || `Executed ${action.title}`);
        // Trigger celebration state on Echo
        setCelebrateCount((c) => c + 1);
        setTimeout(() => setCelebrateCount((c) => Math.max(0, c - 1)), 4000);

        // Invalidate queries so host app UI refreshes automatically
        queryClient.invalidateQueries();

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              actions: msg.actions?.map((a) =>
                a.id === action.id
                  ? {
                      ...a,
                      status: "completed" as const,
                      result: {
                        entityId: res.entityId,
                        entityType: res.entityType,
                        url: res.url,
                        message: res.message,
                      },
                    }
                  : a,
              ),
            };
          }),
        );
      } else {
        throw new Error(res.message || "Execution failed");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to execute action";
      toast.error(`Failed to execute: ${errMsg}`);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            actions: msg.actions?.map((a) =>
              a.id === action.id ? { ...a, status: "error" as const, errorMessage: errMsg } : a,
            ),
          };
        }),
      );
    }
  };

  // Handle submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() && attachments.length === 0) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputPrompt.trim() || "Uploaded creative reference / brief for processing.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: [...attachments],
    };

    setMessages((prev) => [...prev, userMsg]);
    agentMutation.mutate({ prompt: inputPrompt, attachments: [...attachments] });

    setInputPrompt("");
    setAttachments([]);
  };

  // Handle file uploads
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");

      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type,
            dataBase64: base64,
            previewUrl: isImg ? base64 : undefined,
            fileType: isImg ? "image" : isVid ? "video" : "document",
          },
        ]);
        toast.info(`Attached ${file.name}`);
      };

      reader.readAsDataURL(file);
    });
  };

  // Read a specific message aloud
  const handleReadMessageAloud = (msg: AgentMessage) => {
    if (speakingMessageId === msg.id && isSpeaking) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msg.id);
      speak(msg.content, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  // Collapsed floating pill launcher with Captain Echo
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-200">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl transition hover:scale-105 hover:bg-slate-800 border border-slate-700"
        >
          <EchoCaptainCharacter
            size="sm"
            expression={isListening ? "listening" : isSpeaking ? "speaking" : "idle"}
            interactive={false}
          />
          <div className="text-left leading-tight">
            <span className="font-display font-bold text-amber-400 block text-xs">
              Captain Echo
            </span>
            <span className="text-[11px] text-slate-300">AI Workflow Navigator</span>
          </div>
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </button>
      </div>
    );
  }

  const currentEchoExpression = getCurrentEchoExpression();

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs xl:hidden"
        onClick={() => setIsOpen(false)}
      />

      <aside
        data-testid="ai-workflow-agent-sidebar"
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-card text-foreground shadow-2xl sm:w-[440px] xl:sticky xl:top-0 xl:z-40 xl:h-screen xl:shrink-0"
      >
        {/* Captain Echo Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
          <div className="flex items-center gap-3">
            {/* Animated Captain Echo Mascot */}
            <div className="relative shrink-0">
              <EchoCaptainCharacter
                size="md"
                expression={currentEchoExpression}
                interactive={true}
                onClick={() => {
                  const greetings = [
                    "Ahoy! Captain Echo at the helm! What marketing move shall we make today?",
                    "Full steam ahead! Upload your idea or click the mic to tell me your plan!",
                    "Smooth sailing! I can write your scripts, design carousels, or schedule your calendar!",
                  ];
                  speak(greetings[Math.floor(Math.random() * greetings.length)]);
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span>Captain Echo</span>
                  <span className="text-amber-500">⚓️</span>
                </h2>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                    currentEchoExpression === "listening"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : currentEchoExpression === "thinking"
                        ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                        : currentEchoExpression === "speaking"
                          ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                          : currentEchoExpression === "celebrating"
                            ? "bg-amber-500/20 text-amber-700 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      currentEchoExpression === "listening"
                        ? "bg-amber-500 animate-ping"
                        : currentEchoExpression === "thinking"
                          ? "bg-indigo-500 animate-spin"
                          : currentEchoExpression === "speaking"
                            ? "bg-sky-500 animate-pulse"
                            : "bg-emerald-500",
                    )}
                  />
                  {currentEchoExpression === "listening"
                    ? "Listening"
                    : currentEchoExpression === "thinking"
                      ? "Thinking"
                      : currentEchoExpression === "speaking"
                        ? "Speaking"
                        : currentEchoExpression === "celebrating"
                          ? "Success!"
                          : "Live Sandbox"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Voice &amp; Workflow Co-Captain</p>
            </div>
          </div>

          {/* Quick Voice & Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Voice Mute / Speak Toggle */}
            <button
              onClick={toggleMute}
              className={cn(
                "rounded-lg p-1.5 transition border",
                isMuted
                  ? "border-border text-muted-foreground hover:bg-muted"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20",
              )}
              title={
                isMuted ? "Echo Voice Muted (Click to Unmute)" : "Echo Voice Active (Click to Mute)"
              }
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* Reset Chat */}
            <button
              onClick={() => {
                setMessages((prev) => prev.slice(0, 1));
                stopSpeaking();
                toast.info("Cleared conversation history");
              }}
              title="Reset Chat"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition border border-border"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Collapse */}
            <button
              onClick={() => setIsOpen(false)}
              title="Collapse Sidebar"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition border border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Controls Banner */}
        <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            {requireApproval ? (
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="font-medium text-foreground">
              Mode:{" "}
              <span className="font-bold">
                {requireApproval ? "Review & Approve" : "Autonomous Auto-Execute"}
              </span>
            </span>
          </div>
          <button
            onClick={() => {
              setRequireApproval(!requireApproval);
              toast.info(
                !requireApproval
                  ? "Switched to 'Review & Approve' mode"
                  : "Switched to 'Autonomous Auto-Execute' mode",
              );
            }}
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold transition border",
              requireApproval
                ? "bg-background text-foreground border-border hover:bg-muted"
                : "bg-amber-500 text-slate-950 border-amber-600 font-bold",
            )}
          >
            {requireApproval ? "Switch to Auto" : "Switch to Review"}
          </button>
        </div>

        {/* Navigation Tabs (Chat vs Skills Catalog) */}
        <div className="flex border-b border-border/80 bg-surface px-4 py-1.5 gap-2 text-xs">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition text-xs",
              activeTab === "chat"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Sparkles className="h-3 w-3" />
            <span>Chat &amp; Actions</span>
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition text-xs",
              activeTab === "skills"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <BookOpen className="h-3 w-3" />
            <span>Agent Skills ({Object.keys(SKILL_REGISTRY).length})</span>
          </button>
        </div>

        {/* Live Voice Input Banner (When Mic is Active) */}
        {isListening && (
          <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="font-medium text-amber-900 dark:text-amber-200">
                Captain Echo is listening... Speak your idea!
              </span>
            </div>
            <button
              onClick={stopListening}
              className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-amber-600"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Tab 1: Chat & Actions Scroll Area */}
        {activeTab === "chat" ? (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1.5",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                {/* Role Header */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                  {msg.role === "user" ? (
                    <span>You</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <EchoCaptainCharacter
                        size="sm"
                        expression={speakingMessageId === msg.id ? "speaking" : "idle"}
                        interactive={false}
                      />
                      <span className="font-bold text-foreground">Captain Echo</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>

                  {/* Listen Aloud Button for Echo's messages */}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleReadMessageAloud(msg)}
                      className={cn(
                        "ml-1 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition",
                        speakingMessageId === msg.id && isSpeaking
                          ? "bg-sky-500 text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      title={
                        speakingMessageId === msg.id && isSpeaking
                          ? "Stop audio"
                          : "Listen to Echo read aloud"
                      }
                    >
                      {speakingMessageId === msg.id && isSpeaking ? (
                        <>
                          <Square className="h-2.5 w-2.5 fill-current" /> Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-2.5 w-2.5 fill-current" /> Hear Echo
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Bubble Content */}
                <div
                  className={cn(
                    "rounded-2xl p-3.5 text-xs leading-relaxed max-w-[95%] shadow-xs",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-surface border border-border/80 text-foreground rounded-tl-xs",
                  )}
                >
                  {/* User Attachments Preview inside Bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 rounded-lg bg-black/10 px-2 py-1 text-[11px] backdrop-blur-xs"
                        >
                          {att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="h-6 w-6 rounded object-cover"
                            />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          <span className="truncate max-w-[120px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Skills Engaged Badges */}
                  {msg.skillsUsed && msg.skillsUsed.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/60">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 font-bold">
                        Skills Engaged:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {msg.skillsUsed.map((skillId) => {
                          const skill = SKILL_REGISTRY[skillId];
                          if (!skill) return null;
                          return (
                            <span
                              key={skillId}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>{skill.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interactive Carousel Artifact Preview */}
                  {msg.carouselArtifact && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-slate-950 text-white shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-slate-200">
                            {msg.carouselArtifact.title}
                          </span>
                        </div>
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-indigo-300">
                          {msg.carouselArtifact.slides.length}-Slide Deck
                        </span>
                      </div>

                      {/* Active Slide Viewer */}
                      {msg.carouselArtifact.slides[activeSlideIndex] && (
                        <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 min-h-[160px] flex flex-col justify-between">
                          <div>
                            {msg.carouselArtifact.slides[activeSlideIndex].eyebrow && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                                {msg.carouselArtifact.slides[activeSlideIndex].eyebrow}
                              </span>
                            )}
                            <h4 className="font-display text-sm font-bold text-white leading-tight">
                              {msg.carouselArtifact.slides[activeSlideIndex].headline}
                            </h4>
                            {msg.carouselArtifact.slides[activeSlideIndex].subheadline && (
                              <p className="mt-1.5 text-[11px] text-slate-300">
                                {msg.carouselArtifact.slides[activeSlideIndex].subheadline}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                            <span className="text-indigo-400 font-semibold">
                              {msg.carouselArtifact.slides[activeSlideIndex].ctaText || "Next ->"}
                            </span>
                            <span className="text-slate-500 font-mono">
                              Slide {activeSlideIndex + 1} of {msg.carouselArtifact.slides.length}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Slide Navigation Dots & Copy */}
                      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-3 py-1.5">
                        <div className="flex gap-1">
                          {msg.carouselArtifact.slides.map((_, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => setActiveSlideIndex(sIdx)}
                              className={cn(
                                "h-5 w-5 rounded text-[10px] font-mono font-bold transition",
                                activeSlideIndex === sIdx
                                  ? "bg-amber-400 text-slate-950 font-extrabold"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700",
                              )}
                            >
                              {sIdx + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            const deckText = msg
                              .carouselArtifact!.slides.map(
                                (s) =>
                                  `[Slide ${s.slideNumber}: ${s.eyebrow || ""}]\n${s.headline}\n${s.subheadline || ""}\nCTA: ${s.ctaText || ""}`,
                              )
                              .join("\n\n---\n\n");
                            navigator.clipboard.writeText(deckText);
                            toast.success("Copied 5-slide carousel text to clipboard!");
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white transition"
                        >
                          <Copy className="h-3 w-3" /> Copy Deck
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive Video Script Artifact Preview */}
                  {msg.videoScriptArtifact && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xs">
                      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <VideoIcon className="h-3.5 w-3.5 text-rose-500" />
                          <span className="font-display text-[11px] font-bold uppercase tracking-wider">
                            {msg.videoScriptArtifact.title}
                          </span>
                        </div>
                        <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 border border-rose-500/20">
                          {msg.videoScriptArtifact.durationSeconds}s UGC Script
                        </span>
                      </div>

                      <div className="p-3 space-y-2 text-xs">
                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground block">
                            Visual Hook:
                          </span>
                          <p className="font-semibold text-rose-600 dark:text-rose-400">
                            {msg.videoScriptArtifact.hook}
                          </p>
                        </div>

                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground block">
                            Body Script:
                          </span>
                          <p className="text-foreground/90 whitespace-pre-line bg-muted/30 rounded-lg p-2 font-sans">
                            {msg.videoScriptArtifact.bodyScript}
                          </p>
                        </div>

                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground block">
                            Visual &amp; Voice Direction:
                          </span>
                          <p className="text-[11px] text-muted-foreground italic">
                            {msg.videoScriptArtifact.visualDirection}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/80">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {msg.videoScriptArtifact.hashtags?.join(" ")}
                          </span>
                          <button
                            onClick={() => {
                              const full = `HOOK: ${msg.videoScriptArtifact!.hook}\n\nSCRIPT:\n${msg.videoScriptArtifact!.bodyScript}\n\nCTA: ${msg.videoScriptArtifact!.callToAction}\n\nDIRECTION: ${msg.videoScriptArtifact!.visualDirection}\n\nCAPTION: ${msg.videoScriptArtifact!.caption}\n${msg.videoScriptArtifact!.hashtags?.join(" ")}`;
                              navigator.clipboard.writeText(full);
                              toast.success("Copied video script to clipboard!");
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                          >
                            <Copy className="h-3 w-3" /> Copy Script
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Execution Plan Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-display uppercase tracking-wider text-muted-foreground font-bold">
                          Proposed In-App Actions ({msg.actions.length}):
                        </p>
                        {requireApproval && (
                          <button
                            onClick={async () => {
                              for (const act of msg.actions!) {
                                if (act.status === "pending") {
                                  await executeAction(msg.id, act);
                                }
                              }
                            }}
                            className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 shadow-2xs"
                          >
                            Execute All
                          </button>
                        )}
                      </div>

                      {msg.actions.map((act) => (
                        <div
                          key={act.id}
                          className={cn(
                            "rounded-xl border p-2.5 transition text-xs shadow-2xs",
                            act.status === "completed"
                              ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                              : act.status === "executing"
                                ? "border-indigo-500/30 bg-indigo-500/5 text-foreground animate-pulse"
                                : act.status === "error"
                                  ? "border-rose-500/30 bg-rose-500/5 text-foreground"
                                  : "border-border bg-card text-foreground",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {act.type === "create_product" ? (
                                <Package className="h-4 w-4 text-indigo-500 shrink-0" />
                              ) : act.type === "create_persona" ? (
                                <Users className="h-4 w-4 text-purple-500 shrink-0" />
                              ) : act.type === "schedule_calendar_slots" ? (
                                <CalendarDays className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Route className="h-4 w-4 text-rose-500 shrink-0" />
                              )}
                              <div>
                                <p className="font-semibold text-xs leading-snug">{act.title}</p>
                                <p className="text-[11px] text-muted-foreground">{act.summary}</p>
                              </div>
                            </div>

                            {/* Status Icon */}
                            {act.status === "completed" ? (
                              <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </span>
                            ) : act.status === "executing" ? (
                              <span className="flex items-center gap-1 text-indigo-600 text-[10px] font-bold shrink-0">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running
                              </span>
                            ) : act.status === "error" ? (
                              <span className="flex items-center gap-1 text-rose-600 text-[10px] font-bold shrink-0">
                                <AlertCircle className="h-3.5 w-3.5" /> Failed
                              </span>
                            ) : (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground shrink-0">
                                Awaiting Review
                              </span>
                            )}
                          </div>

                          {/* Result link / Action button */}
                          <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-border/40">
                            {act.result?.url ? (
                              <button
                                onClick={() => {
                                  if (act.result?.url) {
                                    window.location.href = act.result.url;
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                              >
                                <span>View created item</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Type: {act.type}
                              </span>
                            )}

                            {act.status === "pending" && (
                              <button
                                onClick={() => executeAction(msg.id, act)}
                                className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                              >
                                Approve &amp; Execute
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {agentMutation.isPending && (
              <div className="flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-600 animate-pulse">
                <EchoCaptainCharacter size="sm" expression="thinking" interactive={false} />
                <div className="leading-tight">
                  <span className="font-bold block">Captain Echo is charting the course...</span>
                  <span className="text-[11px] text-indigo-500/80">
                    Analyzing brief &amp; preparing sandbox actions
                  </span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        ) : (
          /* Tab 2: Agent Skills Catalog */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-display font-bold text-foreground">
                  Captain Echo&apos;s Skill Deck
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Each skill is an autonomous TypeScript module that transforms raw marketing ideas
                into executable in-app actions, rich carousels, and multi-channel schedules.
              </p>
            </div>

            {Object.entries(SKILL_REGISTRY).map(([id, skill]) => {
              const skillIcons: Record<string, typeof Sparkles> = {
                product_analyzer: Package,
                persona_architect: Users,
                video_scriptwriter: VideoIcon,
                carousel_designer: Layers,
                calendar_scheduler: CalendarDays,
                campaign_orchestrator: Route,
                hook_optimizer: Zap,
                competitor_auditor: Search,
              };
              const IconComp = skillIcons[id] || Sparkles;

              return (
                <div
                  key={id}
                  className="rounded-xl border border-border bg-card p-3.5 shadow-2xs hover:border-primary/40 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span>{skill.name}</span>
                        </h4>
                        <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground mt-0.5">
                          {skill.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    {skill.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-[10px] font-mono text-muted-foreground">ID: {id}</span>
                    <button
                      onClick={() => {
                        setActiveTab("chat");
                        const starter = QUICK_STARTERS.find((s) => s.skill === id);
                        if (starter) {
                          setInputPrompt(starter.prompt);
                        } else {
                          setInputPrompt(`Use your ${skill.name} skill to help me with: `);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <span>Invoke Skill</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Starters Carousel */}
        <div className="border-t border-border/80 bg-surface/50 px-3 py-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Quick Workflow Starters:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_STARTERS.map((st, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputPrompt(st.prompt);
                }}
                className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition shadow-2xs"
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multimodal & Voice Prompt Ingestion Box */}
        <div className="border-t border-border bg-surface p-3 space-y-2">
          {/* Uploaded attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary font-medium"
                >
                  {att.fileType === "image" ? (
                    <FileImage className="h-3.5 w-3.5" />
                  ) : att.fileType === "video" ? (
                    <VideoIcon className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  <span className="max-w-[140px] truncate text-[11px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
            <div className="relative flex items-center">
              <textarea
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  isListening
                    ? "Listening... Speak your campaign idea or workflow goal!"
                    : "Ask Captain Echo, speak via mic, or upload reference files..."
                }
                className={cn(
                  "w-full resize-none rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-28 transition",
                  isListening
                    ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5"
                    : "border-input",
                )}
              />

              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Talk to Captain Echo (Speech-to-Text)"}
                  className={cn(
                    "rounded-lg p-1.5 transition",
                    isListening
                      ? "bg-amber-500 text-white animate-bounce shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* File Attachment Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image, video clip, or brief"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <UploadCloud className="h-4 w-4" />
                </button>

                {/* Send Prompt Button */}
                <button
                  type="submit"
                  disabled={
                    agentMutation.isPending || (!inputPrompt.trim() && attachments.length === 0)
                  }
                  className="rounded-lg bg-primary p-1.5 text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 transition"
                  title="Send message to Captain Echo"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
