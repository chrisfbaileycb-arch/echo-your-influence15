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
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Bot,
  Flame,
  Check,
} from "lucide-react";
import { runAgentPrompt, executeAgentActionFn } from "@/lib/agent.functions";
import {
  type AgentAction,
  type AgentAttachment,
  type AgentMessage,
  type CarouselArtifact,
  type VideoScriptArtifact,
  SKILL_REGISTRY,
  type AgentSkillId,
} from "@/lib/agent/types";
import { EchoCaptainCharacter, type EchoExpression } from "@/components/agent/EchoCaptainCharacter";
import { useEchoVoice, cleanTextForSpeech } from "@/lib/agent/voice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_STARTERS = [
  {
    label: "Ship it in a Weekend (5-Slide Carousel)",
    prompt:
      "Generate a 5-slide teaser carousel design titled 'Ship it in a weekend' for modern creators, complete with problem, playbook, and launch CTA.",
    skill: "carousel_designer" as AgentSkillId,
  },
  {
    label: "15s Viral Video Script & Hook",
    prompt:
      "Write a high-converting 15-second UGC hook and short-form video script for an automated marketing agency app.",
    skill: "video_scriptwriter" as AgentSkillId,
  },
  {
    label: "Launch Full 5-Channel Campaign",
    prompt:
      "Plan and orchestrate a multi-platform launch campaign: create the product offer, schedule 3 publishing slots across TikTok, Reels, & Shorts, and write ad copy.",
    skill: "campaign_orchestrator" as AgentSkillId,
  },
  {
    label: "Generate 5 Viral Hooks",
    prompt:
      "Take our offer and generate 5 high-retention psychological hook variations across pattern interrupts, curiosity gaps, and bold contrarian angles.",
    skill: "hook_optimizer" as AgentSkillId,
  },
  {
    label: "Competitor Market Audit",
    prompt:
      "Perform a competitor and positioning audit to extract uncontested marketing wedges and objection killers for our SaaS tool.",
    skill: "competitor_auditor" as AgentSkillId,
  },
  {
    label: "Create Tech/Lifestyle Persona",
    prompt:
      "Build a high-energy Gen-Z tech and lifestyle influencer persona with custom catchphrases, bio, and voice mapping.",
    skill: "persona_architect" as AgentSkillId,
  },
];

export interface CaptainEchoSidebarProps {
  className?: string;
  defaultOpen?: boolean;
}

export function CaptainEchoSidebar({ className, defaultOpen = true }: CaptainEchoSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Persistent sidebar state from localStorage
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("captain_echo_sidebar_open");
      if (saved !== null) return saved === "true";
      // Auto-open on desktop, closed initially on small mobile to avoid blocking content
      return window.innerWidth >= 1280 ? defaultOpen : false;
    }
    return defaultOpen;
  });

  const [activeTab, setActiveTab] = useState<"chat" | "skills" | "actions">("chat");
  const [requireApproval, setRequireApproval] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("captain_echo_require_approval");
      if (saved !== null) return saved === "true";
    }
    return true;
  });

  const [inputPrompt, setInputPrompt] = useState("");
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runPromptFn = useServerFn(runAgentPrompt);
  const executeActionFn = useServerFn(executeAgentActionFn);

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("captain_echo_sidebar_open", String(isOpen));
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("captain_echo_require_approval", String(requireApproval));
    }
  }, [requireApproval]);

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

  // Keyboard shortcut: Cmd+J or Ctrl+J to toggle Captain Echo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "j" || e.key === "J" || e.key === "/")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initial welcome message from Captain Echo
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "msg-init",
      role: "assistant",
      content:
        "Ahoy! I am Captain Echo, your autonomous AI Marketing Co-Captain! ⚓️ Upload an idea, reference image, product link, or video brief — or speak directly to me using your mic. I can autonomously steer and execute your entire workflow across products, personas, viral video scripts, carousels, and multi-channel publishing!",
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
            headline: "Creators spend 20+ hours per week editing videos.",
            subheadline: "Burnout is real. Distribution bottlenecks kill momentum.",
          },
          {
            slideNumber: 3,
            eyebrow: "THE PLAYBOOK",
            headline: "Turn 1 product link into 30 days of viral content.",
            subheadline: "Autonomous scripts, carousels, and auto-publishing.",
          },
          {
            slideNumber: 4,
            eyebrow: "THE RESULT",
            headline: "10x Reach with zero manual editing fatigue.",
            subheadline: "Consistent multi-channel presence on autopilot.",
          },
          {
            slideNumber: 5,
            eyebrow: "GET STARTED",
            headline: "Claim your AI marketing Co-Captain today.",
            ctaText: "Tap link in bio",
          },
        ],
      },
      videoScriptArtifact: {
        title: "Creator Burnout to Autopilot",
        hook: "Stop spending 5 hours editing short-form videos for $0 in return. Here is the 2-minute system instead.",
        bodyScript:
          "Take your existing offer, plug it into Captain Echo, and watch it generate 5 psychological hooks, burned-in UGC scripts, and high-contrast carousels. Then schedule the entire week across TikTok, Reels, and YouTube in one click.",
        callToAction: "Drop a comment with 'ECHO' to get early access.",
        caption:
          "How top creators generate 30 days of content in under 10 minutes. #contentcreator #marketingautomation #ugc #saas",
        hashtags: ["#contentcreator", "#marketingautomation", "#ugc", "#saas", "#growthhacks"],
        durationSeconds: 15,
        visualDirection:
          "Fast-paced talking head UGC framing with dynamic zoom-ins and screen recording overlays of the dashboard.",
      },
      actions: [
        {
          id: "act-init-1",
          type: "create_product",
          title: "Setup Launch Product: 'Echo Marketing Suite'",
          summary: "Create product entry with USP hooks and pricing tier in database.",
          status: "pending",
          payload: {
            title: "Echo Marketing Suite",
            description: "Autonomous AI Marketing Co-Captain for creators and founders.",
            target_audience: "Solo founders, content creators, and growth agencies",
            selling_points: [
              "Autonomous video scriptwriting",
              "5-slide carousels",
              "Multi-channel calendar dispatch",
            ],
          },
        },
        {
          id: "act-init-2",
          type: "schedule_calendar_slots",
          title: "Schedule 3 Multi-Channel Launch Posts",
          summary: "Populate TikTok, Instagram, and YouTube slots with viral scripts.",
          status: "pending",
          payload: {
            slotsCount: 3,
            startDate: new Date().toISOString().split("T")[0],
          },
        },
      ],
    },
  ]);

  // Auto-scroll chat on new messages
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Mutation for sending prompt to Captain Echo server engine
  const agentMutation = useMutation({
    mutationFn: async (payload: {
      prompt: string;
      attachments: AgentAttachment[];
      history: AgentMessage[];
    }) => {
      const historyContext = payload.history.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await runPromptFn({
        data: {
          prompt: payload.prompt,
          currentRoute: location.pathname,
          requireApproval,
          attachments: payload.attachments,
          history: historyContext,
        },
      });

      if (!res || !res.success) {
        throw new Error(res?.error || "Captain Echo could not process your request.");
      }

      return res;
    },
    onSuccess: (data) => {
      const assistantMsg: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        skillsUsed: data.skillsUsed,
        actions: data.plannedActions,
        carouselArtifact: data.carouselArtifact,
        videoScriptArtifact: data.videoScriptArtifact,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setInputPrompt("");
      setAttachments([]);

      // Trigger Captain Echo character celebration animation
      setCelebrateCount((c) => c + 1);

      // Voice read back if voice is active
      if (!isMuted) {
        const spokenText = cleanTextForSpeech(data.reply);
        speak(spokenText, () => {
          setSpeakingMessageId(null);
        });
        setSpeakingMessageId(assistantMsg.id);
      }

      // Auto-execute if in autonomous auto mode
      if (!requireApproval && data.plannedActions && data.plannedActions.length > 0) {
        handleExecuteAllActions(data.plannedActions);
      }
    },
    onError: (err: Error) => {
      toast.error(`Captain Echo encountered an issue: ${err.message}`);
    },
  });

  // Execute single action mutation
  const actionMutation = useMutation({
    mutationFn: async (action: AgentAction) => {
      const res = await executeActionFn({
        data: {
          actionId: action.id,
          actionType: action.type,
          payload: action.payload,
        },
      });

      if (!res || !res.success) {
        throw new Error(res?.error || `Failed to execute action ${action.title}`);
      }

      return { actionId: action.id, result: res.result };
    },
    onSuccess: ({ actionId, result }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.actions) return msg;
          return {
            ...msg,
            actions: msg.actions.map((act) => {
              if (act.id === actionId) {
                return {
                  ...act,
                  status: "completed",
                  result,
                };
              }
              return act;
            }),
          };
        }),
      );

      toast.success("Autonomous action executed successfully!");

      // Invalidate relevant queries so the UI updates instantly
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-slots"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (err: Error, action) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.actions) return msg;
          return {
            ...msg,
            actions: msg.actions.map((act) => {
              if (act.id === action.id) {
                return {
                  ...act,
                  status: "error",
                  errorMessage: err.message,
                };
              }
              return act;
            }),
          };
        }),
      );
      toast.error(`Action failed: ${err.message}`);
    },
  });

  const handleExecuteAction = (action: AgentAction) => {
    // Set status to executing
    setMessages((prev) =>
      prev.map((msg) => {
        if (!msg.actions) return msg;
        return {
          ...msg,
          actions: msg.actions.map((act) =>
            act.id === action.id ? { ...act, status: "executing" } : act,
          ),
        };
      }),
    );
    actionMutation.mutate(action);
  };

  const handleExecuteAllActions = (actionsToRun: AgentAction[]) => {
    toast.info(`Captain Echo is executing ${actionsToRun.length} planned actions...`);
    actionsToRun.forEach((act) => {
      if (act.status === "pending") {
        handleExecuteAction(act);
      }
    });
  };

  // Submit prompt
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() && attachments.length === 0) return;
    if (agentMutation.isPending) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputPrompt.trim() || "Uploaded attachments for workflow analysis.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    agentMutation.mutate({
      prompt: inputPrompt.trim() || "Analyze attachments",
      attachments,
      history: newHistory,
    });
  };

  // Handle file uploads (Images, videos, PDFs, text)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AgentAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.includes("pdf") || file.type.includes("text")
            ? "document"
            : "other";

      const reader = new FileReader();

      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64Data = dataUrl.split(",")[1] || "";

          newAttachments.push({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            dataBase64: base64Data,
            previewUrl: fileType === "image" ? dataUrl : undefined,
            fileType,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    toast.success(`Attached ${newAttachments.length} file(s) for Captain Echo.`);
  };

  // Determine current mood/expression of Captain Echo mascot
  const getCurrentEchoExpression = (): EchoExpression => {
    if (isListening) return "listening";
    if (agentMutation.isPending || actionMutation.isPending) return "thinking";
    if (isSpeaking) return "speaking";
    if (celebrateCount > 0) return "celebrating";
    return "idle";
  };

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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const currentEchoExpression = getCurrentEchoExpression();

  // Count total pending actions across messages
  const pendingActionsCount = messages.reduce((acc, m) => {
    return acc + (m.actions?.filter((a) => a.status === "pending").length || 0);
  }, 0);

  return (
    <>
      {/* 1. Collapsed Floating Trigger (Mobile / Small Tablet) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in zoom-in duration-200">
          <button
            onClick={() => setIsOpen(true)}
            data-testid="captain-echo-floating-trigger"
            className="group flex items-center gap-3 rounded-full bg-slate-950/95 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl transition hover:scale-105 hover:bg-slate-900 border border-slate-700/80 backdrop-blur-md"
            title="Open Captain Echo Autonomous Agent (Cmd+J)"
          >
            <div className="relative">
              <EchoCaptainCharacter
                size="sm"
                expression={isListening ? "listening" : isSpeaking ? "speaking" : "idle"}
                interactive={false}
              />
              {pendingActionsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-extrabold text-slate-950 ring-2 ring-slate-950">
                  {pendingActionsCount}
                </span>
              )}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-amber-400 block text-xs">
                  Captain Echo
                </span>
                <span className="text-[10px] text-amber-300/80">⚓️</span>
              </div>
              <span className="text-[11px] text-slate-300">
                {isListening
                  ? "Listening..."
                  : agentMutation.isPending
                    ? "Executing..."
                    : "Autonomous Agent"}
              </span>
            </div>
            <span
              className={cn(
                "flex h-2.5 w-2.5 rounded-full ml-0.5",
                isListening
                  ? "bg-amber-400 animate-ping"
                  : agentMutation.isPending
                    ? "bg-indigo-400 animate-spin"
                    : "bg-emerald-400 animate-pulse",
              )}
            />
          </button>
        </div>
      )}

      {/* 2. Persistent Mini-Rail (Rendered on Large Screens >= 1280px when collapsed) */}
      {!isOpen && (
        <aside
          data-testid="captain-echo-persistent-rail"
          className="sticky top-0 hidden h-screen w-14 shrink-0 flex-col items-center border-l border-border bg-surface py-4 xl:flex z-30 justify-between transition-all"
        >
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              title="Expand Captain Echo Sidebar (Cmd+J)"
              className="group relative flex flex-col items-center rounded-xl p-1.5 transition hover:bg-card hover:scale-105"
            >
              <EchoCaptainCharacter
                size="sm"
                expression={currentEchoExpression}
                interactive={false}
              />
              <span className="mt-1 text-[9px] font-bold text-amber-500">Echo</span>
              {pendingActionsCount > 0 && (
                <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-slate-950">
                  {pendingActionsCount}
                </span>
              )}
            </button>

            {/* Quick Mic Button on Rail */}
            <button
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Talk to Captain Echo"}
              className={cn(
                "rounded-xl p-2.5 transition border",
                isListening
                  ? "bg-amber-500 text-white animate-bounce border-amber-600 shadow-md"
                  : "border-border text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Quick Skills Button */}
            <button
              onClick={() => {
                setActiveTab("skills");
                setIsOpen(true);
              }}
              title="View Captain Echo Skills Deck"
              className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-card hover:text-foreground transition"
            >
              <BookOpen className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleMute}
              title={isMuted ? "Echo voice muted" : "Echo voice active"}
              className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-card hover:text-foreground transition"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => setIsOpen(true)}
              title="Expand Sidebar"
              className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-card hover:text-foreground transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 3. Full Expanded Captain Echo Sidebar */}
      {isOpen && (
        <>
          {/* Mobile / Tablet Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          <aside
            data-testid="captain-echo-sidebar"
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-card text-foreground shadow-2xl sm:w-[440px] xl:sticky xl:top-0 xl:z-30 xl:h-screen xl:shrink-0 transition-all",
              className,
            )}
          >
            {/* Captain Echo Header Bar */}
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
                        "Aye aye! Ready to automate and publish across all 5 channels!",
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
                              : "Autonomous"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Voice &amp; Workflow Co-Captain
                  </p>
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
                    isMuted
                      ? "Echo Voice Muted (Click to Unmute)"
                      : "Echo Voice Active (Click to Mute)"
                  }
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Reset Chat */}
                <button
                  onClick={() => {
                    setMessages((prev) => prev.slice(0, 1));
                    stopSpeaking();
                    toast.info("Cleared conversation history");
                  }}
                  title="Reset Chat History"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition border border-border"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                {/* Collapse Sidebar */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Collapse Sidebar (Cmd+J)"
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
                {pendingActionsCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-slate-950">
                    {pendingActionsCount}
                  </span>
                )}
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

                      {/* Carousel Artifact Previewer */}
                      {msg.carouselArtifact && (
                        <div className="mt-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3 text-foreground">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Layers className="h-4 w-4 text-indigo-600" />
                              <span className="font-display font-bold text-xs">
                                Carousel Deck: {msg.carouselArtifact.title}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const allText = msg
                                  .carouselArtifact!.slides.map(
                                    (s) =>
                                      `Slide ${s.slideNumber}: ${s.eyebrow ? `[${s.eyebrow}] ` : ""}${s.headline} - ${s.subheadline || ""}`,
                                  )
                                  .join("\n\n");
                                handleCopyText(allText, "Carousel Script");
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:underline"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy All</span>
                            </button>
                          </div>

                          {/* Slide Tabs */}
                          <div className="flex gap-1 mb-2 overflow-x-auto pb-1 no-scrollbar">
                            {msg.carouselArtifact.slides.map((s, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveSlideIndex(idx)}
                                className={cn(
                                  "rounded px-2 py-0.5 text-[10px] font-semibold transition shrink-0",
                                  activeSlideIndex === idx
                                    ? "bg-indigo-600 text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                                )}
                              >
                                Slide {s.slideNumber}
                              </button>
                            ))}
                          </div>

                          {/* Active Slide Canvas Mockup */}
                          {msg.carouselArtifact.slides[activeSlideIndex] && (
                            <div
                              className="rounded-lg p-4 text-center flex flex-col justify-center min-h-[140px] shadow-sm border border-black/5"
                              style={{
                                backgroundColor: "#0F172A",
                                color: "#F8FAFC",
                              }}
                            >
                              {msg.carouselArtifact.slides[activeSlideIndex].eyebrow && (
                                <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400 font-bold mb-1">
                                  {msg.carouselArtifact.slides[activeSlideIndex].eyebrow}
                                </span>
                              )}
                              <h4 className="font-display font-bold text-sm leading-snug px-2">
                                {msg.carouselArtifact.slides[activeSlideIndex].headline}
                              </h4>
                              {msg.carouselArtifact.slides[activeSlideIndex].subheadline && (
                                <p className="text-[11px] text-slate-300 mt-1.5 px-3">
                                  {msg.carouselArtifact.slides[activeSlideIndex].subheadline}
                                </p>
                              )}
                              {msg.carouselArtifact.slides[activeSlideIndex].ctaText && (
                                <span className="mt-2 text-[10px] font-semibold text-amber-400">
                                  {msg.carouselArtifact.slides[activeSlideIndex].ctaText}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video Script Artifact */}
                      {msg.videoScriptArtifact && (
                        <div className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-foreground">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <VideoIcon className="h-4 w-4 text-rose-600" />
                              <span className="font-display font-bold text-xs">
                                9:16 Video Script ({msg.videoScriptArtifact.durationSeconds}s)
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const fullScript = `HOOK: ${msg.videoScriptArtifact!.hook}\n\nBODY: ${msg.videoScriptArtifact!.bodyScript}\n\nCTA: ${msg.videoScriptArtifact!.callToAction}\n\nCAPTION: ${msg.videoScriptArtifact!.caption}`;
                                handleCopyText(fullScript, "Video Script");
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-rose-600 hover:underline"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy Script</span>
                            </button>
                          </div>

                          <div className="space-y-2 text-[11px]">
                            <div className="rounded bg-rose-500/10 p-2 border border-rose-500/20">
                              <span className="font-mono text-[9px] font-bold uppercase text-rose-600 block">
                                🎣 0-3s Viral Hook:
                              </span>
                              <p className="font-semibold text-foreground mt-0.5">
                                &quot;{msg.videoScriptArtifact.hook}&quot;
                              </p>
                            </div>

                            <div className="rounded bg-background p-2 border border-border">
                              <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground block">
                                🎬 Body Narrative:
                              </span>
                              <p className="text-foreground/90 mt-0.5">
                                {msg.videoScriptArtifact.bodyScript}
                              </p>
                            </div>

                            <div className="rounded bg-background p-2 border border-border">
                              <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground block">
                                📣 Call to Action:
                              </span>
                              <p className="text-foreground/90 mt-0.5">
                                {msg.videoScriptArtifact.callToAction}
                              </p>
                            </div>

                            <div className="text-[10px] text-muted-foreground">
                              <span className="font-mono font-bold">Visual direction: </span>
                              {msg.videoScriptArtifact.visualDirection}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Planned Actions Execution Cards */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3.5 space-y-2 border-t border-border/80 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-[11px] font-bold text-foreground flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              <span>Autonomous Action Plan ({msg.actions.length})</span>
                            </span>

                            {requireApproval && msg.actions.some((a) => a.status === "pending") && (
                              <button
                                onClick={() => handleExecuteAllActions(msg.actions!)}
                                className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 shadow-2xs"
                              >
                                Approve &amp; Run All
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {msg.actions.map((act) => (
                              <div
                                key={act.id}
                                className={cn(
                                  "rounded-xl border p-2.5 transition flex flex-col gap-1.5",
                                  act.status === "completed"
                                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
                                    : act.status === "error"
                                      ? "border-rose-500/30 bg-rose-500/5 text-rose-950 dark:text-rose-100"
                                      : act.status === "executing"
                                        ? "border-indigo-500/30 bg-indigo-500/5 animate-pulse"
                                        : "border-border bg-card",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {act.status === "completed" ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    ) : act.status === "error" ? (
                                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                    ) : act.status === "executing" ? (
                                      <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
                                    ) : (
                                      <Package className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                    <span className="font-semibold text-xs text-foreground">
                                      {act.title}
                                    </span>
                                  </div>

                                  {act.status === "pending" && (
                                    <button
                                      onClick={() => handleExecuteAction(act)}
                                      disabled={actionMutation.isPending}
                                      className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 shadow-2xs transition"
                                    >
                                      Approve
                                    </button>
                                  )}

                                  {act.status === "completed" && (
                                    <span className="shrink-0 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                      Completed
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-muted-foreground">{act.summary}</p>

                                {act.status === "completed" && act.result && (
                                  <div className="rounded-lg bg-emerald-500/10 p-2 text-[10px] font-mono text-emerald-800 dark:text-emerald-200">
                                    ✓ {act.result.message || "Database state committed"}
                                  </div>
                                )}

                                {act.status === "error" && act.errorMessage && (
                                  <div className="rounded-lg bg-rose-500/10 p-2 text-[10px] font-mono text-rose-800 dark:text-rose-200">
                                    ✕ {act.errorMessage}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {agentMutation.isPending && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-600 animate-pulse">
                    <EchoCaptainCharacter size="sm" expression="thinking" interactive={false} />
                    <div className="leading-tight">
                      <span className="font-bold block">
                        Captain Echo is charting the course...
                      </span>
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
                    Each skill is an autonomous module that transforms raw marketing ideas into
                    executable in-app actions, rich carousels, and multi-channel schedules.
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
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ID: {id}
                        </span>
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
                      if (activeTab !== "chat") setActiveTab("chat");
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
                    ref={textareaRef}
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
                      title={
                        isListening ? "Stop listening" : "Talk to Captain Echo (Speech-to-Text)"
                      }
                      className={cn(
                        "rounded-lg p-1.5 transition",
                        isListening
                          ? "bg-amber-500 text-white animate-bounce shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Mic className="h-4 w-4" />
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
      )}
    </>
  );
}
