import React, { useState, useEffect } from "react";
import { Plus, User, Mail, Phone, DollarSign, Tag, TrendingUp, Grid, List, ChevronRight, MessageSquare, Send, CheckCircle2, Trash2 } from "lucide-react";
import { Lead } from "../types";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

const STAGES = [
  { id: "new", name: "New Leads", color: "border-t-sky-500 bg-sky-50/20 text-sky-700" },
  { id: "contacted", name: "Contacted", color: "border-t-amber-500 bg-amber-50/20 text-amber-700" },
  { id: "proposal", name: "Proposal Sent", color: "border-t-indigo-500 bg-indigo-50/20 text-indigo-700" },
  { id: "won", name: "Closed Won", color: "border-t-emerald-500 bg-emerald-50/20 text-emerald-700" },
  { id: "lost", name: "Closed Lost", color: "border-t-rose-400 bg-rose-50/10 text-rose-600" },
] as const;

export default function CRMTracker() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSource, setNewSource] = useState("web");
  const [newValue, setNewValue] = useState("1500");
  const [newNotes, setNewNotes] = useState("");

  // Automated Follow-up drafting state
  const [followUpChannel, setFollowUpChannel] = useState<"sms" | "email">("sms");
  const [followUpSentStatus, setFollowUpSentStatus] = useState<string | null>(null);

  // Firestore sync with local state fallback
  useEffect(() => {
    const leadsCollection = collection(db, "leads");
    const unsubscribe = onSnapshot(
      leadsCollection,
      (snapshot) => {
        const list: Lead[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Lead);
        });
        // Sort by createdAt desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeads(list);
        // Sync to localstorage
        localStorage.setItem("crm_leads_backup", JSON.stringify(list));
      },
      (error) => {
        console.warn("Firestore leads read warning, using local state:", error);
        const backup = localStorage.getItem("crm_leads_backup");
        if (backup) {
          setLeads(JSON.parse(backup));
        } else {
          // Default initial leads
          const defaults: Lead[] = [
            { id: "lead-1", name: "Juan Dela Cruz", email: "juan@example.com", phone: "+639171234567", source: "facebook", status: "new", notes: "Inquired about business chatbot and landing page automation", value: 2500, createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), updatedAt: new Date().toISOString() },
            { id: "lead-2", name: "Maria Clara", email: "maria@ph-ventures.com", phone: "+639209876543", source: "web", status: "contacted", notes: "Sent booking proposal last Tuesday. Waiting for call schedule.", value: 5000, createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), updatedAt: new Date().toISOString() },
            { id: "lead-3", name: "David Miller", email: "david@mtech.co", phone: "+12125550199", source: "sms", status: "proposal", notes: "Requested full SMS automation package quote.", value: 12000, createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), updatedAt: new Date().toISOString() }
          ];
          setLeads(defaults);
        }
        handleFirestoreError(error, OperationType.GET, "leads");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedValue = parseFloat(newValue) || 0;
    const newLeadData = {
      name: newName,
      email: newEmail,
      phone: newPhone,
      source: newSource,
      status: "new" as const,
      notes: newNotes,
      value: parsedValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "leads"), newLeadData);
    } catch (err) {
      console.warn("Adding to firestore failed, updating locally first:", err);
      // Fallback local addition
      const tempLead: Lead = {
        id: "temp-" + Date.now(),
        ...newLeadData
      };
      const updatedList = [tempLead, ...leads];
      setLeads(updatedList);
      localStorage.setItem("crm_leads_backup", JSON.stringify(updatedList));
    }

    // Reset Form
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewSource("web");
    setNewValue("1500");
    setNewNotes("");
    setShowAddForm(false);
  };

  const handleUpdateStatus = async (leadId: string, nextStatus: Lead["status"]) => {
    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Firestore update failed, editing local state:", err);
      const updatedList = leads.map(l => l.id === leadId ? { ...l, status: nextStatus, updatedAt: new Date().toISOString() } : l);
      setLeads(updatedList);
      localStorage.setItem("crm_leads_backup", JSON.stringify(updatedList));
    }
  };

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      await deleteDoc(doc(db, "leads", leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (err) {
      console.warn("Firestore delete failed, editing local state:", err);
      const updatedList = leads.filter(l => l.id !== leadId);
      setLeads(updatedList);
      localStorage.setItem("crm_leads_backup", JSON.stringify(updatedList));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    }
  };

  const totalValue = leads.reduce((sum, lead) => lead.status === "won" ? sum + lead.value : sum, 0);
  const pipelineValue = leads.reduce((sum, lead) => lead.status !== "lost" && lead.status !== "won" ? sum + lead.value : sum, 0);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "facebook":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "web":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "sms":
        return "bg-purple-50 text-purple-700 border-purple-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  // Get pre-formatted follow-up template message
  const getFollowUpTemplate = () => {
    if (!selectedLead) return "";
    const name = selectedLead.name.split(" ")[0];
    if (followUpChannel === "sms") {
      return `Hi ${name}! Thanks for reaching out to us. We received your request on our ${selectedLead.source} channel. When is a good time to connect this week for a brief call?`;
    } else {
      return `Subject: Thanks for reaching out!\n\nHi ${name},\n\nHope this email finds you well. Thank you for your inquiry about our Business Automation solutions. We've captured your lead from ${selectedLead.source.toUpperCase()}.\n\nLet's schedule a 15-minute introductory call to explore how we can save you hours each week. Click here to choose a time: calendar.example.com\n\nBest regards,\nReputation & Automation Team`;
    }
  };

  const triggerMockFollowUp = () => {
    setFollowUpSentStatus("sending");
    setTimeout(() => {
      setFollowUpSentStatus("sent");
      setTimeout(() => {
        setFollowUpSentStatus(null);
      }, 3000);
    }, 1500);
  };

  return (
    <div id="crm-tracker-section" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (Won)</span>
            <div className="text-2xl font-display font-bold text-slate-900 mt-1">
              ₱{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Value</span>
            <div className="text-2xl font-display font-bold text-slate-900 mt-1">
              ₱{pipelineValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Leads</span>
            <div className="text-2xl font-display font-bold text-slate-900 mt-1">
              {leads.filter(l => l.status !== "lost").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "kanban" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Grid className="w-3.5 h-3.5" />
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            <List className="w-3.5 h-3.5" />
            Lead Directory
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Manual Lead
        </button>
      </div>

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.id);
            return (
              <div key={stage.id} className="min-w-[220px] flex flex-col h-[520px]">
                {/* Stage Header */}
                <div className={`p-3 border-t-2 rounded-xl flex justify-between items-center mb-3 ${stage.color} shadow-sm border border-slate-100/60`}>
                  <span className="font-display font-medium text-xs">{stage.name}</span>
                  <span className="text-[10px] font-bold bg-white/60 px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="flex-1 bg-slate-50/50 border border-dashed border-slate-200/60 rounded-2xl p-2.5 space-y-2 overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white border border-slate-100 hover:border-indigo-200 rounded-xl p-3.5 shadow-sm hover:shadow-md cursor-pointer transition-all relative group"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-medium text-slate-800 text-sm tracking-tight truncate max-w-[85%]">{lead.name}</h4>
                        <button
                          onClick={(e) => handleDeleteLead(lead.id, e)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-700 mt-1">
                        ₱{lead.value.toLocaleString("en-US")}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${getSourceBadge(lead.source)}`}>
                          {lead.source}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Directory Table View */}
      {viewMode === "list" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Stage Status</th>
                  <th className="p-4 text-right">Value</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-indigo-50/20 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">{lead.name}</td>
                    <td className="p-4">
                      <div className="flex flex-col text-xs text-slate-500 space-y-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{lead.email || "N/A"}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{lead.phone || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium uppercase tracking-wider ${getSourceBadge(lead.source)}`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as Lead["status"])}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-700 font-medium cursor-pointer"
                      >
                        <option value="new">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="proposal">Proposal Sent</option>
                        <option value="won">Closed Won</option>
                        <option value="lost">Closed Lost</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-800">
                      ₱{lead.value.toLocaleString("en-US")}
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteLead(lead.id, e)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-sm text-slate-400">
                      No business leads currently recorded. Add one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Lead Adding Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-display font-semibold text-slate-900">Add New Business Lead</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 font-medium text-sm"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                    placeholder="e.g. Juan Dela Cruz"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      placeholder="e.g. name@host.com"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      placeholder="e.g. +63..."
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lead Source</label>
                  <div className="relative">
                    <select
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                    >
                      <option value="web">Website Form</option>
                      <option value="facebook">Facebook Ads</option>
                      <option value="sms">SMS Outreach</option>
                      <option value="manual">Manual Entry</option>
                    </select>
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Opportunity Value (₱)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium"
                    />
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes & Inquiries</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-slate-800 h-20 resize-none"
                  placeholder="Notes about client requirements..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all mt-4"
              >
                Create Lead Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Lead Detail / Quick Follow-Up Drawer */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white border-l border-slate-100 shadow-2xl z-40 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
            <h3 className="font-display font-semibold text-slate-900 text-base">Lead Tracker Detail</h3>
            <button
              onClick={() => setSelectedLead(null)}
              className="text-slate-400 hover:text-slate-600 font-medium text-sm border border-slate-100 p-1 rounded-lg"
            >
              Close
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Contact Card */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold font-display">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-base">{selectedLead.name}</h4>
                  <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                    Value Opportunity: ₱{selectedLead.value.toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 mt-4 pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedLead.email || "No Email Provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedLead.phone || "No Phone Provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="capitalize">Channel Source: {selectedLead.source}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lead Notes & Inquiries</h4>
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed min-h-16">
                {selectedLead.notes || "No notes captured for this lead profile."}
              </div>
            </div>

            {/* Instant Follow-Up Automator */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Instant Automated Follow-Up</h4>
              <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-600">Select Outreach Channel:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setFollowUpChannel("sms")}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${followUpChannel === "sms" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-800"}`}
                    >
                      SMS Campaign
                    </button>
                    <button
                      onClick={() => setFollowUpChannel("email")}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${followUpChannel === "email" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-800"}`}
                    >
                      Email AutoDraft
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-xl p-3 text-xs text-slate-700 font-mono leading-relaxed mb-3">
                  {getFollowUpTemplate()}
                </div>

                {followUpSentStatus === "sent" ? (
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium rounded-xl animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Follow-up outreach sent on autopilot!
                  </div>
                ) : (
                  <button
                    onClick={triggerMockFollowUp}
                    disabled={followUpSentStatus === "sending"}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {followUpSentStatus === "sending" ? (
                      "Connecting network..."
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Trigger Instant Automated Follow-Up
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
