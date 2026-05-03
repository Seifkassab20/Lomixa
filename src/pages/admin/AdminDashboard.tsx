import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { motion, AnimatePresence } from "motion/react";
import {
  getPharmaCompanies,
  savePharmaCompany,
  PharmaCompany,
  getHospitals,
  Hospital,
  getDoctors,
  getSalesReps,
  getBundleRequests,
  saveBundleRequest,
  pushNotification,
  BundleRequest,
  generateId,
  saveTransaction,
  saveHospital,
  deleteHospital,
  deletePharma,
  deleteSalesRep,
  getPharmaBundles,
  savePharmaBundle,
  deletePharmaBundle,
  Bundle,
  syncCloudData,
  getTransactions,
  getAdminBalance,
  getVisits,
  processRepSubscription,
  saveSalesRep,
  Transaction,
} from "@/lib/store";

import { useTranslation } from "react-i18next";
import { TPAAnalysis } from "@/components/shared/TPAAnalysis";

import { useAuth } from "@/lib/auth";
import { getProfile } from "@/lib/store";
import {
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Edit2,
  TrendingUp,
  DollarSign,
  Package,
  ArrowUpRight,
  Activity,
  Hospital as HospitalIcon,
  Stethoscope,
  Clock,
  Check,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

import { useToast } from "../../components/ui/Toast";

export function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const [pharma, setPharma] = useState<PharmaCompany[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<BundleRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeTypeFilter, setIncomeTypeFilter] = useState<string>("all");
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeFromFilter, setIncomeFromFilter] = useState("");
  const [incomeToFilter, setIncomeToFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "verification" | "bundles" | "ecosystem" | "activity" | "income"
  >((urlTab as any) || "activity");

  const [platformBalance, setPlatformBalance] = useState(0);
  const { userId } = useAuth();
  const [adminCountry, setAdminCountry] = useState("sa");

  // Custom Bundle State
  const [editingPharma, setEditingPharma] = useState<PharmaCompany | null>(
    null,
  );
  const [customBundles, setCustomBundles] = useState<Bundle[]>([]);

  // Rejection State
  const [rejectingUser, setRejectingUser] = useState<{
    type: "hospital" | "pharma";
    id: string;
    name: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [isInitializing, setIsInitializing] = useState(true);

  const refresh = () => {
    try {
      setPharma(getPharmaCompanies());
      setHospitals(getHospitals());
      setRequests(getBundleRequests());
      setTransactions(getTransactions());
      setPlatformBalance(getAdminBalance());
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (urlTab === "pharma") setActiveTab("ecosystem");
    else if (urlTab) setActiveTab(urlTab as any);
  }, [urlTab]);

  useEffect(() => {
    console.log("[AdminDashboard] Render start, user:", userId, "country:", adminCountry);
    if (userId) {
      const profile = getProfile(userId);
      setAdminCountry(profile.country || "sa");
    }
    refresh();
  }, [userId]);

  const handleVerifyUser = (type: "hospital" | "pharma", id: string) => {
    if (type === "hospital") {
      const h = hospitals.find((hosp) => hosp.id === id);
      if (h) {
        saveHospital({ ...h, isVerified: true, isActive: true, rejectionReason: "" });
        console.log(
          `[SIMULATED MAIL] To Hospital | ID: ${h.id} | Subject: Infrastructure Verified`,
        );
        if (h.userId)
          pushNotification({
            userId: h.userId,
            title: t("hospitalVerifiedTitle"),
            message: t("hospitalVerifiedMsg"),
            type: "info",
          });
      }
    } else if (type === "pharma") {
      const p = pharma.find((ph) => ph.id === id);
      if (p) {
        savePharmaCompany({ ...p, isVerified: true, isActive: true, rejectionReason: "" });
        console.log(
          `[SIMULATED MAIL] To Pharma | ID: ${p.id} | Subject: Organization Verified`,
        );
        if (p.userId)
          pushNotification({
            userId: p.userId,
            title: t("companyVerifiedTitle"),
            message: t("companyVerifiedMsg"),
            type: "info",
          });
      }
    }
    refresh();
    toast(t("accessGrantedToast"), "success");
  };

  const toggleHospitalStatus = (h: Hospital, forceValue?: boolean) => {
    const isNowActive = forceValue !== undefined ? forceValue : !h.isActive;
    const msg = h.isActive 
      ? t('confirmDeactivateUser')
      : t('confirmActivateUser');

    if (confirm(msg)) {
      const updated = {
        ...h,
        isActive: isNowActive,
      };
      saveHospital(updated);
      refresh();
      toast(
        `${h.name} ${updated.isActive ? "Activated" : "Deactivated"}`,
        "info",
      );
    }
  };

  const initiateReject = (type: "hospital" | "pharma", id: string) => {
    let name = "Unknown";
    if (type === "hospital")
      name = hospitals.find((h) => h.id === id)?.name || name;
    else if (type === "pharma")
      name = pharma.find((p) => p.id === id)?.name || name;

    setRejectingUser({ type, id, name });
  };

  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    const { type, id, name } = rejectingUser;

    console.log(
      `[SIMULATED MAIL] To: ${name} | Subject: Registration Declined | Reason: ${rejectionReason}`,
    );

    if (type === "hospital") {
      deleteHospital(id);
    } else if (type === "pharma") {
      deletePharma(id);
    }

    setRejectingUser(null);
    setRejectionReason("");
    refresh();
    toast(t('regRejected'), "error");
  };

  const handleAddCustomBundle = () => {
    const newBundle: Bundle = {
      id: generateId(),
      name: "New Bundle",
      balance: 1000,
      price: 2500,
      features: ["Visit Funds"],
    };
    setCustomBundles([...customBundles, newBundle]);
  };

  const handleUpdateBundleField = (
    idx: number,
    field: keyof Bundle,
    value: any,
  ) => {
    const updated = [...customBundles];
    updated[idx] = { ...updated[idx], [field]: value };
    setCustomBundles(updated);
  };

  const handleSaveAllBundles = () => {
    if (!editingPharma) return;
    const pharmas = getPharmaCompanies();
    const idx = pharmas.findIndex((p) => p.id === editingPharma.id);
    if (idx >= 0) {
      pharmas[idx].customBundles = customBundles;
      savePharmaCompany(pharmas[idx]);
      refresh();
      toast(t("customBundlesApplied", { name: editingPharma.name }), "success");
      setEditingPharma(null);
    }
  };

  const togglePharmaStatus = (pc: PharmaCompany, forceValue?: boolean) => {
    const isNowActive = forceValue !== undefined ? forceValue : !pc.isActive;
    const msg = pc.isActive 
      ? t('confirmDeactivateUser')
      : t('confirmActivateUser');

    if (confirm(msg)) {
      const updated = {
        ...pc,
        isActive: isNowActive,
      };
      savePharmaCompany(updated);
      refresh();
      toast(
        `${pc.name} ${updated.isActive ? "Activated" : "Deactivated"}`,
        "info",
      );
    }
  };

  const handleApproveRequest = (req: BundleRequest) => {
    console.log(`[AdminDashboard] Approving request:`, req);
    // Try to find the company by ID or UserID for mapping robustness
    const allPharmas = getPharmaCompanies();
    const allReps = getSalesReps();

    if (req.type === "rep") {
      const rep = allReps.find(
        (r) => r.id === req.pharmaId || r.userId === req.pharmaId,
      );
      
      console.log(`[AdminDashboard] Found rep for approval:`, rep ? rep.name : 'NOT FOUND');

      if (rep) {
        processRepSubscription(
          rep.id,
          req.bundleId as any,
          req.price,
          "SAR",
        );
        const updatedReq = { ...req, status: "approved" as const };
        saveBundleRequest(updatedReq);
        refresh();
        syncCloudData(); // Trigger immediate cloud push
        toast(t("subscriptionApproved", { name: req.pharmaName }), "success");
        return;
      } else {
        console.warn(`[AdminDashboard] Rep ${req.pharmaId} not found in sales_reps list.`);
      }
    }

    let pc = allPharmas.find(
      (p) => p.id === req.pharmaId || p.userId === req.pharmaId,
    );

    if (!pc) {
      // If still not found, search by name as last resort then self-heal
      pc = allPharmas.find((p) => p.name === req.pharmaName);
      if (!pc) {
        pc = {
          id: req.pharmaId,
          userId: req.pharmaId,
          name: req.pharmaName,
          balance: 0,
          isActive: true,
          isVerified: true,
        };
      }
    }

    // 1. Add funds to pharma
    const updatedPharma = { ...pc!, balance: (pc!.balance || 0) + req.balance };
    savePharmaCompany(updatedPharma);

    // 2. Update request status
    const updatedReq = { ...req, status: "approved" as const };
    saveBundleRequest(updatedReq);

    // 3. Record transaction
    saveTransaction({
      id: generateId(),
      type: "pharma_deposit",
      amount: req.price,
      currency: "SAR",
      fromId: pc.id,
      fromName: pc.name,
      toId: "admin",
      toName: "Platform Admin",
      relatedId: req.id,
      createdAt: new Date().toISOString(),
    });

    // 4. Notify pharma
    if (pc.userId) {
      pushNotification({
        userId: pc.userId,
        title: t("bundleApprovedTitle"),
        message: t("bundleApprovedMsg", { name: req.bundleName, amount: req.balance }),
        type: "info",
      });
      console.log(
        `[SIMULATED EMAIL] To: ${pc.name} - Bundle Approved: ${req.bundleName}`,
      );
    }

    refresh();
    syncCloudData(); // Trigger immediate cloud cycle
    toast(t("bundleApprovedAndFunded"), "success");
  };

  const handleRejectRequest = (req: BundleRequest) => {
    const updatedReq = { ...req, status: "rejected" as const };
    saveBundleRequest(updatedReq);
    refresh();
    toast(t("bundleRejected"), "error");
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  // Deduplicate everything
  const uniquePharma = useMemo(() => Array.from(
    new Map<string, PharmaCompany>((pharma || []).filter(p => p && p.id).map((p) => [p.id, p])).values(),
  ), [pharma]);

  const uniqueHospitals = useMemo(() => Array.from(
    new Map<string, Hospital>((hospitals || []).filter(h => h && h.id).map((h) => [h.id, h])).values(),
  ), [hospitals]);

  const pendingHosps = useMemo(() => uniqueHospitals.filter((h) => h.isVerified === false), [uniqueHospitals]);
  const pendingPharmas = useMemo(() => uniquePharma.filter((p) => p.isVerified === false), [uniquePharma]);
  const totalPendingVerification = pendingHosps.length + pendingPharmas.length;

  const filteredPharma = useMemo(() => uniquePharma.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()),
  ), [uniquePharma, search]);

  const filteredHospitals = useMemo(() => uniqueHospitals.filter(
    (h) => !search || h.name.toLowerCase().includes(search.toLowerCase()),
  ), [uniqueHospitals, search]);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      if (!tx) return false;
      const s = (incomeSearch || "").toLowerCase();
      const fromN = (tx.fromName || "").toLowerCase();
      const toN = (tx.toName || "").toLowerCase();
      const txId = (tx.id || "").toLowerCase();

      const matchesSearch =
        !incomeSearch || fromN.includes(s) || toN.includes(s) || txId.includes(s);

      const matchesType =
        incomeTypeFilter === "all" || tx.type === incomeTypeFilter;

      const matchesFrom =
        !incomeFromFilter ||
        tx.fromId === incomeFromFilter ||
        fromN.trim() === (incomeFromFilter || "").toLowerCase().trim();

      const matchesTo =
        !incomeToFilter ||
        tx.toId === incomeToFilter ||
        toN.trim() === (incomeToFilter || "").toLowerCase().trim();

      return matchesSearch && matchesType && matchesFrom && matchesTo;
    });
  }, [transactions, incomeSearch, incomeTypeFilter, incomeFromFilter, incomeToFilter]);

  const pagedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, page * pageSize);
  }, [filteredTransactions, page, pageSize]);

  const entityRegistry = useMemo(() => {
    const allDocs = getDoctors();
    const allR = getSalesReps();
    return [
      {
        label: "-- " + t("system") + " --",
        options: [
          { id: "admin", name: "System Admin" },
          { id: "system", name: "System Escrow" },
        ],
      },
      {
        label: "-- " + t("hospitals") + " --",
        options: uniqueHospitals.filter(h => h && h.id).map((h) => ({ id: h.id, name: h.name || "Unnamed Hospital" })),
      },
      {
        label: "-- " + t("pharma") + " --",
        options: uniquePharma.filter(p => p && p.id).map((p) => ({ id: p.id, name: p.name || "Unnamed Pharma" })),
      },
      {
        label: "-- " + t("doctors") + " --",
        options: (allDocs || []).filter(d => d && d.id).map((d) => ({ id: d.id, name: d.name || "Unnamed Doctor" })),
      },
      {
        label: "-- " + t("reps") + " --",
        options: (allR || []).filter(r => r && r.id).map((r) => ({ id: r.id, name: r.name || "Unnamed Rep" })),
      },
    ];
  }, [uniqueHospitals, uniquePharma, t]);

  return (
    <div
      className="space-y-8 pb-12"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-8">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
              {t(
                activeTab === "verification"
                  ? "facilityVerificationDesk"
                  : activeTab === "bundles"
                    ? "pendingApprovalDesk"
                    : activeTab === "ecosystem"
                      ? "ecosystemManagement"
                      : activeTab === "income"
                        ? "incomeHistory"
                        : "dashboard",
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold opacity-60">
              LOMIXA Admin Control Desk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-2xl px-6 py-3">
          <div className="flex flex-col items-end text-brand">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
              {t("platformCommission")}
            </span>
            <span className="text-xl font-black italic tracking-tighter">
              {formatCurrency(platformBalance, adminCountry)}
            </span>
          </div>
          <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="min-w-0">
        {/* --- TAB: VERIFICATION --- */}
        {activeTab === "verification" && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-brand mb-2">
              <ShieldCheck className="w-6 h-6 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">
                {t("facilityVerificationDesk")}
              </h2>
            </div>

            {totalPendingVerification === 0 ? (
              <div className="bg-brand/5 border border-brand/20 rounded-[3rem] p-16 text-center">
                <ShieldCheck className="w-16 h-16 text-brand/20 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-brand uppercase italic tracking-tighter">
                  {t("regionalGridSecure")}
                </h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                  {t("allFacilityVerified")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Hospitals */}
                {pendingHosps.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all border-t-8 border-t-blue-500 shadow-xl relative overflow-hidden group flex flex-col"
                  >
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                        <HospitalIcon className="w-6 h-6" />
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase tracking-widest text-[8px]">
                        {t("facilityCredentials")}
                      </Badge>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-1">
                      {hosp.name}
                    </h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                      {typeof hosp.location === "object"
                        ? `${hosp.location.city || ""}, ${hosp.location.country || ""}`
                        : hosp.location}
                    </p>

                    {!hosp.isActive && (
                      <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-500 mb-1">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Rejected</span>
                        </div>
                        <p className="text-[10px] text-red-400/80 font-bold italic line-clamp-2">
                          {hosp.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <Button
                        className="rounded-2xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-[10px] h-12 shadow-lg shadow-brand/20"
                        onClick={() => handleVerifyUser("hospital", hosp.id)}
                      >
                        {t("accept")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-2xl border border-slate-800 text-slate-500 hover:bg-red-500/10 hover:text-red-500 font-black uppercase italic tracking-widest text-[10px] h-12"
                        onClick={() => initiateReject("hospital", hosp.id)}
                      >
                        {t("reject")}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Pharma */}
                {pendingPharmas.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all border-t-8 border-t-purple-500 shadow-xl relative overflow-hidden group flex flex-col"
                  >
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black uppercase tracking-widest text-[8px]">
                        {t("legalOrganization")}
                      </Badge>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-1">
                      {p.name}
                    </h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                      {t("pharmaEcosystemManagement")}
                    </p>

                    {!p.isActive && (
                      <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-500 mb-1">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Rejected</span>
                        </div>
                        <p className="text-[10px] text-red-400/80 font-bold italic line-clamp-2">
                          {p.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <Button
                        className="rounded-2xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-[10px] h-12 shadow-lg shadow-brand/20"
                        onClick={() => handleVerifyUser("pharma", p.id)}
                      >
                        {t("accept")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-2xl border border-slate-800 text-slate-500 hover:bg-red-500/10 hover:text-red-500 font-black uppercase italic tracking-widest text-[10px] h-12"
                        onClick={() => initiateReject("pharma", p.id)}
                      >
                        {t("reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- PHARMA BUNDLE EDITOR MODAL --- */}
        {editingPharma && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setEditingPharma(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-[3rem] shadow-3xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-brand/5">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-3xl bg-brand/20 flex items-center justify-center text-brand font-black text-4xl shadow-inner border border-brand/30">
                    {editingPharma.name[0]}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                      {t("editCustomBundles")}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
                      {t("modifyingPricingFor").replace(
                        "{{name}}",
                        editingPharma.name,
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="h-14 w-14 rounded-2xl hover:bg-red-500/10 group"
                  onClick={() => setEditingPharma(null)}
                >
                  <X className="w-6 h-6 text-slate-500 group-hover:text-red-500" />
                </Button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-6">
                {customBundles.map((b, bIdx) => (
                  <div
                    key={b.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-brand/30 transition-all flex flex-col sm:flex-row items-center gap-8 group"
                  >
                    <div className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-1">
                            {t("bundleNameLabel")}
                          </Label>
                          <Input
                            value={b.name}
                            onChange={(e) =>
                              handleUpdateBundleField(
                                bIdx,
                                "name",
                                e.target.value,
                              )
                            }
                            className="h-12 bg-black/40 border-slate-800 rounded-xl"
                          />
                        </div>
                         <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-1">
                            {t("balanceIncluded")}
                          </Label>
                          <Input
                            type="number"
                            value={b.balance}
                            onChange={(e) =>
                              handleUpdateBundleField(
                                bIdx,
                                "balance",
                                parseInt(e.target.value),
                              )
                            }
                            className="h-12 bg-black/40 border-slate-800 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-1">
                            {t("priceSAR")}
                          </Label>
                          <Input
                            type="number"
                            value={b.price}
                            onChange={(e) =>
                              handleUpdateBundleField(
                                bIdx,
                                "price",
                                parseInt(e.target.value),
                              )
                            }
                            className="h-12 bg-black/40 border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-1">
                          {t("keyValueProp")}
                        </Label>
                        <Input
                          value={b.features.join(", ")}
                          onChange={(e) =>
                            handleUpdateBundleField(
                              bIdx,
                              "features",
                              e.target.value.split(",").map((s) => s.trim()),
                            )
                          }
                          className="h-12 bg-black/40 border-slate-800 rounded-xl"
                          placeholder="..."
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="h-16 w-16 rounded-3xl group-hover:bg-red-500/10 hover:text-red-500 text-slate-600 border border-slate-800 shrink-0"
                       onClick={() => {
                        if (confirm(t('confirmDeleteBundle'))) {
                          setCustomBundles(
                            customBundles.filter((_, i) => i !== bIdx),
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full h-16 border-dashed border-slate-800 rounded-3xl text-slate-500 hover:text-brand hover:border-brand/50 hover:bg-brand/5 font-black uppercase italic tracking-widest text-xs gap-3"
                  onClick={handleAddCustomBundle}
                >
                  <Plus className="w-4 h-4" /> {t("addPremiumBundleSlot")}
                </Button>
              </div>

              <div className="p-10 border-t border-slate-800 bg-slate-900/30 flex items-center justify-end gap-4">
                <Button
                  variant="ghost"
                  className="h-14 px-8 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-xs"
                  onClick={() => setEditingPharma(null)}
                >
                  {t("discardChanges")}
                </Button>
                <Button
                  className="h-14 px-10 rounded-2xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-xs gap-3 shadow-xl shadow-brand/20"
                  onClick={handleSaveAllBundles}
                >
                  <Save className="w-4 h-4" /> {t("applyCustomPricing")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- TAB: BUNDLE REQUESTS --- */}
        {activeTab === "bundles" && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <CreditCard className="w-6 h-6 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">
                {t("pendingApprovalDesk")}
              </h2>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-[3rem] p-16 text-center">
                <Package className="w-16 h-16 text-blue-500/20 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-blue-500 uppercase italic tracking-tighter">
                  {t("noPendingOrders")}
                </h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                  {t("allBundleRequestsProcessed")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-slate-900/80 border dark:border-slate-800 rounded-[2rem] p-6 shadow-xl border-l-4 border-l-blue-500"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                            {req.pharmaName}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {req.bundleName} {t("bundleRequestDetail")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-brand tracking-tighter">
                          {(() => {
                            const entityCountry = req.type === 'rep' 
                              ? getSalesReps().find(r => r.id === req.pharmaId || r.userId === req.pharmaId)?.location?.country 
                              : pharma.find((p) => p.id === req.pharmaId)?.location?.country;
                            return formatCurrency(req.price, entityCountry || "sa");
                          })()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {req.type === 'rep' ? `${req.balance} Months Access` : formatCurrency(
                            req.balance,
                            pharma.find((p) => p.id === req.pharmaId)?.location?.country || "sa",
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border dark:border-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        <span>{t("cardIdentification")}</span>
                        <span className="text-brand font-bold flex items-center gap-1">
                          {t("verified")} <ShieldCheck className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>{req.cardNumber}</span>
                        <span className="italic">{req.cardHolder}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="rounded-xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-[10px] h-11 shadow-lg"
                        onClick={() => handleApproveRequest(req)}
                      >
                        {t("confirmAndFund")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-xl border border-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-500 font-black uppercase italic tracking-widest text-[10px] h-11"
                        onClick={() => handleRejectRequest(req)}
                      >
                        {t("rejectOrder")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- TAB: ECOSYSTEM MANAGEMENT --- */}
        {activeTab === "ecosystem" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: t("totalPharma"),
                  value: uniquePharma.length,
                  icon: Building2,
                  color: "emerald",
                  trend: "+12%",
                },
                {
                  label: t("totalHospitals"),
                  value: uniqueHospitals.length,
                  icon: HospitalIcon,
                  color: "blue",
                  trend: "+5%",
                },
                {
                  label: t("activeReps"),
                  value: getSalesReps().length,
                  icon: Users,
                  color: "purple",
                  trend: "+18%",
                },
                {
                  label: t("networkDoctors"),
                  value: getDoctors().length,
                  icon: Stethoscope,
                  color: "amber",
                  trend: "+31%",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-app-card border dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group"
                >
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors ${
                      stat.color === "emerald"
                        ? "bg-brand/5 group-hover:bg-brand/10"
                        : stat.color === "blue"
                          ? "bg-blue-500/5 group-hover:bg-blue-500/10"
                          : stat.color === "purple"
                            ? "bg-purple-500/5 group-hover:bg-purple-500/10"
                            : "bg-amber-500/5 group-hover:bg-amber-500/10"
                    }`}
                  ></div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        stat.color === "emerald"
                          ? "bg-brand/10 text-brand"
                          : stat.color === "blue"
                            ? "bg-blue-500/10 text-blue-500"
                            : stat.color === "purple"
                              ? "bg-purple-500/10 text-purple-500"
                              : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-1 rounded-lg flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {stat.value}
                  </div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Ecosystem Units Grid */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                <div className="flex items-center gap-6 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder={t("searchOrganization") || "Search organizations..."}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-12 h-14 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-brand/50 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Grid Density</span>
                      <span className="text-xl font-black italic tracking-tighter text-gray-900 dark:text-white uppercase">{uniquePharma.length + uniqueHospitals.length} Units</span>
                   </div>
                   <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Verification Rate</span>
                      <span className="text-xl font-black italic tracking-tighter text-brand uppercase">
                        {Math.round(((uniquePharma.filter(p => p.isVerified).length + uniqueHospitals.filter(h => h.isVerified).length) / (uniquePharma.length + uniqueHospitals.length || 1)) * 100)}%
                      </span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Pharma Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white">
                        {t("pharmaceuticalGrid") || "Pharmaceutical Grid"}
                      </h3>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black uppercase text-[10px] tracking-widest px-3">
                      {filteredPharma.length} {t("activeUnits") || "Units"}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {filteredPharma.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No pharmaceutical units found</p>
                      </div>
                    ) : (
                      filteredPharma.map((pc) => (
                        <div
                          key={pc.id}
                          className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl transition-all group border-l-4 border-l-purple-500"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-purple-500 font-black text-xl shadow-inner">
                                {pc.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase italic">
                                    {pc.name}
                                  </h4>
                                  {!pc.isActive && (
                                    <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest h-4 px-1.5">
                                      {t("inactive")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {formatCurrency(pc.balance || 0, pc.location?.country || "sa")}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {getSalesReps().filter(r => r.pharmaId === pc.id).length} {t("reps")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 rounded-xl text-blue-500 hover:bg-blue-500/10"
                                onClick={() => {
                                  setEditingPharma(pc);
                                  setCustomBundles(getPharmaBundles(pc.id));
                                }}
                              >
                                <Package className="w-4 h-4" />
                              </Button>
                              <Switch
                                checked={pc.isActive}
                                onCheckedChange={(val) => togglePharmaStatus(pc, val)}
                                className="scale-75"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Hospitals Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <HospitalIcon className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white">
                        {t("healthcareGrid") || "Healthcare Grid"}
                      </h3>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase text-[10px] tracking-widest px-3">
                      {filteredHospitals.length} {t("activeUnits")}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {filteredHospitals.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No healthcare units found</p>
                      </div>
                    ) : (
                      filteredHospitals.map((hosp) => (
                        <div
                          key={hosp.id}
                          className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl transition-all group border-l-4 border-l-blue-500"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500 font-black text-xl shadow-inner">
                                {hosp.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase italic">
                                    {hosp.name}
                                  </h4>
                                  {!hosp.isActive && (
                                    <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest h-4 px-1.5">
                                      {t("inactive")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {hosp.type || 'Hospital'}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {getDoctors().filter(d => d.hospitalId === hosp.id).length} {t("doctors")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={hosp.isActive}
                                onCheckedChange={(val) => toggleHospitalStatus(hosp, val)}
                                className="scale-75"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {/* --- TAB: ECOSYSTEM ACTIVITY --- */}
        {activeTab === "activity" && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 overflow-hidden relative">
              <div className="relative z-10 flex flex-col list-none">
                <TPAAnalysis role="all" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-6">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {t("pharmaPerformance") || "Pharma Performance"}
                  </h3>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-[2.5rem] p-8">
                  <TPAAnalysis role="pharma" hideTitle />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-6">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {t("repPerformance") || "Sales Rep Performance"}
                  </h3>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-[2.5rem] p-8">
                  <TPAAnalysis role="rep" hideTitle />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-6">
                  <HospitalIcon className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {t("hospitalEngagement") || "Hospital Engagement"}
                  </h3>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-[2.5rem] p-8">
                  <TPAAnalysis role="hospital" hideTitle />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-6">
                  <Stethoscope className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {t("doctorAvailability") || "Doctor Availability"}
                  </h3>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-[2.5rem] p-8">
                  <TPAAnalysis role="doctor" hideTitle />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- TAB: INCOME HISTORY --- */}
        {activeTab === "income" && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-500">
                <TrendingUp className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                  Income History & Audit Log
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Real-time Financial Ledger
                </span>
              </div>
            </div>

            {/* --- INCOME FILTERS --- */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
              <div className="flex-1 relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  placeholder="Search transaction ID, sender or recipient..."
                  className="pl-12 h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/40 border dark:border-slate-800 p-1.5 rounded-2xl">
                  <Select
                    value={incomeFromFilter}
                    onChange={(e) => setIncomeFromFilter(e.target.value)}
                    className="h-9 w-44 border-none bg-transparent text-[10px] font-black uppercase tracking-widest italic"
                  >
                    <option value="">
                      {t("fromSource") || "From: All Sources"}
                    </option>
                    {entityRegistry.map((group) => (
                      <optgroup
                        key={group.label}
                        label={group.label}
                        className="bg-slate-900 text-white"
                      >
                        {group.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
                  <Select
                    value={incomeToFilter}
                    onChange={(e) => setIncomeToFilter(e.target.value)}
                    className="h-9 w-44 border-none bg-transparent text-[10px] font-black uppercase tracking-widest italic"
                  >
                    <option value="">
                      {t("toDestination") || "To: All Destinations"}
                    </option>
                    {entityRegistry.map((group) => (
                      <optgroup
                        key={group.label}
                        label={group.label}
                        className="bg-slate-900 text-white"
                      >
                        {group.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                </div>

                {[
                  { id: "all", label: "All Transfers" },

                  { id: "visit_payout", label: "Payouts" },
                  { id: "admin_commission", label: "Commissions" },
                  { id: "pharma_deposit", label: "Deposits" },
                  { id: "rep_subscription", label: "Subscriptions" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setIncomeTypeFilter(f.id)}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all whitespace-nowrap",
                      incomeTypeFilter === f.id
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Transaction ID
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Date/Time
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Type
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      From / To
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {pagedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <Filter className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No matching transactions found in the filtered grid
                        </p>
                        {(incomeSearch ||
                          incomeTypeFilter !== "all" ||
                          incomeFromFilter ||
                          incomeToFilter) && (
                          <button
                            onClick={() => {
                              setIncomeSearch("");
                              setIncomeTypeFilter("all");
                              setIncomeFromFilter("");
                              setIncomeToFilter("");
                            }}
                            className="mt-4 text-[10px] font-black uppercase text-emerald-500 hover:underline"
                          >
                            Reset System Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    pagedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-500">
                          #{(tx.id || "00000000").slice(0, 8)}
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-400">
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="px-8 py-5">
                          <Badge
                            className={cn(
                              "font-black uppercase tracking-widest text-[8px] border-none",
                              tx.type === "visit_payout"
                                ? "bg-blue-500/10 text-blue-500"
                                : tx.type === "admin_commission"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : tx.type === "pharma_deposit"
                                    ? "bg-purple-500/10 text-purple-500"
                                    : tx.type === "rep_subscription"
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-slate-200 text-slate-600",
                            )}
                          >
                            {(tx.type || "transaction").replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black dark:text-white uppercase italic">
                              {tx.fromName || "Unknown Entity"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <ArrowUpRight className="w-2 h-2" />{" "}
                              {tx.toName || "Unknown Entity"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-emerald-500">
                          {formatCurrency(tx.amount || 0, adminCountry || "sa")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length > pageSize && (
              <div className="flex justify-center pt-8 pb-4">
                <Button
                  variant="outline"
                  className="rounded-2xl border-emerald-500/30 text-emerald-500 font-black uppercase italic tracking-widest text-[10px] h-12 px-10 hover:bg-emerald-500/10"
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= filteredTransactions.length}
                >
                  {t("loadMore") || "Load More Transactions"}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>{" "}
      {/* End of min-w-0 */}
      {/* --- REJECTION REASON MODAL --- */}
      <AnimatePresence>
        {rejectingUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setRejectingUser(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0f172a] border border-red-500/20 rounded-[2.5rem] shadow-3xl overflow-hidden"
            >
              <div className="p-10 border-b border-white/5 bg-red-500/5">
                <div className="flex items-center gap-4 mb-2">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                    {t("declineRegistration")}
                  </h3>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  {t("rejectionReasonLabel")}{" "}
                  <span className="text-white">{rejectingUser?.name || ""}</span>
                </p>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">
                    {t("rejectionReasonLabel")}
                  </Label>
                  <textarea
                    autoFocus
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="..."
                    className="w-full min-h-[120px] bg-black/40 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:border-red-500/50 outline-none transition-all font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="ghost"
                    className="h-14 rounded-2xl border border-slate-800 text-slate-500 hover:text-white font-black uppercase italic tracking-widest text-[10px]"
                    onClick={() => setRejectingUser(null)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    disabled={!rejectionReason.trim()}
                    className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-red-500/20"
                    onClick={handleConfirmReject}
                  >
                    {t("confirmRejection")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
