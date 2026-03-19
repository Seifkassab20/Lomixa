import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Welcome": "Welcome to MedVisit Connect",
      "Login": "Login",
      "Register": "Register",
      "Role": "Role",
      "Pharma Company": "Pharmaceutical Company",
      "Hospital / Clinic": "Hospital / Clinic",
      "Doctor": "Doctor",
      "Sales Rep": "Sales Representative",
      "Email": "Email",
      "Password": "Password",
      "Name": "Name",
      "Specialty": "Specialty",
      "Years of Experience": "Years of Experience",
      // Add more translations as needed
    }
  },
  ar: {
    translation: {
      "Welcome": "مرحباً بك في ميدفيزيت كونكت",
      "Login": "تسجيل الدخول",
      "Register": "تسجيل جديد",
      "Role": "الدور",
      "Pharma Company": "شركة أدوية",
      "Hospital / Clinic": "مستشفى / عيادة",
      "Doctor": "طبيب",
      "Sales Rep": "مندوب مبيعات",
      "Email": "البريد الإلكتروني",
      "Password": "كلمة المرور",
      "Name": "الاسم",
      "Specialty": "التخصص",
      "Years of Experience": "سنوات الخبرة",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
