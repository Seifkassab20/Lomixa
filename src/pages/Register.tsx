import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Activity,
  Stethoscope,
  Briefcase,
  Camera,
  MapPin,
  User,
  Shield,
  Check,
  ArrowRight,
  Eye,
  Upload,
  Plus,
  X,
  PlusCircle,
  LayoutGrid,
  Sparkles,
  Lock,
  ChevronRight,
  ShieldCheck,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  FileText,
  Trash2,
  ChevronDown,
  Clock,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/Toast";
import {
  saveDoctor,
  saveHospital,
  savePharmaCompany,
  saveSalesRep,
  getPharmaCompanies,
  getHospitals,
  generateId,
  pushNotification,
  getBundles,
  saveBundleRequest,
  useStoreListener,
  checkUserExistence,
  deleteUserEntity,
  saveProfile,
} from "@/lib/store";

import { sendEmail, EmailTemplates } from "@/lib/email";
import { emailService } from "@/lib/emailService";
import { motion, AnimatePresence } from "motion/react";
import {
  ARABIC_COUNTRY_CODES,
  COUNTRIES,
  CITY_MAP,
  SPECIALTIES,
} from "@/lib/constants";
import { REP_PLANS, getPriceForCountry } from "@/lib/plans";
import { getCurrencyInfo } from "@/lib/currency";
import logo from "@/assets/logo.svg";


const DOCTOR_TITLES = [
  "Dr.",
  "Prof.",
  "Assoc. Prof.",
  "Asst. Prof.",
  "Consultant",
  "Specialist",
];
const REP_ROLES = [
  "Medical Representative",
  "Sales Supervisor",
  "District Manager",
  "Marketing Manager",
  "Product Manager",
  "Sales Manager",
  "Sales Director",
  "Marketing Director",
  "Business Dev Manager",
  "Business Dev Director",
];
const PHARMA_CATEGORIES = [
  "Analgesics",
  "Antipyretics",
  "Antibiotics",
  "Antivirals",
  "Antifungals",
  "Antineoplastics",
  "Cardiovascular",
  "Dermatological",
  "Endocrine",
  "Gastrointestinal",
  "Genitourinary",
  "Hematological",
  "Immunological",
  "Metabolic",
  "Neurological",
  "Ophthalmic",
  "Otic",
  "Respiratory",
  "Psychiatric",
  "Nutritional",
  "Diagnostic",
  "Biologicals",
  "Generics",
  "Biosimilars",
  "Orphan Drugs",
  "Vaccines",
  "Vitamins",
  "Minerals",
  "Supplements",
  "Hormonal",
  "Anesthetics",
  "Anticoagulants",
  "Antidiabetics",
  "Antihyperlipidemics",
  "Antihypertensives",
  "Anti-inflammatories",
  "Antiprotozoals",
  "Antirheumatics",
  "Antiseptics",
  "Disinfectants",
  "Contraceptives",
  "Erectile Dysfunction",
  "Respiratory Agents",
];

export function Register() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, isPending, signOut } = useAuth();
  const isRTL = i18n.language === "ar";

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    localStorage.setItem("lomixa_lang", newLang);
  };

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [existingPharmaCompanies, setExistingPharmaCompanies] = useState<any[]>(
    [],
  );
  const [hospitals, setHospitals] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phoneCode: "+966",
    phone: "",
    // Personal for Doctor/Rep
    firstName: "",
    middleName: "",
    lastName: "",
    title: "",
    specialty: "",
    yearsExperience: "",
    roleTitle: "",
    selectedHospitalId: "",

    // For Pharma/Hospital
    organizationName: "",
    // Location
    country: "sa",
    city: "",
    cities: [] as string[],
    area: "",
    areas: [] as string[],
    address: "",
    // Rep Specific
    pharmaId: "",
    newPharmaName: "",
    products: [
      {
        id: generateId(),
        category: "",
        name: "",
        form: "",
        description: "",
        indications: "",
        doses: "",
      },
    ],
    targetSpecialties: [] as string[],
    // Document Uploads
    vatCertificate: null as File | null,
    // Doctor Specific
    doctorType: "independent" as "hospital" | "independent",
    // Hospital/Clinic Specific
    hospitalType: "hospital" as "hospital" | "clinic",

    // Pharma Bundle Selection (New)
    selectedBundleId: "",
    cardNo: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const [step, setStep] = useState(1); // 1: Info, 2: Bundle, 3: Success/Pending

  useEffect(() => {
    if (role) {
      const actualRole = role === "subordinate" ? "rep" : role;
      setSelectedRole(actualRole);
    }
  }, [role]);

  // Use store listener to keep dropdowns fresh with cloud sync
  useStoreListener(() => {
    setExistingPharmaCompanies(getPharmaCompanies());
    setHospitals(getHospitals());
  });

  useEffect(() => {
    setExistingPharmaCompanies(getPharmaCompanies());
    setHospitals(getHospitals());
  }, []);

  useEffect(() => {
    if (user && user.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  useEffect(() => {
    if (!isPending && !user) {
      toast("Please verify your email first.", "error");
      navigate("/register");
    }
  }, [user, isPending, navigate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    let extraChanges: any = {};
    if (name === "phoneCode") {
      const match = ARABIC_COUNTRY_CODES.find((c) => c.code === value);
      if (match) {
        extraChanges.country = match.countryId;
        extraChanges.city = "";
        extraChanges.cities = [];
        extraChanges.area = "";
      }
    } else if (name === "country") {
      const match = ARABIC_COUNTRY_CODES.find((c) => c.countryId === value);
      if (match) {
        extraChanges.phoneCode = match.code;
      }
      extraChanges.city = "";
      extraChanges.cities = [];
      extraChanges.area = "";
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...extraChanges,
    }));
  };

  const toggleCity = (city: string) => {
    setFormData((prev) => {
      const cities = prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city];
      return { ...prev, cities };
    });
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => {
      const targetSpecialties = prev.targetSpecialties.includes(specialty)
        ? prev.targetSpecialties.filter((s) => s !== specialty)
        : [...prev.targetSpecialties, specialty];
      return { ...prev, targetSpecialties };
    });
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const products = [...prev.products];
      products[index] = { ...products[index], [field]: value };
      return { ...prev, products };
    });
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: generateId(),
          category: "",
          name: "",
          form: "",
          description: "",
          indications: "",
          doses: "",
        },
      ],
    }));
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file }));
      toast(`${file.name} uploaded successfully`, "success");
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if ((selectedRole === "pharma" || selectedRole === "rep") && step === 1) {
      setStep(2);
      window.scrollTo(0, 0);
    } else {
      handleRegister(e);
    }
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (!selectedRole) throw new Error("Role selection missing.");
      if (!user && !formData.password)
        throw new Error("A security key is strictly required.");
      if (formData.cities.length === 0 && !formData.city) {
        throw new Error("Please select at least one city.");
      }

      // Skip existence checks if the user is already logged in (they are updating their own record)
      if (!user) {
        const emailExists = await checkUserExistence("email", formData.email);
        if (emailExists) throw new Error(t("emailAlreadyExists"));
        
        const fullPhone = `${formData.phoneCode}${formData.phone}`;
        const phoneExists = await checkUserExistence("phone", fullPhone);
        if (phoneExists) throw new Error(t("phoneAlreadyExists"));
      }

      let finalUserId = generateId();
      let isEmailConfirmationRequired = false;

      if (isSupabaseConfigured) {
        if (!user) throw new Error("Authentication required for profile completion.");
        
        const oldRole = user.user_metadata?.role;
        if (oldRole && oldRole !== selectedRole) {
          deleteUserEntity(user.id, oldRole);
        }

        const isAutoApproved = selectedRole === "doctor" || selectedRole === "admin";

        const updatePayload: any = {
          password: formData.password,
          data: {
            role: selectedRole,
            registration_state: isAutoApproved ? 'completed' : 'awaiting_admin_approval',
            full_name:
              selectedRole === "doctor" || selectedRole === "rep"
                ? `${formData.firstName} ${formData.lastName}`
                : formData.organizationName,
            phone: `${formData.phoneCode}${formData.phone}`,
            country: formData.country,
          }
        };

        if (formData.email !== user.email) {
          updatePayload.email = formData.email;
          isEmailConfirmationRequired = true;
        }

        const { error: authError } = await supabase.auth.updateUser(updatePayload);
        if (authError) throw new Error(`Profile update failed: ${authError.message}`);
        finalUserId = user.id;
      } else {
        // In demo mode, use a predictable ID that AuthProvider will generate
        finalUserId = `demo_${selectedRole}_user`;
      }

      const profileData = {
        id: finalUserId,
        userId: finalUserId,
        email: formData.email,
        phone: `${formData.phoneCode}${formData.phone}`,
        avatar: previewImage || "",
        location: {
          country: formData.country,
          city: formData.cities.length > 0 ? formData.cities[0] : formData.city,
          cities: formData.cities.length > 0 ? formData.cities : (formData.city ? [formData.city] : []),
          area: formData.area,
          areas: formData.areas,
          address: formData.address,
        },
        verified: false,
        createdAt: new Date().toISOString(),
      };

      if (selectedRole === "doctor") {
        saveDoctor({
          ...profileData,
          name: `${formData.firstName} ${formData.lastName}`,
          title: formData.title,
          specialty: formData.specialty,
          experienceYears: parseInt(formData.yearsExperience) || 0,
          hospitalId:
            formData.doctorType === "hospital"
              ? formData.selectedHospitalId
              : "default",
          hospitalName:
            formData.doctorType === "hospital"
              ? hospitals.find((h) => h.id === formData.selectedHospitalId)
                  ?.name || t("pendingHospital")
              : formData.organizationName || t("independentClinic"),
          isVerified: true,
          isActive: true,
          approvalStatus: 'approved',
          availability: [],
        });
      } else if (selectedRole === "rep") {
        saveSalesRep({
          ...profileData,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleTitle: formData.roleTitle,
          pharmaId: formData.pharmaId || "temp_pharma",
          pharmaName: formData.pharmaId === "other"
            ? formData.newPharmaName
            : existingPharmaCompanies.find((p) => p.id === formData.pharmaId)
                ?.name,
          products: formData.products,
          target: 100,
          visitsThisMonth: 0,
          balance: 0,
          isVerified: false, // Ensures self-registered reps start as PENDING
          isActive: true, // Will go to false if rejected
          approvalStatus: 'pending_approval',
          targetSpecialties: formData.targetSpecialties,
        });

        // Save Rep Bundle/Subscription Request
        const selectedPlan = REP_PLANS.find(
          (p) => p.id === formData.selectedBundleId,
        );
        if (selectedPlan) {
          const currency = getCurrencyInfo(formData.country || "sa");
          const localPrice = Math.round(
            getPriceForCountry(
              selectedPlan.id,
              (formData.country || "sa") as any,
            ),
          );

          saveBundleRequest({
            id: `req_${finalUserId}`,
            pharmaId: finalUserId,
            pharmaName: `${formData.firstName} ${formData.lastName}`,
            bundleId: selectedPlan.id,
            bundleName: selectedPlan.name,
            balance: selectedPlan.durationMonths, // Store months in balance field for reps
            price: localPrice,
            cardNumber: `**** **** **** ${formData.cardNo.slice(-4)}`,
            cardHolder: formData.cardHolder,
            status: "pending_approval",
            date: new Date().toISOString(),
            type: "rep",
          });
        }

        if (formData.pharmaId && formData.pharmaId !== "other") {
          const parentPharma = existingPharmaCompanies.find(
            (p) => p.id === formData.pharmaId,
          );
          if (parentPharma && parentPharma.userId) {
            pushNotification({
              userId: parentPharma.userId,
              title: t("newRepRegTitle"),
              message: t("newRepRegMsg", { name: `${formData.firstName} ${formData.lastName}` }),
              type: "info",
            });
            if (parentPharma.email) {
              emailService.sendNotification(parentPharma.email, t("newRepRegTitle"), t("newRepRegMsg", { name: `${formData.firstName} ${formData.lastName}` })).catch(console.error);
            }
          }
        }
      } else if (selectedRole === "pharma" || selectedRole === "hospital") {
        const orgData = {
          ...profileData,
          name: formData.organizationName,
          type:
            selectedRole === "hospital"
              ? formData.hospitalType
              : (selectedRole as any),
          isActive: true,
          isVerified: false,
          approvalStatus: 'pending_approval' as const,
          documents: {
            commercial: !!(formData as any).commCertificate,
            address: !!(formData as any).natAddress,
            vat: !!formData.vatCertificate,
          },
        };
        if (selectedRole === "pharma") {
          savePharmaCompany({ ...orgData, balance: 0 }); // Start with 0, funded on admin approval

          // Save Bundle Request
          const selectedBundle = getBundles().find(
            (b) => b.id === formData.selectedBundleId,
          );
          if (selectedBundle) {
            const currency = getCurrencyInfo(formData.country || "sa");
            const localBalance = Math.round(
              selectedBundle.balance * currency.usdRate,
            );
            const localPrice = Math.round(
              selectedBundle.price * currency.usdRate,
            );

            saveBundleRequest({
              id: `req_${finalUserId}`,
              pharmaId: finalUserId,
              pharmaName: formData.organizationName,
              bundleId: selectedBundle.id,
              bundleName: selectedBundle.name,
              balance: localBalance,
              price: localPrice,
              cardNumber: `**** **** **** ${formData.cardNo.slice(-4)}`,
              cardHolder: formData.cardHolder,
              status: "pending_approval",
              date: new Date().toISOString(),
              type: "pharma",
            });
          }

          pushNotification({
            userId: "admin",
            title: t("newPharmaRegTitle"),
            message: t("newPharmaRegMsg", { name: formData.organizationName }),
            type: "info",
          });
          emailService.sendNotification('admin@lomixa.sa', t("newPharmaRegTitle"), t("newPharmaRegMsg", { name: formData.organizationName })).catch(console.error);
        } else {
          saveHospital(orgData as any);
          pushNotification({
            userId: "admin",
            title: t("newHospitalRegTitle") || "New Hospital Registration",
            message: t("newHospitalRegMsg", { name: formData.organizationName }) || `New hospital registration request from ${formData.organizationName}`,
            type: "info",
          });
        }
      } else if (selectedRole === "admin") {
        saveProfile(finalUserId, {
          ...profileData,
          name: formData.organizationName || "System Administrator",
          role: "admin",
          isVerified: true,
          isActive: true,
        });
        if (!isSupabaseConfigured) {
          localStorage.setItem("demo_role", "admin");
          localStorage.setItem("demo_email", formData.email);
        }
      }

      if (isEmailConfirmationRequired) {
        toast("Please check your email inbox to verify your account before logging in.", "success");
      } else {
        toast(t("registrationSuccessful"), "success");
      }

      if (selectedRole === "rep" || selectedRole === "pharma") {
        if (!isEmailConfirmationRequired) {
           toast(t("regPendingVerification"), "success");
        }
        setStep(3); // Show Success/Pending Screen
        window.scrollTo(0, 0);
        return; // Don't redirect immediately
      }

      // Send Welcome Email (Real-time) - Temporarily disabled
      /*
      const fullName =
        selectedRole === "doctor" || selectedRole === "rep"
          ? `${formData.firstName} ${formData.lastName}`
          : formData.organizationName;
      
      try {
        await emailService.generateAndSendToken('generate_verification', finalUserId, formData.email, fullName);
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }
      */

      navigate("/login");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getRoleStyle = () => {
    switch (selectedRole) {
      case "hospital":
        return "from-emerald-500 to-teal-700 shadow-emerald-500/20";
      case "doctor":
        return "from-sky-400 to-blue-600 shadow-sky-500/20";
      case "pharma":
        return "from-indigo-500 to-indigo-800 shadow-indigo-500/20";
      case "rep":
        return "from-orange-400 to-amber-600 shadow-orange-500/20";
      case "admin":
        return "from-indigo-600 to-indigo-800 shadow-indigo-600/20";
      default:
        return "from-slate-700 to-slate-900";
    }
  };

  const getRoleColor = () => {
    switch (selectedRole) {
      case "hospital":
        return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
      case "doctor":
        return "text-sky-400 border-sky-400/20 bg-sky-400/5";
      case "pharma":
        return "text-indigo-400 border-indigo-400/20 bg-indigo-400/5";
      case "rep":
        return "text-orange-400 border-orange-400/20 bg-orange-400/5";
      case "admin":
        return "text-white border-white/20 bg-white/5";
      default:
        return "text-slate-500 border-slate-500/20 bg-slate-500/5";
    }
  };

  return (
    <div
      className="min-h-screen bg-[#050b14] text-white font-sans flex flex-col items-center py-20 px-6 relative overflow-x-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

      {/* Header Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mb-20 flex flex-col items-center gap-6"
      >
        <Link to="/" className="flex flex-col items-center gap-6 group">
          <div className="bg-white rounded-[2rem] p-4 w-24 h-24 shadow-2xl transition-all group-hover:scale-105 group-hover:rotate-2">
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
            {t("appName")}
          </span>
        </Link>
      </motion.div>

      <main className="w-full max-w-4xl flex-1">
        <div className="max-w-3xl mx-auto space-y-16">
          <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-sm p-4 rounded-3xl border border-white/5">
            <button
              onClick={() => navigate("/select-role")}
              className="text-slate-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 font-sans"
            >
              <ArrowRight className={cn("w-4 h-4", !isRTL && "rotate-180")} />
              {t("back_to_selection")}
            </button>
            <button
              onClick={toggleLanguage}
              className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] hover:border-emerald-500 transition-all font-sans flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              {isRTL ? t("switchToEnglish") : t("switchToArabic")}
            </button>
          </div>

          <div className="flex items-center gap-8">
            <div
              className={cn(
                "w-24 h-24 rounded-[2.5rem] flex items-center justify-center bg-gradient-to-br shadow-2xl transition-all",
                getRoleStyle(),
              )}
            >
              {selectedRole === "rep" && (
                <Briefcase className="w-10 h-10 text-white" />
              )}
              {selectedRole === "pharma" && (
                <Building2 className="w-10 h-10 text-white" />
              )}
              {selectedRole === "hospital" && (
                <Activity className="w-10 h-10 text-white" />
              )}
              {selectedRole === "doctor" && (
                <Stethoscope className="w-10 h-10 text-white" />
              )}
              {selectedRole === "admin" && (
                <Shield className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                {t("createAccount")}
              </h1>
              <p
                className={cn(
                  "font-black tracking-[0.2em] text-[10px] uppercase px-4 py-1.5 rounded-full border w-fit",
                  getRoleColor(),
                )}
              >
                {selectedRole === "pharma"
                  ? "Corporate"
                  : selectedRole === "hospital"
                    ? "Facility"
                    : "Professional"}{" "}
                Program
              </p>
            </div>
          </div>

          <form onSubmit={handleNextStep} className="space-y-16 pb-32">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-[3.5rem] p-12 bg-slate-900/30 border border-white/5 backdrop-blur-xl shadow-3xl space-y-12"
                >
                  {/* PROFILE LOGO CLUSTER */}
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group/pic cursor-pointer">
                      <div className="w-36 h-36 rounded-[3rem] border-2 border-dashed border-slate-700 group-hover/pic:border-emerald-500 transition-all flex items-center justify-center overflow-hidden bg-slate-950/80 shadow-2xl">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-12 h-12 text-slate-700 opacity-40 group-hover/pic:text-emerald-500 transition-all" />
                        )}
                      </div>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () =>
                              setPreviewImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-2xl shadow-xl border-4 border-[#050b14]">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] italic">
                        {selectedRole === "pharma" ||
                        selectedRole === "hospital" ||
                        selectedRole === "admin"
                          ? selectedRole === "admin"
                            ? "Administrative Identity"
                            : t("orgIdentity")
                          : t("professionalIdentity")}
                      </Label>
                      <p className="text-xs text-slate-400 font-medium">
                        {selectedRole === "pharma" ||
                        selectedRole === "hospital" ||
                        selectedRole === "admin"
                          ? t("uploadHintLogo")
                          : t("uploadHintPhoto")}
                      </p>
                    </div>
                  </div>

                  {/* BASIC INFO */}

                  <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8", user ? "pt-10 border-t border-white/5" : "")}>
                    {selectedRole === "pharma" ||
                    selectedRole === "hospital" ||
                    selectedRole === "admin" ? (
                      <div className="md:col-span-2 space-y-6">
                        {selectedRole === "hospital" && (
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                              Facility Type*
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, hospitalType: 'hospital' }))}
                                className={cn(
                                  "p-4 rounded-2xl border transition-all text-sm font-bold uppercase tracking-widest",
                                  formData.hospitalType === 'hospital'
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700"
                                )}
                              >
                                {t('hospital')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, hospitalType: 'clinic' }))}
                                className={cn(
                                  "p-4 rounded-2xl border transition-all text-sm font-bold uppercase tracking-widest",
                                  formData.hospitalType === 'clinic'
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700"
                                )}
                              >
                                {t('clinic')}
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                            {selectedRole === "admin"
                              ? "Administrative Title"
                              : t("orgName")}
                            *
                          </Label>
                          <Input
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            required
                            className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedRole === "doctor" && (
                          <>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                                Title
                              </Label>
                              <select
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500"
                              >
                                <option value="">{t("selectTitle")}</option>
                                {DOCTOR_TITLES.map((tit) => (
                                  <option key={tit} value={tit}>
                                    {tit}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                                {t("specialty")}*
                              </Label>
                              <select
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                required
                                className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500"
                              >
                                <option value="">{t("selectSpecialty")}</option>
                                {SPECIALTIES.map((spec) => (
                                  <option key={spec} value={spec}>
                                    {t(`spec_${spec}`) === `spec_${spec}` ? spec : t(`spec_${spec}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        {selectedRole === "rep" && (
                          <>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                                {t("pharmaCompany")}*
                              </Label>
                              <select
                                name="pharmaId"
                                value={formData.pharmaId}
                                onChange={handleChange}
                                required
                                className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all"
                              >
                                <option value="">{t("selectExistingCompany") || "Select Existing Company"}</option>
                                {existingPharmaCompanies
                                  .filter(p => p.isActive && p.isVerified)
                                  .map((pharma) => (
                                    <option key={pharma.id} value={pharma.id}>
                                      {pharma.name}
                                    </option>
                                  ))}
                                <option value="other">{t("otherCreateNew") || "Other (Create New)"}</option>
                              </select>
                            </div>
                            {formData.pharmaId === "other" && (
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                                  {t("newPharmaName") || "Company Name"}*
                                </Label>
                                <Input
                                  name="newPharmaName"
                                  value={formData.newPharmaName}
                                  onChange={handleChange}
                                  required
                                  className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                                />
                              </div>
                            )}
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                                {t("professionalRole") || "Professional Role"}*
                              </Label>
                              <select
                                name="roleTitle"
                                value={formData.roleTitle}
                                onChange={handleChange}
                                required
                                className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all"
                              >
                                <option value="">{t("selectRole")}</option>
                                {REP_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                            {t("firstName")}*
                          </Label>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                            {t("lastName")}*
                          </Label>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                          {t("email")}*
                        </Label>
                        {user && (
                          <button
                            type="button"
                            onClick={() => {
                              signOut().then(() => window.location.href = '/select-role');
                            }}
                            className="text-[10px] font-bold text-emerald-500 hover:text-white uppercase tracking-widest transition-colors"
                          >
                            {t("notYouLogout") || "Not you? Logout"}
                          </button>
                        )}
                      </div>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={cn(
                          "h-14 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 font-bold",
                          user && !isPending && "opacity-50 cursor-not-allowed"
                        )}
                        readOnly={!!user && !isPending}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                        {t("phoneNumber")}
                      </Label>
                      <div className="flex gap-2">
                        <select
                          name="phoneCode"
                          value={formData.phoneCode}
                          onChange={handleChange}
                          className="w-32 h-14 rounded-2xl bg-black/40 border border-slate-800 px-3 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all"
                        >
                          {ARABIC_COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="flex-1 h-14 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 font-bold"
                          placeholder="5XXXXXXXX"
                        />
                      </div>
                    </div>
                      <div className="md:col-span-2 space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                          {t("securityKey")} (Set Your Password)*
                        </Label>
                        <Input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className="h-14 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 tracking-widest font-bold"
                        />
                      </div>
                  </div>

                  {/* ROLE SPECIFIC & LOCATION */}
                  <div className="pt-10 border-t border-white/5 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                          {t("country")}*
                        </Label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                          {t("city")}*
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-1 max-h-48 overflow-y-auto p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                          {CITY_MAP[formData.country]?.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => toggleCity(city)}
                              className={cn(
                                "px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
                                formData.cities.includes(city)
                                  ? "bg-emerald-500 text-white"
                                  : "bg-black/40 text-slate-500 border border-slate-800 hover:border-emerald-500/50"
                              )}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedRole === "hospital" && formData.hospitalType === "clinic" && (
                      <div className="space-y-3 mt-8">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                          {t("address")}*
                        </Label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          required
                          placeholder="Full Street Address"
                          className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* REP SPECIFIC PROFILE ENHANCEMENTS */}
                  {selectedRole === "rep" && (
                    <>
                      <div className="pt-10 border-t border-white/5 space-y-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <LayoutGrid className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">
                              Target Specialties
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              Which medical divisions do you represent?
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {SPECIALTIES.map((spec) => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => toggleSpecialty(spec)}
                              className={cn(
                                "p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest text-center",
                                formData.targetSpecialties.includes(spec)
                                  ? "border-orange-500 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10"
                                  : "border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:text-slate-300",
                              )}
                            >
                              {spec}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-10 border-t border-white/5 space-y-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">
                                Product Portfolio
                              </h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                                What are you selling?
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={addProduct}
                            variant="ghost"
                            className="h-10 px-4 rounded-xl border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add {t("product")}
                          </Button>
                        </div>

                        <div className="space-y-6">
                          {formData.products.map((product, index) => (
                            <div
                              key={product.id}
                              className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5 space-y-8 relative group/card overflow-hidden transition-all hover:border-emerald-500/20 hover:bg-slate-900/80"
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/40">
                                  Product Unit {index + 1}
                                </span>
                                {formData.products.length > 1 && (
                                  <button
                                    onClick={() => removeProduct(index)}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all opacity-0 group-hover/card:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                                    Product Category
                                  </Label>
                                  <Input
                                    value={product.category}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "category",
                                        e.target.value,
                                      )
                                    }
                                    className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                                    placeholder="e.g. Cardiovascular"
                                  />
                                </div>
                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                                    Product Trade Name
                                  </Label>
                                  <Input
                                    value={product.name}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                                    placeholder="e.g. Lipitor"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                  <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                                    Brief Professional Description
                                  </Label>
                                  <Input
                                    value={product.description}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500"
                                    placeholder="Describe the therapeutic value..."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* DOCUMENTS HUB */}
                  {(selectedRole === "pharma" ||
                    selectedRole === "hospital") && (
                    <div className="pt-10 border-t border-white/5 space-y-8">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest italic">
                          Verification Documents
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                          { id: "commCertificate", label: "Commercial Cert" },
                          { id: "natAddress", label: "National Address" },
                          { id: "vatCertificate", label: "VAT Certificate" },
                        ].map((doc) => {
                          const uploadedFile = (formData as any)[doc.id];
                          return (
                            <div
                              key={doc.id}
                              className={cn(
                                "relative p-10 rounded-[2.5rem] bg-slate-900/60 border transition-all flex flex-col items-center gap-6 text-center shadow-xl group",
                                uploadedFile 
                                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                                  : "border-white/5 hover:border-emerald-500/50 hover:bg-white/5"
                              )}
                            >
                              <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500",
                                uploadedFile 
                                  ? "bg-emerald-500/20 text-emerald-500 scale-110" 
                                  : "bg-white/5 text-slate-500 group-hover:scale-110 group-hover:text-emerald-500"
                              )}>
                                {uploadedFile ? <Check className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                                  uploadedFile ? "text-emerald-400" : "text-slate-500 group-hover:text-white"
                                )}>
                                  {doc.label}
                                </span>
                                {uploadedFile && (
                                  <span className="text-[8px] font-bold text-slate-400 line-clamp-1 italic max-w-[120px]">
                                    {uploadedFile.name}
                                  </span>
                                )}
                              </div>
                              <input
                                type="file"
                                onChange={(e) => handleFileChange(e, doc.id)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : step === 2 ? (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {/* Universal Step 2: Bundle/Plan Selection & Payment */}
                  <div className="flex items-center gap-6 mb-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl",
                        selectedRole === "rep"
                          ? "bg-orange-500 text-white"
                          : "bg-indigo-500 text-white",
                      )}
                    >
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                        {t("selectYourPlan")}
                      </h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                        {selectedRole === "rep"
                          ? "LOMIXA Professional License"
                          : "LOMIXA Market Acquisition"}{" "}
                        Program
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(selectedRole === "rep" ? REP_PLANS : getBundles()).map(
                      (bundle: any) => (
                        <button
                          key={bundle.id}
                          type="button"
                          onClick={() =>
                            setFormData((f) => ({
                              ...f,
                              selectedBundleId: bundle.id,
                            }))
                          }
                          className={cn(
                            "relative p-10 rounded-[2.5rem] border-2 transition-all text-left flex flex-col h-full group overflow-hidden bg-white/5 backdrop-blur-md hover:border-white/20",
                            formData.selectedBundleId === bundle.id
                              ? selectedRole === "rep"
                                ? "border-orange-500 bg-orange-500/10 shadow-3xl shadow-orange-500/20"
                                : "border-indigo-500 bg-indigo-500/10 shadow-3xl shadow-indigo-500/20"
                              : "border-white/5",
                          )}
                        >
                          {formData.selectedBundleId === bundle.id && (
                            <div
                              className={cn(
                                "absolute top-4 right-4 rounded-full p-1.5 shadow-lg",
                                selectedRole === "rep"
                                  ? "bg-orange-500"
                                  : "bg-indigo-500",
                              )}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="mb-6">
                            <h4 className="text-xl font-black italic tracking-tighter uppercase text-white group-hover:text-emerald-400 transition-colors">
                              {bundle.name}
                            </h4>
                            <div className="text-4xl font-black mt-2 text-white italic tracking-tighter">
                              {selectedRole === "rep" ? (
                                <span className="flex items-baseline gap-1">
                                  {getPriceForCountry(
                                    bundle.id,
                                    (formData.country || "sa") as any,
                                  )}{" "}
                                  <span className="text-xs uppercase opacity-40 font-bold">
                                    {formData.country === "sa" ? "SAR" : "EGP"}
                                  </span>
                                </span>
                              ) : (
                                <span className="flex items-baseline gap-1">
                                  {Math.round(bundle.price * (getCurrencyInfo(formData.country).usdRate || 1)).toLocaleString()}{" "}
                                  <span className="text-xs uppercase opacity-40 font-bold">
                                    {getCurrencyInfo(formData.country).code}
                                  </span>
                                </span>
                              )}
                            </div>
                            <div
                              className={cn(
                                "text-[10px] font-black uppercase tracking-[0.1em] mt-2 px-3 py-1 rounded-full border w-fit",
                                selectedRole === "rep"
                                  ? "text-orange-400 border-orange-500/20 bg-orange-500/5"
                                  : "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
                              )}
                            >
                              {selectedRole === "rep"
                                ? `${bundle.durationMonths} Months Access`
                                : `Value: ${bundle.balance} Units`}
                            </div>
                          </div>
                          <ul className="space-y-4 mt-auto pt-6 border-t border-white/5">
                            {bundle.features.slice(0, 4).map((f: string) => (
                              <li
                                key={f}
                                className="flex items-start gap-2.5 text-[10px] font-black uppercase text-slate-400 leading-tight tracking-wider"
                              >
                                <Check
                                  className={cn(
                                    "w-3 h-3 shrink-0 mt-0.5",
                                    selectedRole === "rep"
                                      ? "text-orange-500"
                                      : "text-indigo-500",
                                  )}
                                />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </button>
                      ),
                    )}
                  </div>

                  {formData.selectedBundleId && (
                    <div className="rounded-[3.5rem] p-12 bg-slate-900/30 border border-white/5 backdrop-blur-xl shadow-3xl space-y-12 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">
                              {t("paymentDetails")}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 italic">
                              Professional Billing Protocol
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                          <ShieldCheck className="w-5 h-5 text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic">
                            Encrypted Secure Transaction
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="md:col-span-2 space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                            {t("cardHolder")}
                          </Label>
                          <Input
                            name="cardHolder"
                            value={formData.cardHolder}
                            onChange={handleChange}
                            required
                            className="h-16 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 transition-all text-sm uppercase tracking-widest"
                            placeholder={
                              selectedRole === "rep"
                                ? "NAME AS ON CARD"
                                : "CORPORATE ENTITY NAME"
                            }
                          />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                            {t("cardNumber")}
                          </Label>
                          <div className="relative group/input">
                            <Input
                              name="cardNo"
                              value={formData.cardNo}
                              onChange={handleChange}
                              required
                              maxLength={16}
                              className="h-16 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 transition-all text-lg tracking-[0.3em]"
                              placeholder="0000 0000 0000 0000"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                              <div className="w-8 h-5 bg-slate-800 rounded opacity-40"></div>
                              <div className="w-8 h-5 bg-slate-800 rounded opacity-40"></div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                            EXPIRATION
                          </Label>
                          <Input
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleChange}
                            required
                            className="h-16 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 text-center tracking-widest"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">
                            SECURITY CODE
                          </Label>
                          <Input
                            name="cardCvv"
                            value={formData.cardCvv}
                            onChange={handleChange}
                            required
                            type="password"
                            maxLength={3}
                            className="h-16 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 text-center tracking-[0.5em]"
                            placeholder="•••"
                          />
                        </div>
                      </div>

                      <div className="relative p-10 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                        <div className="flex items-start gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg border border-indigo-500/30">
                            <ShieldAlert className="w-8 h-8" />
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300">
                              Administrative Authorization Required
                            </h4>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-indigo-400/80 leading-relaxed italic">
                              IMPORTANT: Your account credentials and
                              professional licensing must be audited by LOMIXA
                              administration.
                              <span className="text-white block mt-2">
                                No funds will be deducted from your card until
                                your application is officially approved and your
                                access is activated.
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-4 pt-8">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="ghost"
                      className="h-14 px-8 rounded-2xl border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 font-black uppercase italic tracking-widest text-[10px]"
                    >
                      {t("back")}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center space-y-12 py-20"
                >
                  <div className="relative">
                    <div className="w-40 h-40 rounded-[3.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl animate-pulse-slow">
                      <Clock className="w-20 h-20 text-emerald-500" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center border-4 border-[#050b14] shadow-xl">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-6 max-w-lg">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
                      Registration Received
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-6 py-2 rounded-full inline-block">
                      Status: PENDING AUDIT
                    </p>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Your professional profile has been securely submitted to
                      the LOMIXA Regional Grid. Our administration is currently
                      reviewing your documents and subscription request.
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-md">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Official Confirmation
                        </p>
                        <p className="text-xs font-bold text-white uppercase italic">
                          We've sent a detailed email to {formData.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-left border-t border-white/5 pt-6">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Secure Activation
                        </p>
                        <p className="text-xs font-bold text-white uppercase italic">
                          Access will be granted immediately upon approval.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate("/login")}
                    className="h-16 px-12 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic tracking-widest text-sm shadow-2xl shadow-emerald-500/20 group"
                  >
                    {t("returnToLogin")}{" "}
                    <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {step !== 3 && (
              <div className="sticky bottom-8 z-20">
                <Button
                  type="submit"
                  disabled={
                    loading || (step === 2 && !formData.selectedBundleId)
                  }
                  className={cn(
                    "w-full h-20 rounded-[2.5rem] bg-gradient-to-r text-white font-black italic tracking-tighter text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group",
                    loading ? "opacity-50" : "hover:shadow-emerald-500/20",
                    getRoleStyle(),
                  )}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="uppercase tracking-widest text-sm font-black">
                        {t("creatingTerminal")}...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <span className="uppercase tracking-widest text-sm font-black">
                        {(selectedRole === "pharma" ||
                          selectedRole === "rep") &&
                        step === 1
                          ? t("continueToPlan")
                          : t("executeRegistration")}
                      </span>
                      <ArrowRight
                        className={cn(
                          "w-6 h-6 transition-transform group-hover:translate-x-2",
                          isRTL && "rotate-180",
                        )}
                      />
                    </div>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Corporate Footer (Minimal) */}
      <footer className="w-full bg-[#050b14] border-t border-white/5 py-16 px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2 w-10 h-10 shadow-2xl">
                <img
                  src="/logo.svg"
                  alt="Lomixa"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">
                {t("appName")}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Connecting pharmaceutical companies and healthcare professionals
              through a secure, regional grid.
            </p>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">
              Quick Links
            </h4>
            <ul className="space-y-4 font-medium text-sm">
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/select-role"
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  Terms and Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">
              Contact Us
            </h4>
            <div className="space-y-5 text-sm font-medium text-slate-400">
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">
                  Support
                </div>
                <span className="text-white font-semibold italic">
                  Info@lomixa.net
                </span>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">
                  HQ
                </div>
                <span className="text-white/80 italic leading-relaxed">
                  5 Tahrir Street, Giza, Egypt
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">
              {t("followUs") || "Follow Us"}
            </h4>
            <div className="flex gap-4">
              {[
                { icon: Facebook, href: "https://www.facebook.com/share/1CnvDsiXyq/?mibextid=wwXIfr" },
                { icon: Instagram, href: "https://www.instagram.com/lomixahealthcare?igsh=N2lnZWx4OWdpeXN2" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/lomixa-health-care/" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-xl"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-center">
          <p>© 2026 LOMIXA Healthcare Systems. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
