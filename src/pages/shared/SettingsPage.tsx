import React, { useState, useEffect } from "react";
import {
  getProfile,
  saveProfile,
  getPharmaCompanies,
  savePharmaCompany,
  getSalesReps,
  saveSalesRep,
  getDoctors,
  saveDoctor,
  getHospitals,
  saveHospital,
} from "@/lib/store";
import { convertCurrency, CountryCode } from "@/lib/currency";
import { sendEmail, EmailTemplates } from "@/lib/email";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Building2,
  Save,
  CheckCircle2,
  MapPin,
  Globe,
  Shield,
  Lock,
  Image as ImageIcon,
  Camera,
  Upload,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/Toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { Palette, Sparkles, Layout } from "lucide-react";
import { ARABIC_COUNTRY_CODES, COUNTRIES, CITY_MAP, SPECIALTIES } from "@/lib/constants";

export function SettingsPage() {
  const { userId, user, role } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [form, setForm] = useState({
    fullName: "",
    phoneCode: "+966",
    phone: "",
    organization: "",
    country: "sa",
    city: "",
    bio: "",
    email: "",
    avatar: "",
    newPassword: "",
    specialty: "",
    hospitalId: "default",
    facilityType: "hospital" as "hospital" | "clinic",
  });

  const [testApiKey, setTestApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const { theme, preset, setTheme, setPreset } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      const profile = getProfile(userId);
      const companies = getPharmaCompanies();
      const pharmaEntity = companies.find(
        (c) => c.userId === userId || c.id === userId,
      );
      const repEntity = getSalesReps().find(
        (r) => r.userId === userId || r.id === userId,
      );
      const doctorEntity = getDoctors().find(
        (d) => d.userId === userId || d.id === userId,
      );
      const hospitalEntity = getHospitals().find(
        (h) => h.userId === userId || h.id === userId,
      );

      const entity =
        pharmaEntity || repEntity || doctorEntity || hospitalEntity;

      const rawPhone =
        entity?.phone || profile.phone || user?.user_metadata?.mobile || "";

      // Try to extract country code from existing phone
      let extractedCode = "+966";
      let extractedNumber = rawPhone;

      for (const c of ARABIC_COUNTRY_CODES) {
        if (rawPhone.startsWith(c.code)) {
          extractedCode = c.code;
          extractedNumber = rawPhone.slice(c.code.length);
          break;
        }
      }

      setForm({
        fullName:
          entity?.name ||
          profile.fullName ||
          user?.user_metadata?.full_name ||
          "",
        phoneCode: extractedCode,
        phone: extractedNumber,
        organization:
          pharmaEntity?.name ||
          profile.organization ||
          user?.user_metadata?.organization ||
          "",
        country:
          (entity?.location?.country as string) ||
          profile.country ||
          user?.user_metadata?.country ||
          "sa",
        city:
          (entity?.location?.city as string) ||
          profile.city ||
          user?.user_metadata?.city ||
          "",
        bio: profile.bio || "",
        email: user?.email || "",
        avatar:
          (entity?.avatar as string) ||
          profile.avatar ||
          user?.user_metadata?.avatar_url ||
          "",
        newPassword: "",
        specialty: doctorEntity?.specialty || "",
        hospitalId: doctorEntity?.hospitalId || "default",
        facilityType: (role === "hospital" ? (entity as any)?.type : "hospital") || "hospital",
      });

    }
  }, [userId, user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const finalData = {
      ...form,
      phone: `${form.phoneCode}${form.phone}`,
    };

    // Update generic profile
    saveProfile(userId, finalData);

    // Update specific account entity (the actual business record)
    if (role === "pharma") {
      const all = getPharmaCompanies();
      const pc = all.find((c) => c.userId === userId || c.id === userId);
      if (pc) {
        const oldCountry = pc.location?.country || "sa";
        const newCountry = form.country;
        let newBalance = pc.balance;

        // Convert balance if country changes to preserve value
        if (oldCountry !== newCountry) {
          newBalance = convertCurrency(
            pc.balance,
            oldCountry as CountryCode,
            newCountry as CountryCode,
          );
        }

        savePharmaCompany({
          ...pc,
          name: form.organization || pc.name,
          phone: finalData.phone,
          balance: newBalance,
          avatar: form.avatar,
          location: {
            ...(pc.location || {}),
            country: form.country,
            city: form.city,
          },
        });
      }
    } else if (role === "rep") {
      const all = getSalesReps();
      const r = all.find((s) => s.userId === userId || s.id === userId);
      if (r) {
        const oldCountry = r.location?.country || "sa";
        const newCountry = form.country;
        let newBalance = r.balance || 0;

        if (oldCountry !== newCountry) {
          newBalance = convertCurrency(
            r.balance || 0,
            oldCountry as CountryCode,
            newCountry as CountryCode,
          );
        }

        saveSalesRep({
          ...r,
          name: form.fullName,
          phone: finalData.phone,
          balance: newBalance,
          avatar: form.avatar,
          location: {
            ...(r.location || {}),
            country: form.country,
          },
        });
      }
    } else if (role === "doctor") {
      const all = getDoctors();
      const d = all.find((doc) => doc.userId === userId || doc.id === userId);
      if (d) {
        const oldCountry = d.location?.country || "sa";
        const newCountry = form.country;
        let newBalance = d.balance || 0;

        if (oldCountry !== newCountry) {
          newBalance = convertCurrency(
            d.balance || 0,
            oldCountry as CountryCode,
            newCountry as CountryCode,
          );
        }

        saveDoctor({
          ...d,
          name: form.fullName,
          phone: finalData.phone,
          balance: newBalance,
          avatar: form.avatar,
          location: {
            ...(d.location || {}),
            country: form.country,
          },
          specialty: form.specialty || d.specialty,
        });
      }
    } else if (role === "hospital") {
      const all = getHospitals();
      const h = all.find(
        (hosp) => hosp.userId === userId || hosp.id === userId,
      );
      if (h) {
        saveHospital({
          ...h,
          name: form.fullName,
          phone: finalData.phone,
          avatar: form.avatar,
          location: {
            ...(typeof h.location === "object" ? h.location : {}),
            country: form.country,
          },
          type: form.facilityType,
        });
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast(t("profileUpdated") || "Changes Saved", "success");
  };

  const handleVerifyEmail = async () => {
    if (!form.email) return;
    setVerifyingEmail(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ email: form.email });
        if (error) throw error;
      }
      toast(
        t("verificationSentEmail") || "Verification link sent to your email.",
        "success",
      );
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyPhone = async () => {
    const fullPhone = `${form.phoneCode}${form.phone}`;
    if (!form.phone) return;
    setVerifyingPhone(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ phone: fullPhone });
        if (error) throw error;
        setOtpSent(true);
      }
      toast(
        t("verificationSentPhone") || "Verification code sent to your mobile.",
        "success",
      );
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!otpCode) return;
    setVerifyingOtp(true);
    const fullPhone = `${form.phoneCode}${form.phone}`;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otpCode,
          type: "phone_change",
        });
        if (error) throw error;
      }
      setOtpSent(false);
      setOtpCode("");
      toast("Phone number verified successfully!", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast("File is too large (max 2MB)", "error");
      return;
    }

    try {
      let avatarUrl = "";
      if (isSupabaseConfigured) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${userId}/${Math.random()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file);

        if (uploadError) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setForm((f) => ({ ...f, avatar: result }));
            if (userId) {
              const current = getProfile(userId);
              saveProfile(userId, { ...current, avatar: result });
              toast("Profile picture updated!", "success");
            }
          };
          reader.readAsDataURL(file);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = publicUrl;
        setForm((f) => ({ ...f, avatar: avatarUrl }));
        if (userId) {
          const current = getProfile(userId);
          saveProfile(userId, { ...current, avatar: avatarUrl });
          toast("Profile picture updated and synced!", "success");
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setForm((f) => ({ ...f, avatar: result }));
          if (userId) {
            const current = getProfile(userId);
            saveProfile(userId, { ...current, avatar: result });
            toast("Profile picture updated!", "success");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      toast("Upload failed: " + err.message, "error");
    }
  };

  const roleKeys: Record<string, string> = {
    pharma: "pharmaCompanyFull",
    hospital: "hospital",
    doctor: "doctor",
    rep: "salesRep",
  };
  
  const isAffiliatedDoctor = role === "doctor" && form.hospitalId && form.hospitalId !== "default";
  const showOrgField = role === "doctor" || role === "rep";



  return (
    <div className="space-y-8 max-w-3xl pb-12">
      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-20 w-20 rounded-[2rem] bg-brand-muted border-2 border-dashed border-brand/30 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand group-hover:bg-brand/20">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-brand/40" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-brand hover:text-white transition-all shadow-lg shadow-black/10 transition-transform hover:scale-110 active:scale-90">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
              {t("settingsTitle")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {t("manageProfileDescription") ||
                "Update your personal and organizational profile"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-muted border border-brand/20">
          <Shield className="w-4 h-4 text-brand" />
          <span className="text-[10px] font-black uppercase text-brand tracking-widest">
            {role ? t(roleKeys[role]) : "User"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("identity_sec") || "Identity"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t("identity_desc") ||
                "Your basic account information and contact details."}
            </p>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                  {t("fullNameLabel")}
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                  <Input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    className="pl-12 h-12 rounded-xl bg-app-card dark:border-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">
                    {t("phoneNumber")}
                  </Label>
                  {user?.phone_confirmed_at ? (
                    <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      disabled={verifyingPhone || !form.phone}
                      className="text-[9px] font-bold text-amber-500 hover:text-amber-400 uppercase underline decoration-amber-500/20 underline-offset-2 transition-colors disabled:opacity-50"
                    >
                      {verifyingPhone ? "Sending..." : "Verify Now"}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative w-28 shrink-0 group">
                    <select
                      value={form.phoneCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = ARABIC_COUNTRY_CODES.find(c => c.code === code);
                        setForm((f) => ({ 
                          ...f, 
                          phoneCode: code,
                          country: match?.countryId || f.country,
                          city: match?.countryId && match.countryId !== f.country ? "" : f.city
                        }));
                      }}
                      className="w-full h-12 pl-3 pr-8 rounded-xl bg-app-card border border-slate-200 dark:border-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                    >
                      {ARABIC_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative group flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="pl-12 h-12 rounded-xl bg-app-card dark:border-slate-800"
                      placeholder="5XXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 col-span-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-emerald-600">
                      Enter Verification Code
                    </Label>
                    <button
                      onClick={() => setOtpSent(false)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="h-10 text-center tracking-[1em] font-black text-lg bg-white dark:bg-slate-900 border-emerald-500/30"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={handleConfirmOtp}
                      disabled={verifyingOtp || otpCode.length < 6}
                      className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6 rounded-xl"
                    >
                      {verifyingOtp ? "..." : "Verify"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showOrgField && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                    {role === "doctor" ? t("hospital") : t("pharmaCompany")}
                  </Label>
                   <div className={cn("relative group", isAffiliatedDoctor && "opacity-60")}>
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <Input
                      value={form.organization}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, organization: e.target.value }))
                      }
                      disabled={isAffiliatedDoctor}

                      placeholder={
                        role === "doctor" ? t("hospital") : t("pharmaCompany")
                      }
                      className="pl-12 h-12 rounded-xl bg-app-card dark:border-slate-800"
                    />
                  </div>
                </div>
              )}
              {role === "hospital" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                    {t("facilityType") || "Organization Type"}
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { id: "hospital", label: t("hospital") },
                      { id: "clinic", label: t("clinic") }
                    ].map(t => {
                      const isActive = form.facilityType === t.id;
                      if (!isActive) return null; // Show ONLY the current type
                      return (
                        <div
                          key={t.id}
                          className="flex-1 h-12 rounded-xl text-xs font-black uppercase flex items-center justify-center tracking-widest italic bg-brand text-white shadow-lg shadow-brand/20 border border-brand/10"
                        >
                          {t.label}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 ml-1 italic">
                    Organization type is linked to your registration and cannot be changed here.
                  </p>
                </div>
              )}

              {role === "doctor" && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                    {t("specialty")}
                  </Label>
                  <div className="relative group">
                    <select
                      value={form.specialty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, specialty: e.target.value }))
                      }
                      className="w-full h-12 pl-4 pr-10 rounded-xl bg-app-card border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none font-bold"
                    >
                      <option value="">{t("selectSpecialty") || "Select Specialty"}</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {t(s.toLowerCase().replace(" ", "")) || s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t dark:border-slate-800">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("location_sec") || "Location"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t("location_desc_settings") ||
                "Update your regional presence and contact address."}
            </p>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                  {t("country")} *
                </Label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <select
                    name="country"
                    value={form.country}
                    onChange={(e) => {
                      const countryId = e.target.value;
                      const match = ARABIC_COUNTRY_CODES.find(c => c.countryId === countryId);
                      setForm((f) => ({
                        ...f,
                        country: countryId,
                        phoneCode: match?.code || f.phoneCode,
                        city: "",
                      }));
                    }}
                    className="w-full h-12 pl-12 pr-10 rounded-xl bg-app-card border border-app-border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                  {t("city")} ({t("optional")})
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <select
                    name="city"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className="w-full h-12 pl-12 pr-10 rounded-xl bg-app-card border border-app-border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                  >
                    <option value="">
                      {t("selectCity") || "Select city..."}
                    </option>
                    {CITY_MAP[form.country]?.map((c) => (
                      <option key={c} value={c}>
                        {t(`city_${c.replace(/^city_/, "").toLowerCase().replace(/\s+/g, "_")}`, c.replace(/^city_/, ""))}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t dark:border-slate-800">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("security_sec") || "Account & Security"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t("security_desc") || "Manage your email and update password."}
            </p>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">
                  {t("emailLabel")}
                </Label>
                {user?.email_confirmed_at ? (
                  <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={verifyingEmail || !form.email}
                    className="text-[9px] font-bold text-amber-500 hover:text-amber-400 uppercase underline decoration-amber-500/20 underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    {verifyingEmail ? "Sending..." : "Verify Email"}
                  </button>
                )}
              </div>
              <div className="relative group opacity-60">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={form.email}
                  disabled
                  className="pl-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">
                {t("newPassword") || "New Password"}
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="pl-12 h-12 rounded-xl bg-app-card dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t dark:border-slate-800">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand" />
              {t("design_sec") || "Design & Appearance"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t("design_desc") ||
                "Personalize your dashboard experience with color presets."}
            </p>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "emerald",
                  name: "Emerald Oasis",
                  color: "bg-[#10b981]",
                  desc: t("classic_medical") || "Classic Clinical",
                },
                {
                  id: "sapphire",
                  name: "Sapphire Grid",
                  color: "bg-[#4f46e5]",
                  desc: t("modern_tech") || "Modern Tech",
                },
                {
                  id: "oasis",
                  name: "Desert Oasis",
                  color: "bg-[#0d9488]",
                  desc: t("warm_premium") || "Warm Premium",
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id as any)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left group",
                    preset === p.id
                      ? "border-brand bg-brand-muted"
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                  )}
                >
                  <div
                    className={cn("h-8 w-8 rounded-lg mb-3 shadow-lg", p.color)}
                  />
                  <span
                    className={cn(
                      "text-xs font-black uppercase tracking-tight",
                      preset === p.id
                        ? "text-brand"
                        : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col gap-4 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Mail className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">
                  Communication Debugger
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Verify real-time email triggers for{" "}
                  <strong>{form.email}</strong>
                </p>
              </div>
              <Button
                type="button"
                onClick={async () => {
                  const template = EmailTemplates.welcome(
                    form.fullName || "User",
                  );
                  const result: any = await sendEmail(
                    { to: form.email, ...template },
                    testApiKey,
                  );
                  if (result.mode === "live") {
                    toast(
                      "Real-time test email dispatched successfully.",
                      "success",
                    );
                  } else if (result.mode === "demo") {
                    toast(
                      "Demo Email Triggered! Check your browser console (F12) to see raw content.",
                      "info",
                    );
                  } else {
                    toast("Email trigger processed.", "success");
                  }
                }}
                className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-12 px-6 shadow-lg shadow-indigo-500/20"
              >
                Send Test Email
              </Button>
            </div>

            <div className="mt-2 space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/70 ml-1">
                Testing API Key (Resend)
              </Label>
              <Input
                placeholder="Add ur API Key"
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                type="password"
                className="h-12 rounded-xl bg-white dark:bg-slate-900 border-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
              />
              <p className="text-[9px] text-slate-400 ml-1 italic">
                For security, this key is only stored in memory for the current
                session.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t dark:border-slate-800 flex items-center justify-end gap-4">
          {saved && (
            <span className="text-xs font-bold uppercase tracking-widest text-brand italic flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("profileUpdated") || "Changes Saved"}
            </span>
          )}
          <Button
            type="submit"
            disabled={saved}
            className="h-12 px-10 rounded-2xl bg-brand hover:bg-brand-dark text-brand-foreground font-black uppercase tracking-widest italic transition-all shadow-xl shadow-brand/10"
          >
            {saved ? t("saved") : t("save_changes") || "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
