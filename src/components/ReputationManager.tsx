import React, { useState, useEffect } from "react";
import { Star, ShieldAlert, Sparkles, RefreshCw, MessageSquare, Plus, CheckCircle, Globe, AlertCircle, Trash2, Send } from "lucide-react";
import { Review } from "../types";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export default function ReputationManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unanswered" | "responded">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [draftResponseId, setDraftResponseId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  // Customer Review Submission Simulator (Inline Public Form)
  const [showPublicReviewForm, setShowPublicReviewForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerRating, setCustomerRating] = useState(5);
  const [customerComment, setCustomerComment] = useState("");
  const [customerPlatform, setCustomerPlatform] = useState<"google" | "facebook">("google");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Firestore sync with local state fallback
  useEffect(() => {
    const reviewsCollection = collection(db, "reviews");
    const unsubscribe = onSnapshot(
      reviewsCollection,
      (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Review);
        });
        // Sort by createdAt desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(list);
        localStorage.setItem("business_reviews_backup", JSON.stringify(list));
      },
      (error) => {
        console.warn("Firestore reviews read warning, using local state:", error);
        const backup = localStorage.getItem("business_reviews_backup");
        if (backup) {
          setReviews(JSON.parse(backup));
        } else {
          // Predefined default reviews
          const defaults: Review[] = [
            { id: "rev-1", author: "Angelo Santos", rating: 5, content: "Sobra ang laking tulong ng STRATIFY! Literal na nakakatipid kami ng 15-20 hours sa enterprise workflows at campaign strategies weekly.", platform: "google", status: "responded", aiResponse: "Salamat nang marami, Angelo! Masaya kaming makatulong sa pag-automate ng inyong complex workflows. Nandito lang ang STRATIFY para gabayan kayo.", respondedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
            { id: "rev-2", author: "Kristina Cruz", rating: 5, content: "The lead capturing and automatic Gemini operations are phenomenal. Our enterprise scale response time has decreased to seconds.", platform: "facebook", status: "unanswered", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
            { id: "rev-3", author: "Mark Thompson", rating: 4, content: "Incredible system development suite. Perfect for our large-scale operations across Google and Facebook channels.", platform: "google", status: "unanswered", createdAt: new Date(Date.now() - 3600000 * 48).toISOString() }
          ];
          setReviews(defaults);
        }
        handleFirestoreError(error, OperationType.GET, "reviews");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDraftAIResponse = async (review: Review) => {
    setLoadingId(review.id);
    try {
      const response = await fetch("/api/gemini/review-respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reviewAuthor: review.author,
          reviewContent: review.content,
          rating: review.rating,
          businessContext: "STRATIFY (System+ Strategy) System Development - an enterprise-grade platform specializing in premium systems strategy, CRM boards, automated co-pilots, and advanced social deployment."
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI response.");
      }

      setDraftResponseId(review.id);
      setDraftText(data.reply);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred drafting review response.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveResponse = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, {
        status: "responded",
        aiResponse: draftText,
        respondedAt: new Date().toISOString()
      });
      setDraftResponseId(null);
      setDraftText("");
    } catch (err) {
      console.warn("Firestore update response failed, updating locally:", err);
      const updatedList = reviews.map((r) =>
        r.id === reviewId ? { ...r, status: "responded" as const, aiResponse: draftText, respondedAt: new Date().toISOString() } : r
      );
      setReviews(updatedList);
      localStorage.setItem("business_reviews_backup", JSON.stringify(updatedList));
      setDraftResponseId(null);
      setDraftText("");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review from list?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (err) {
      console.warn("Firestore delete review failed, updating locally:", err);
      const updatedList = reviews.filter((r) => r.id !== reviewId);
      setReviews(updatedList);
      localStorage.setItem("business_reviews_backup", JSON.stringify(updatedList));
    }
  };

  const handleCreateCustomerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerComment.trim()) return;

    const newReviewData = {
      author: customerName,
      rating: customerRating,
      content: customerComment,
      platform: customerPlatform,
      status: "unanswered" as const,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "reviews"), newReviewData);
      setSubmitSuccess(true);
      setCustomerName("");
      setCustomerComment("");
      setCustomerRating(5);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowPublicReviewForm(false);
      }, 2500);
    } catch (err) {
      console.warn("Creating review in firestore failed, updating locally:", err);
      const tempReview: Review = {
        id: "temp-" + Date.now(),
        ...newReviewData
      };
      const updatedList = [tempReview, ...reviews];
      setReviews(updatedList);
      localStorage.setItem("business_reviews_backup", JSON.stringify(updatedList));
      setSubmitSuccess(true);
      setCustomerName("");
      setCustomerComment("");
      setCustomerRating(5);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowPublicReviewForm(false);
      }, 2500);
    }
  };

  const filteredReviews = reviews.filter((rev) => {
    if (activeTab === "unanswered") return rev.status === "unanswered";
    if (activeTab === "responded") return rev.status === "responded";
    return true;
  });

  const ratingStats = {
    average: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "5.0",
    total: reviews.length,
    fiveStars: reviews.filter(r => r.rating === 5).length,
    fourStars: reviews.filter(r => r.rating === 4).length,
  };

  return (
    <div id="reputation-manager-section" className="space-y-6">
      {/* Top Banner and Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating Score</span>
          <div className="text-4xl font-display font-extrabold text-slate-900 mt-2 flex items-center justify-center gap-1.5">
            {ratingStats.average}
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on {ratingStats.total} customer responses</p>

          <button
            onClick={() => setShowPublicReviewForm(!showPublicReviewForm)}
            className="mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {showPublicReviewForm ? "Close Review Simulator" : "Simulate Public Feedback Link"}
          </button>
        </div>

        {/* Breakdown bar graph */}
        <div className="md:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-slate-800 text-sm">Review Channels Performance</h4>
            <p className="text-xs text-slate-400">Capturing positive online presence on Autopilot</p>
          </div>

          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                <span>Google Reviews</span>
                <span>{reviews.filter(r => r.platform === "google").length} submissions</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all"
                  style={{ width: `${reviews.length ? (reviews.filter(r => r.platform === "google").length / reviews.length) * 100 : 50}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                <span>Facebook Reviews</span>
                <span>{reviews.filter(r => r.platform === "facebook").length} submissions</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${reviews.length ? (reviews.filter(r => r.platform === "facebook").length / reviews.length) * 100 : 50}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Review Form Simulator */}
      {showPublicReviewForm && (
        <div className="bg-gradient-to-r from-indigo-50/50 to-sky-50/30 border border-indigo-100/50 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="max-w-xl mx-auto">
            <h3 className="font-display font-semibold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <Globe className="w-4.5 h-4.5 text-indigo-500" />
              Public Customer Review Page Simulator
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This mimics what your clients see when they click your "Share Review" feedback request link. Submit a rating to populate the CRM.
            </p>

            <form onSubmit={handleCreateCustomerReview} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Angelo Santos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Submit To Channel</label>
                  <select
                    value={customerPlatform}
                    onChange={(e) => setCustomerPlatform(e.target.value as "google" | "facebook")}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="google">Google Maps Profile</option>
                    <option value="facebook">Facebook Page Feed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Star Score Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCustomerRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= customerRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Write your experience / comment</label>
                <textarea
                  required
                  value={customerComment}
                  onChange={(e) => setCustomerComment(e.target.value)}
                  className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 h-20 resize-none leading-relaxed"
                  placeholder="Tell us what you think about our services..."
                />
              </div>

              {submitSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Your feedback submitted successfully! Syncing with CRM...
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-all shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review List Filter tabs */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`text-xs font-medium pb-2 border-b-2 transition-all ${activeTab === "all" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab("unanswered")}
            className={`text-xs font-medium pb-2 border-b-2 transition-all ${activeTab === "unanswered" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}
          >
            Pending ({reviews.filter((r) => r.status === "unanswered").length})
          </button>
          <button
            onClick={() => setActiveTab("responded")}
            className={`text-xs font-medium pb-2 border-b-2 transition-all ${activeTab === "responded" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}
          >
            Replied ({reviews.filter((r) => r.status === "responded").length})
          </button>
        </div>
      </div>

      {/* Review items feed */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold font-display flex items-center justify-center text-sm">
                  {rev.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{rev.author}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      via {rev.platform}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rev.status === "responded" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                  {rev.status}
                </span>

                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Review content comment */}
            <p className="text-xs text-slate-600 leading-relaxed pl-12">
              "{rev.content}"
            </p>

            {/* Review AI draft panel or completed response */}
            <div className="pl-12 pt-3 border-t border-slate-100/60">
              {rev.status === "responded" ? (
                <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-center gap-1 font-semibold text-slate-800 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    AI Autopilot Response Deployed:
                  </div>
                  <p className="italic">"{rev.aiResponse}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {draftResponseId === rev.id ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        Gemini AI Generated Response Draft:
                      </div>
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 h-24 resize-none leading-relaxed text-slate-700"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setDraftResponseId(null);
                            setDraftText("");
                          }}
                          className="px-3 py-1.5 border border-slate-100 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => handleSaveResponse(rev.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Publish & Sync Response
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDraftAIResponse(rev)}
                      disabled={loadingId === rev.id}
                      className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-indigo-100/40"
                    >
                      {loadingId === rev.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Drafting Response...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          Generate AI Response Draft
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
            <p className="text-sm text-slate-500 mt-2 font-medium">No reviews found matching filter</p>
            <p className="text-xs text-slate-400 mt-0.5">Toggle the Simulator button above to insert feedback instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
