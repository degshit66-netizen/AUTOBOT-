import React, { useState } from "react";
import { Upload, FileSpreadsheet, Plus, HelpCircle, RefreshCw, CheckCircle, Database, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function DirectivesUploads() {
  const [uploadType, setUploadType] = useState<"leads" | "posts">("leads");
  const [instructions, setInstructions] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // File parsing logic (supports CSV files cleanly)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Parse CSV cleanly
      const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert("The uploaded file does not contain enough rows.");
        return;
      }

      const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
      const rows = lines.slice(1).map(line => {
        // Handle commas inside quoted values
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || "";
        });
        return obj;
      });

      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;

    // Split raw text lines into rows (e.g. name, email, phone format or bullet points)
    const lines = manualInput.split("\n").map(l => l.trim()).filter(Boolean);
    const rows = lines.map((line, idx) => {
      // If it looks like a comma-separated list
      if (line.includes(",")) {
        const parts = line.split(",").map(p => p.trim());
        return {
          Name: parts[0] || `Manual Prospect ${idx + 1}`,
          Email: parts[1] || "",
          Phone: parts[2] || "",
          Value: parts[3] || "5000",
          Notes: parts[4] || "Manually keyed line directive"
        };
      }
      // If just text bullet point
      return {
        Content: line,
        Notes: "Manual line text"
      };
    });

    setParsedRows(rows);
    setFileName("Manual Input Directive");
  };

  const handleProcessWithAI = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/gemini/process-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: parsedRows,
          uploadType: uploadType,
          instructions: instructions,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gemini import processing failed.");
      }

      // Insert mapped items into Firestore databases
      let count = 0;
      const items = result.items || [];

      for (const item of items) {
        if (uploadType === "leads") {
          await addDoc(collection(db, "leads"), {
            name: item.name || `Imported Lead ${count + 1}`,
            email: item.email || "client@example.com",
            phone: item.phone || "+639170000000",
            source: item.source || "manual",
            status: "new",
            notes: item.notes || "Imported via directives spreadsheet.",
            value: parseFloat(item.value) || 2500,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, "scheduled_posts"), {
            content: item.content || "Drafted social autopilot post content template.",
            platforms: item.platforms || ["facebook"],
            scheduledTime: item.scheduledTime || new Date(Date.now() + 3600000 * 24).toISOString(),
            status: "scheduled",
            createdAt: new Date().toISOString()
          });
        }
        count++;
      }

      setSuccessMsg(
        `Autopilot brain successfully mapped columns! ${count} real ${uploadType} imported directly into Firestore CRM db. ${result.message || ""}`
      );
      setParsedRows([]);
      setFileName(null);
      setManualInput("");
      setInstructions("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to process spreadsheet dataset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="directives-uploads-section" className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
          <h3 className="font-display font-semibold text-slate-900 text-base">Directives & Spreadsheet Importer</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
          Instantly migrate datasets of business contacts or batch social copy updates. Upload your standard Excel/CSV templates or type them manually below. Gemini dynamically interprets column alignments, sanitizes inputs, and syncs them straight with your cloud-hosted database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Setup and Files selection */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-fit space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Data Import</h4>

          {/* Import type toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Import Action Target</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setUploadType("leads"); setParsedRows([]); setFileName(null); }}
                className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${uploadType === "leads" ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"}`}
              >
                <Database className="w-3.5 h-3.5" />
                CRM Leads Board
              </button>

              <button
                onClick={() => { setUploadType("posts"); setParsedRows([]); setFileName(null); }}
                className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${uploadType === "posts" ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Social Post Queue
              </button>
            </div>
          </div>

          {/* Custom Instruction Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Mapping Instructions (Optional)</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Set all imported contacts value to ₱5000"
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white text-xs rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Selector Tabs: CSV vs Manual */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">File Upload Option</span>
              <div className="border-2 border-dashed border-slate-200/80 hover:border-indigo-300 rounded-2xl p-6 text-center cursor-pointer relative bg-slate-50/50 hover:bg-slate-50 transition-all">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">Drag & Drop CSV template file</span>
                <span className="text-[10px] text-slate-400 block mt-1">Accepts comma-separated format</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or Manual Raw Input</span>
              </div>
            </div>

            {/* Manual text block */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Paste Data Rows</label>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={uploadType === "leads" ? "Name, Email, Phone, Value, Notes\nCardo Dalisay, cardo@pnp.gov.ph, +63912, 15000, Security Specialist" : "Write post content block here\nPost text content block two"}
                className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-mono h-24 focus:outline-none focus:border-indigo-500 leading-normal"
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Pre-load Manual Directives
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Table preview and submission */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-display font-semibold text-slate-900 text-sm">Spreadsheet Mapping Sandbox Preview</h4>
              {fileName && (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                  {fileName} loaded ({parsedRows.length} items)
                </span>
              )}
            </div>

            {/* Table preview scrollbox */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto mb-4 bg-slate-50/20">
              {parsedRows.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200/60 font-semibold uppercase tracking-wider">
                      {Object.keys(parsedRows[0]).map((key) => (
                        <th key={key} className="p-3 font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white leading-relaxed">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/10">
                        {Object.values(row).map((val: any, sIdx) => (
                          <td key={sIdx} className="p-3 truncate max-w-[140px] font-medium">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-24 text-center">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <p className="text-xs text-slate-400 mt-2">No csv spreadsheet or manual raw data pre-loaded.</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Your preview grid is completely ready for data feed!</p>
                </div>
              )}
            </div>

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-2xl flex items-start gap-2 mb-4 animate-pulse leading-normal">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-3.5 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-indigo-950 block">AI Zero-Config Mapping Guarantee</span>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Gemini translates custom, messy table headers to your target storage schema cleanly. There is zero need to reorganize or rename headers in your spreadsheet file before loading.
                </p>
              </div>
            </div>

            <button
              onClick={handleProcessWithAI}
              disabled={loading || parsedRows.length === 0}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gemini AI mapping dataset...
                </>
              ) : (
                <>
                  <span>Import Data Feed with AI Autopilot</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
