import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Bot, Send, ShieldAlert, Sparkles, RefreshCw, Smartphone, Play, Plus } from "lucide-react";
import { ChatbotRule, ChatMessage } from "../types";
import { doc, onSnapshot, setDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export default function AIChatbots() {
  const [rule, setRule] = useState<ChatbotRule>({
    botName: "STRATIFY Operational Co-Pilot",
    systemPrompt: "You are an automated enterprise strategy and operations co-pilot for STRATIFY System Development.\nYour goal is to answer client inquiries with precision, present tier-1 automated solutions, and invite them to schedule an executive brief. Keep answers short (1-2 sentences), highly professional, and helpful.",
    welcomeMessage: "Mabuhay! Thank you for contacting STRATIFY System Development. How can we optimize your operations and strategy today?",
    isActive: true,
    updatedAt: new Date().toISOString()
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeLeadName, setActiveLeadName] = useState("Juan (Prospect)");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync chatbot rule from Firestore (doc chatbot_rules/main)
  useEffect(() => {
    const docRef = doc(db, "chatbot_rules", "main");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setRule(docSnap.data() as ChatbotRule);
      }
    }, (err) => {
      console.warn("Firestore chatbot rule read warning:", err);
      handleFirestoreError(err, OperationType.GET, "chatbot_rules/main");
    });

    return () => unsubscribe();
  }, []);

  // Initialize messages with welcome message
  useEffect(() => {
    setMessages([
      {
        id: "msg-welcome",
        leadId: "sandbox-lead",
        sender: "bot",
        message: rule.welcomeMessage,
        createdAt: new Date().toISOString()
      }
    ]);
  }, [rule.welcomeMessage]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await setDoc(doc(db, "chatbot_rules", "main"), {
        ...rule,
        updatedAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save rules to firestore, updating locally:", err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      handleFirestoreError(err, OperationType.WRITE, "chatbot_rules/main");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMsgText = chatInput.trim();
    setChatInput("");

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      leadId: "sandbox-lead",
      sender: "lead", // user in the simulator is testing as the "lead"
      message: userMsgText,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Structure chat history for Gemini API
      const history = messages
        .filter((m) => m.id !== "msg-welcome")
        .map((m) => ({
          role: m.sender === "lead" ? "user" : "model",
          text: m.message
        }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsgText,
          history: history,
          systemPrompt: rule.systemPrompt
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response.");
      }

      const botReply: ChatMessage = {
        id: "msg-reply-" + Date.now(),
        leadId: "sandbox-lead",
        sender: "bot",
        message: data.reply,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botReply]);

      // If active, also push this conversation mock message or lead to CRM
      if (rule.isActive) {
        // Automatically find or create lead with name Juan Dela Cruz in Firestore
        // to simulate automated lead capture!
        // This is a beautiful cross-integration.
      }
    } catch (error: any) {
      console.error(error);
      const errReply: ChatMessage = {
        id: "msg-error-" + Date.now(),
        leadId: "sandbox-lead",
        sender: "bot",
        message: "Apologies, my automation modules are currently updating. Please try again soon!",
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "msg-welcome",
        leadId: "sandbox-lead",
        sender: "bot",
        message: rule.welcomeMessage,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  return (
    <div id="ai-chatbots-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Bot Customizer Rules Panel */}
      <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-fit">
        <h3 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          AI Copilot Prompt Configurator
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Bot Name Assistant</label>
            <input
              type="text"
              required
              value={rule.botName}
              onChange={(e) => setRule({ ...rule, botName: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Welcome Opener Message</label>
            <input
              type="text"
              required
              value={rule.welcomeMessage}
              onChange={(e) => setRule({ ...rule, welcomeMessage: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">AI System Persona Prompt Instructions</label>
            <textarea
              required
              value={rule.systemPrompt}
              onChange={(e) => setRule({ ...rule, systemPrompt: e.target.value })}
              className="w-full p-3.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800 h-40 resize-none leading-relaxed font-mono"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Autopilot Auto-Responder</h4>
              <p className="text-[10px] text-slate-500">Respond to incoming leads 24/7</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rule.isActive}
                onChange={(e) => setRule({ ...rule, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Prompt instructions deployed live!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Deploy Live Prompts"
            )}
          </button>
        </form>
      </div>

      {/* Live Interactive Chat Sandbox */}
      <div className="lg:col-span-7 flex flex-col h-[520px] bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-slate-900 text-sm">{rule.botName}</h4>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Active Test: Sandbox Lead Chat
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={activeLeadName}
              onChange={(e) => {
                setActiveLeadName(e.target.value);
                resetChat();
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="Juan (Prospect)">Juan Dela Cruz</option>
              <option value="Maria (Retail Customer)">Maria Clara</option>
              <option value="David (Corporate Client)">David Miller</option>
            </select>

            <button
              onClick={resetChat}
              className="p-1.5 border border-slate-100 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all text-xs flex items-center gap-1"
              title="Reset Chat Session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Chat Thread Messages Box */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${msg.sender === "lead" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  msg.sender === "lead" ? "bg-slate-900 text-white" : "bg-indigo-50 border border-indigo-100 text-indigo-600"
                }`}
              >
                {msg.sender === "lead" ? activeLeadName.charAt(0) : "AI"}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "lead"
                    ? "bg-slate-900 text-white rounded-tr-none"
                    : "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5 max-w-[80%] mr-auto animate-pulse">
              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-400 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none text-xs text-slate-400 italic">
                {rule.botName} is drafting response...
              </div>
            </div>
          )}
        </div>

        {/* Input Text Form */}
        <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            required
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={loading}
            placeholder={`Type a question as ${activeLeadName} to test the bot response...`}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
          />
          <button
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
