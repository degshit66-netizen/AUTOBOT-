import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Calendar,
  User,
  Bot,
  MessageSquare,
  Key,
  ShieldCheck,
  Globe,
  TrendingUp,
  Inbox,
  AlertCircle,
  Cpu,
  FileSpreadsheet
} from "lucide-react";

// Components
import FBTokenSetup from "./components/FBTokenSetup";
import CRMTracker from "./components/CRMTracker";
import SocialScheduler from "./components/SocialScheduler";
import AIChatbots from "./components/AIChatbots";
import ReputationManager from "./components/ReputationManager";
import AICommandCenter from "./components/AICommandCenter";
import DirectivesUploads from "./components/DirectivesUploads";

// Types
import { FBPage } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "meta" | "social" | "crm" | "chatbot" | "reputation" | "ai_brain" | "directives">("overview");
  const [activePage, setActivePage] = useState<FBPage | null>(() => {
    try {
      const saved = localStorage.getItem("fb_selected_page_info");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // STRATIFY Executive Strategy Blueprint State
  const [targetSector, setTargetSector] = useState("Enterprise Retail & E-commerce");
  const [targetFocus, setTargetFocus] = useState("AI Conversion Autopilot");
  const [modelResult, setModelResult] = useState<any>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleSynthesizeStrategy = async () => {
    setIsSynthesizing(true);
    setModelResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    const blueprints: Record<string, any> = {
      "AI Conversion Autopilot": {
        headline: "Direct Ingestion & Autopilot Conversion Engine",
        sla: "99.98% execution SLA guaranteed",
        efficiency: "+42% lead-to-opportunity conversion projection",
        steps: [
          "Phase 1: Real-time public comment listening and instant keyword analysis.",
          "Phase 2: Automated response routing and direct Private Message (Inbox DM) dispatch.",
          "Phase 3: Lead synchronization inside the STRATIFY CRM Boards with automated status triggers."
        ],
        metrics: "Target: 2.4-second response latency threshold."
      },
      "Reputation Defense": {
        headline: "Autonomous Sentiment Parsing & Rapid Review Reply Defense",
        sla: "Zero-latency real-time sentiment scoring",
        efficiency: "96.4% customer loyalty and support satisfaction target",
        steps: [
          "Phase 1: Instant streaming of all active page reviews from Facebook & Google.",
          "Phase 2: Semantic analysis via Gemini to auto-draft context-optimized responses.",
          "Phase 3: Immediate lead registration for disgruntled users with real-time support task triggers."
        ],
        metrics: "Target: -85% negative feedback persistency rate."
      },
      "Unified Lead Ingestion": {
        headline: "Enterprise Core Strategy Ingest & Directives Router",
        sla: "256-bit automated encryption and compliance standard",
        efficiency: "3.5x pipeline scale multiplier via dynamic unstructured file uploads",
        steps: [
          "Phase 1: Admin uploads training directives (PDF/CSV/XLSX) in the Directives tab.",
          "Phase 2: STRATIFY Engine parses context and aligns client-facing prompt instructions.",
          "Phase 3: Systems autonomously route matching leads to targeted sales agents."
        ],
        metrics: "Target: 100% manual entry removal from data pipeline."
      }
    };
    
    setModelResult(blueprints[targetFocus] || blueprints["AI Conversion Autopilot"]);
    setIsSynthesizing(false);
  };

  const handlePageSelected = (page: FBPage | null) => {
    setActivePage(page);
    if (page) {
      localStorage.setItem("fb_selected_page_info", JSON.stringify(page));
    } else {
      localStorage.removeItem("fb_selected_page_info");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* Dynamic Upper Top Navigation bar / System Credits Header */}
      <header className="bg-slate-950 border-b border-slate-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img 
                src="https://i.postimg.cc/5yGwSWWR/1782659487700.png" 
                alt="STRATIFY Logo" 
                className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-800 shadow-lg shadow-indigo-500/10"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="font-display font-black text-white tracking-widest block text-base">
                  STRATIFY
                </span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block -mt-0.5">
                  SYSTEM + STRATEGY DEVELOPMENT
                </span>
              </div>
            </div>
 
            {/* Quick Status Info Bar */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Environment:</span>
                {activePage ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE ({activePage.name})
                  </span>
                ) : (
                  <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    STRATIFY AUTOPILOT
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visual Showcase Banner */}
        <div className="mb-8 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          {/* Dynamic background accent shape */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/10 filter blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-indigo-600/5 filter blur-2xl pointer-events-none" />
 
          <div className="space-y-2 max-w-2xl z-10">
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
              Enterprise Autopilot Strategy
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Empower Operations with Predictive Systems & Strategy
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl">
              Scale enterprise workloads by coordinating autonomous social triggers, multi-channel leads acquisition, deep-logic chatbot copilots, and client review intelligence.
            </p>
          </div>
 
          <div className="flex flex-wrap gap-2.5 z-10 shrink-0">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-4 text-center min-w-32 shadow-md">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">System Standard</span>
              <span className="text-xs font-extrabold text-indigo-400 mt-1 block">Tier-1 Strategy</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-4 text-center min-w-32 shadow-md">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Core Engine</span>
              <span className="text-xs font-extrabold text-emerald-400 mt-1 block">Active Gemini</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="mb-6 flex flex-wrap gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl w-fit max-w-full overflow-x-auto shadow-xs border border-slate-200/40">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "overview" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Layers className="w-4 h-4" />
            Overview Dashboard
          </button>

          <button
            onClick={() => setActiveTab("meta")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "meta" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Key className="w-4 h-4" />
            Facebook Integration
          </button>

          <button
            onClick={() => setActiveTab("social")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "social" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Calendar className="w-4 h-4" />
            Social Scheduler
          </button>

          <button
            onClick={() => setActiveTab("crm")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "crm" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <User className="w-4 h-4" />
            Leads CRM Board
          </button>

          <button
            onClick={() => setActiveTab("chatbot")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "chatbot" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Bot className="w-4 h-4" />
            AI Chatbot Co-Pilot
          </button>

          <button
            onClick={() => setActiveTab("reputation")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "reputation" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <MessageSquare className="w-4 h-4" />
            Reputation reviews
          </button>

          <button
            onClick={() => setActiveTab("ai_brain")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "ai_brain" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Cpu className="w-4 h-4 text-indigo-500" />
            AI Command Center
          </button>

          <button
            onClick={() => setActiveTab("directives")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "directives" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            Directives & Uploads
          </button>
        </div>

        {/* View Switcher with Motion transitions */}
        <div className="relative min-h-[460px]">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                  className="space-y-6"
              >
                {/* Executive Operational Diagnostics & KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System SLA</span>
                      <span className="text-lg font-black text-slate-900 mt-1 block">99.98%</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Response Latency</span>
                      <span className="text-lg font-black text-emerald-600 mt-1 block">&lt; 2.4s</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Cpu className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Autopilot Conversion</span>
                      <span className="text-lg font-black text-slate-900 mt-1 block">+42% Target</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Enterprise Security</span>
                      <span className="text-lg font-black text-indigo-600 mt-1 block">AES-256</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Main Bento Grid Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Core Pillars & Live Indicators */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* The 4 Core Platform Pillars */}
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <Layers className="w-4.5 h-4.5 text-indigo-500" />
                          STRATIFY Suite Core Modules
                        </h4>
                        <span className="text-[10px] bg-slate-100 font-bold text-slate-500 px-2.5 py-0.5 rounded-full uppercase">
                          Fully Integrated
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Social Autopilot card */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between h-44">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                                <Calendar className="w-4.5 h-4.5" />
                              </div>
                              <h3 className="font-display font-semibold text-slate-900 text-sm">Social Media Autopilot</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                              Publish, schedule queue, and run zero-latency comment-matching Auto-Reply + Auto-Chat flows.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab("social")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 text-left flex items-center gap-1.5"
                          >
                            Manage Social & Auto-Reply →
                          </button>
                        </div>

                        {/* Lead follow up card */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between h-44">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                                <User className="w-4.5 h-4.5" />
                              </div>
                              <h3 className="font-display font-semibold text-slate-900 text-sm">Lead Capture CRM</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                              Never let a prospective partner wait. Instant lead tracking, status pipelines, and custom CRM actions.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab("crm")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 text-left flex items-center gap-1.5"
                          >
                            Open CRM Board →
                          </button>
                        </div>

                        {/* Chatbot card */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between h-44">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                                <Bot className="w-4.5 h-4.5" />
                              </div>
                              <h3 className="font-display font-semibold text-slate-900 text-sm">AI Strategic Chatbot</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                              Configure customized system persona prompts to automatically answer high-level corporate briefs 24/7.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab("chatbot")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 text-left flex items-center gap-1.5"
                          >
                            Launch Playtest Chat →
                          </button>
                        </div>

                        {/* Reputation card */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between h-44">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                                <MessageSquare className="w-4.5 h-4.5" />
                              </div>
                              <h3 className="font-display font-semibold text-slate-900 text-sm">Reputation Manager</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                              Review datasets and draft custom professional replies instantly incorporating Filipino hospitality values.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab("reputation")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 text-left flex items-center gap-1.5"
                          >
                            Open Reputation Reviews →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: STRATIFY Executive Strategy Blueprint Architect */}
                  <div className="lg:col-span-4 bg-slate-950 text-white border border-slate-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full min-h-[440px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-indigo-400" />
                          <h4 className="font-display font-bold text-sm tracking-tight">Executive Strategy Blueprint</h4>
                        </div>
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold tracking-wider">
                          v1.4 Enterprise
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            Corporate Sector Target
                          </label>
                          <select
                            value={targetSector}
                            onChange={(e) => setTargetSector(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Enterprise Retail & E-commerce">Enterprise Retail & E-commerce</option>
                            <option value="Local Real Estate Developers">Local Real Estate Developers</option>
                            <option value="Health & Medical Services">Health & Medical Services</option>
                            <option value="Conglomerates & Holding Companies">Conglomerates & Holding Companies</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            Core Strategic Initiative
                          </label>
                          <select
                            value={targetFocus}
                            onChange={(e) => setTargetFocus(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="AI Conversion Autopilot">AI Conversion Autopilot</option>
                            <option value="Reputation Defense">Reputation Defense</option>
                            <option value="Unified Lead Ingestion">Unified Lead Ingestion</option>
                          </select>
                        </div>
                      </div>

                      {/* Display blueprint result if generated */}
                      {modelResult && !isSynthesizing && (
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs animate-fadeIn">
                          <div className="pb-2 border-b border-slate-800">
                            <span className="text-[9px] font-bold text-emerald-400 block uppercase">
                              Active Strategy: {targetFocus}
                            </span>
                            <span className="font-bold text-slate-100 text-xs mt-1 block">
                              {modelResult.headline}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-slate-300">
                            {modelResult.steps.map((step: string, idx: number) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                                <span className="leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col gap-1 font-semibold">
                            <span className="text-emerald-400">⚡ Efficiency: {modelResult.efficiency}</span>
                            <span className="text-indigo-400">🛡️ SLA: {modelResult.sla}</span>
                            <span className="text-slate-500">{modelResult.metrics}</span>
                          </div>
                        </div>
                      )}

                      {isSynthesizing && (
                        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 text-center text-slate-400 text-xs space-y-3">
                          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                          <p className="font-medium">Synthesizing live operational parameters & blueprints...</p>
                        </div>
                      )}

                      {!modelResult && !isSynthesizing && (
                        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-5 text-center text-slate-500 text-xs">
                          <p>Click below to synthesize a tailored high-end corporate system blueprint for your selected sector and focus initiative.</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSynthesizeStrategy}
                      disabled={isSynthesizing}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      {isSynthesizing ? "Synthesizing Core Strategy..." : "Synthesize Strategy Blueprint"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "meta" && (
              <motion.div
                key="meta"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <FBTokenSetup onPageSelected={handlePageSelected} activePage={activePage} />
              </motion.div>
            )}

            {activeTab === "social" && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <SocialScheduler activePage={activePage} />
              </motion.div>
            )}

            {activeTab === "crm" && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <CRMTracker />
              </motion.div>
            )}

            {activeTab === "chatbot" && (
              <motion.div
                key="chatbot"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <AIChatbots />
              </motion.div>
            )}

            {activeTab === "reputation" && (
              <motion.div
                key="reputation"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <ReputationManager />
              </motion.div>
            )}

            {activeTab === "ai_brain" && (
              <motion.div
                key="ai_brain"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <AICommandCenter />
              </motion.div>
            )}

            {activeTab === "directives" && (
              <motion.div
                key="directives"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <DirectivesUploads />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
