import React, { useState, useEffect } from "react";
import { Key, Globe, ShieldCheck, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";
import { FBPage, FBProfile } from "../types";

interface FBTokenSetupProps {
  onPageSelected: (page: FBPage | null) => void;
  activePage: FBPage | null;
}

export default function FBTokenSetup({ onPageSelected, activePage }: FBTokenSetupProps) {
  const [tokenInput, setTokenInput] = useState(() => localStorage.getItem("fb_access_token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagesList, setPagesList] = useState<FBPage[]>([]);
  const [profile, setProfile] = useState<FBProfile | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Clear connection
  const handleDisconnect = () => {
    localStorage.removeItem("fb_access_token");
    localStorage.removeItem("fb_selected_page");
    setTokenInput("");
    setPagesList([]);
    setProfile(null);
    onPageSelected(null);
    setError(null);
  };

  const handleConnect = async (tokenToUse = tokenInput) => {
    if (!tokenToUse.trim()) {
      setError("Please enter a valid Facebook User or Page Access Token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/facebook/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-facebook-token": tokenToUse.trim(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to authenticate token with Facebook.");
      }

      localStorage.setItem("fb_access_token", tokenToUse.trim());
      setProfile(data.user);
      setPagesList(data.pages);

      // Auto-select first page if none is selected
      if (data.pages && data.pages.length > 0) {
        const savedPageId = localStorage.getItem("fb_selected_page_id");
        const match = data.pages.find((p: FBPage) => p.id === savedPageId);
        const pageToSelect = match || data.pages[0];
        handleSelectPage(pageToSelect);
      } else {
        setError("Token is valid, but no Facebook Pages were found for this account. App is running in Sandbox Mode for page automation.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while linking Facebook.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = (page: FBPage) => {
    localStorage.setItem("fb_selected_page_id", page.id);
    onPageSelected(page);
  };

  // Auto-connect if token exists on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("fb_access_token");
    if (savedToken) {
      handleConnect(savedToken);
    }
  }, []);

  return (
    <div id="fb-token-setup-card" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            Meta Facebook Integration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Connect your Facebook Page Token to automate real publishing and capture leads.
          </p>
        </div>

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Setup Instructions"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {showInstructions && (
        <div className="mb-6 bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-4 text-xs text-indigo-950 leading-relaxed">
          <h3 className="font-semibold text-indigo-900 mb-1 flex items-center gap-1">
            How to get your Facebook Page Access Token:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 mt-2">
            <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium text-indigo-600">Meta for Developers</a>.</li>
            <li>Create an app of type <strong className="text-slate-800">Business</strong> or <strong className="text-slate-800">Other</strong>.</li>
            <li>Under products, select <strong className="text-slate-800">Facebook Login for Business</strong> or use the <strong className="text-slate-800">Graph API Explorer</strong>.</li>
            <li>Request scopes: <code className="bg-white px-1.5 py-0.5 rounded border">pages_show_list</code>, <code className="bg-white px-1.5 py-0.5 rounded border">pages_read_engagement</code>, and <code className="bg-white px-1.5 py-0.5 rounded border">pages_manage_posts</code>.</li>
            <li>Generate a Page Access Token and paste it below.</li>
          </ol>
        </div>
      )}

      {/* Connection Status Badge */}
      <div className="mb-6 p-4 rounded-xl flex items-center justify-between border transition-all duration-300 bg-slate-50/50 border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${activePage ? "bg-emerald-500" : "bg-amber-400"}`} />
          <div>
            <div className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
              {activePage ? (
                <>
                  Live Integration Active
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </>
              ) : (
                "Sandbox Simulator Mode"
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activePage
                ? `Connected to: "${activePage.name}" (Page ID: ${activePage.id})`
                : "Using high-fidelity sandbox. Enter a Meta token below to toggle live mode."}
            </p>
          </div>
        </div>

        {activePage && (
          <button
            onClick={handleDisconnect}
            className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100/50 px-2.5 py-1.5 rounded-lg"
          >
            Disconnect page
          </button>
        )}
      </div>

      {!activePage && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Meta Page Access Token (or User Token)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="EAA..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all pr-10 font-mono text-slate-600"
              />
              <Globe className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleConnect()}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying with Meta...
                </>
              ) : (
                "Link Facebook Account"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Available Pages list (if logged in and multiple pages found) */}
      {!activePage && pagesList.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Select Facebook Page to Link
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {pagesList.map((page) => (
              <div
                key={page.id}
                onClick={() => handleSelectPage(page)}
                className="flex items-center justify-between p-2.5 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-xl cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  {page.picture ? (
                    <img src={page.picture} alt={page.name} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                      {page.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-slate-800 text-sm">{page.name}</h4>
                    <p className="text-xs text-slate-500">{page.category || "Facebook Page"}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  Select
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
