const fs = require('fs');

const arTranslations = {
  "reviewManage": "مراجعة وإدارة",
  "T": "T",
  "totalSlots": "إجمالي المواعيد",
  "available": "متاح",
  "upcoming": "القادمة",
  "addAvailabilitySlot": "إضافة موعد متاح",
  "appointmentType": "نوع الموعد",
  "minutesLabel": "دقائق",
  "upcomingSlots": "المواعيد القادمة",
  "noUpcomingSlots": "لا توجد مواعيد قادمة. أضف مواعيدك لبدء استقبال الزيارات.",
  "@": "@",
  "hospitalAnalytics": "تحليلات المستشفى",
  "doctorActivityStats": "إحصائيات نشاط الأطباء والزيارات",
  "activePharma": "الشركات النشطة",
  "completionRate": "معدل الإنجاز",
  "monthlyVisitFrequency": "معدل الزيارات الشهري",
  "visits": "الزيارات",
  "doctorsBySpecialty": "الأطباء حسب التخصص",
  "visitStatusBreakdown": "توزيع حالات الزيارة",
  "topActiveDoctors": "أكثر الأطباء نشاطاً",
  " ": " ",
  "cardiology": "أمراض القلب",
  "neurology": "طب الأعصاب",
  "other": "أخرى",
  "searchDoctor": "البحث بالاسم أو التخصص...",
  "editDoctor": "تعديل الطبيب",
  "selectSpecialty": "اختر التخصص...",
  "phone": "رقم الهاتف",
  "update": "تحديث",
  "yearsExperienceLabel": "سنوات خبرة",
  "slotsAvailable": "مواعيد متاحة",
  "pendingVisitsLabel": "زيارات قيد الانتظار",
  "noVisitDataYet": "لا توجد بيانات زيارة بعد",
  "noRepDataYet": "لا توجد بيانات مندوبين بعد",
  "successfullyAdded": "تمت الإضافة بنجاح",
  "visitCreditsLabel": "أرصدة الزيارات",
  "plan": "الخطة",
  "total": "الإجمالي",
  "credits": "أرصدة",
  "buyVisitBundles": "شراء باقات الزيارات",
  "purchaseCreditsTeam": "شراء أرصدة زيارات لفريق المبيعات الخاص بك",
  "creditsAvailableLabel": "أرصدة متاحة",
  "mostPopular": "الأكثر شيوعاً",
  "sarCurrency": "ريال",
  "processing": "جاري المعالجة...",
  "purchased": "تم الشراء!",
  "purchaseBtnPrefix": "شراء",
  "howVisitCreditsWork": "كيف تعمل أرصدة الزيارات",
  "purchaseABundle": "شراء باقة",
  "buyVisitCreditsCompany": "شراء أرصدة الزيارات لشركتك الطبية بالريال السعودي",
  "assignToReps": "تعيين للمناديب",
  "salesRepsCanUseCredits": "يمكن למندوبي المبيعات استخدام الأرصدة لحجز الزيارات",
  "trackRoi": "تتبع العائد على الاستثمار",
  "monitorPerformance": "راقب الأداء ومعدلات التحويل في لوحة التحليلات الخاصة بك",
  "removeRepConfirm": "هل أنت متأكد من إزالة هذا المندوب؟",
  ".": ".",
  "allYourVisits": "جميع زياراتك المجدولة والسابقة - تحديث تلقائي",
  "cancelVisitConfirm": "هل ترغب بإلغاء موعد الزيارة؟",
  "visitCancelled": "تم إلغاء الزيارة",
  "noVisitsCategory": "لا توجد زيارات ضمن هذا التصنيف",
  "join": "انضمام",
  "findScheduleMeetings": "البحث عن وجدولة اجتماعات مع الأطباء",
  "visitBookedSuccess": "تم حجز الزيارة بنجاح!",
  "creditUsed": "تم استهلاك رصيد واحد. بانتظار تأكيد الطبيب.",
  "searchDoctorHospital": "ابحث عن طبيب أو مستشفى...",
  "slotsOpen": "{{count}} مواعيد متاحة",
  "visitType": "نوع الزيارة",
  "noDoctorsYet": "لم تتم إضافة أطباء بعد",
  "addFirstDoctor": "أضف طبيبك الأول",
  "deleteDoctor": "هل تريد إزالة هذا الطبيب؟",
  "addDoctors": "إدارة أطباء المستشفى",
  "addDoctor": "إضافة طبيب",
  "totalDoctors": "إجمالي الأطباء"
};

let content = fs.readFileSync('src/i18n.ts', 'utf8');

// The Auto-Extracted Keys block starts near the bottom in the ar translation.
// We'll just loop through the object and do a replace in the ar block specifically.
// We'll find the Arabic block first.
const arBlockStart = content.indexOf('ar: {');
if (arBlockStart === -1) {
  console.log('Could not find ar block');
  process.exit(1);
}

for (const [key, value] of Object.entries(arTranslations)) {
  const regex = new RegExp(`(${key}:\\s*)'\\*[^']+'`, 'g');
  // Only replace occurrences that happen after arBlockStart
  content = content.replace(regex, (match, p1, offset) => {
    if (offset > arBlockStart) {
      return `${p1}'${value.replace(/'/g, "\\'")}'`;
    }
    return match;
  });
}

fs.writeFileSync('src/i18n.ts', content);
console.log('Translations inserted successfully!');
