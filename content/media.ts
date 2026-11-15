/**
 * Photography registry.
 *
 * ⚠ PLACEHOLDER IMAGERY — these are free stock photos from Pexels
 * (Pexels License: free for commercial use, no attribution required),
 * chosen to match the brand palette. They do NOT show Dr. Mohamed Gamal
 * or his clinic. Replace them with real clinic photography when available:
 * drop the new file in /public/images and point the entry at it.
 */
export interface Photo {
  src: string;
  width: number;
  height: number;
  /** Alt text per language. */
  alt: { ar: string; en: string };
}

const p = (id: string, width: number, height: number, ar: string, en: string): Photo => ({
  src: `/images/photos/pexels-${id}.jpg`,
  width,
  height,
  alt: { ar, en },
});

export const photos = {
  legRaiseTable: p("20860582", 2400, 1600, "أخصائي علاج طبيعي يساعد مريضاً على تمرين رفع الساق", "Physiotherapist guiding a patient through a straight-leg raise"),
  shoulderAssess: p("20860596", 2400, 1600, "أخصائية تقيّم حركة كتف المريض", "Physiotherapist assessing a patient's shoulder mobility"),
  gymStretch: p("20860616", 2400, 1600, "تمرين إطالة للساق داخل صالة التأهيل", "Assisted leg stretch in a rehabilitation gym"),
  matExercise: p("20860617", 2400, 1600, "مريض يؤدي تمرين توازن على السجادة بإشراف أخصائية", "Patient performing a balance exercise on a mat with supervision"),
  kneeHands: p("20860607", 2400, 1600, "علاج يدوي لمنطقة الركبة", "Manual therapy on the knee"),
  floorGuidance: p("20860622", 2400, 1600, "أخصائية توجّه مريضاً أثناء تمرين أرضي", "Physiotherapist guiding a patient through a floor exercise"),
  kneeSquare: p("20860595", 1400, 1400, "أخصائي يعالج ركبة مريض على طاولة العلاج", "Physiotherapist treating a patient's knee on the table"),
  sideLying: p("20860610", 1400, 933, "مريض على طاولة العلاج أثناء جلسة تأهيل", "Patient on the treatment table during a rehab session"),
  backAssess: p("20860586", 1400, 1400, "تقييم أسفل الظهر", "Lower-back assessment"),
  floorStretch: p("20860620", 1400, 2100, "إطالة أرضية بإشراف أخصائي", "Supervised floor stretch"),
  kneeClose: p("20860603", 1400, 933, "علاج يدوي للركبة عن قرب", "Close-up of manual knee therapy"),
  hipTable: p("20860597", 1400, 2100, "علاج منطقة الورك والساق", "Hip and leg treatment"),
  birdDog: p("20860618", 1400, 2100, "تمرين تثبيت الجذع", "Core stabilisation exercise"),
  gymLeg: p("20860625", 1400, 2100, "إطالة الساق في صالة التأهيل", "Leg stretch in the rehab gym"),
  ankleTable: p("20860614", 1400, 2100, "علاج القدم والكاحل", "Foot and ankle treatment"),
  legLift: p("20860584", 1400, 2100, "رفع الساق على طاولة العلاج", "Leg lift on the treatment table"),
  bandFoot: p("30483061", 1400, 2487, "تمرين القدم باستخدام الشريط المطاطي", "Resistance-band foot exercise"),
  balanceBoard: p("30483062", 1400, 2487, "تمرين توازن على لوح التوازن", "Balance-board exercise"),
  electro: p("30483049", 1400, 2487, "جلسة تحفيز كهربائي للركبة", "Electrical stimulation on the knee"),
  shoulderHands: p("37719628", 1400, 2100, "علاج يدوي للكتف", "Hands-on shoulder treatment"),
  armRaise: p("5793917", 1400, 2100, "تمرين رفع الذراعين", "Overhead arm exercise"),
  shoulderStretch: p("5793792", 1400, 933, "إطالة الكتف بمساعدة الأخصائية", "Assisted shoulder stretch"),
  shoulderGuide: p("5793700", 1400, 933, "توجيه وضعية الكتف", "Guiding shoulder posture"),
  dumbbell: p("4506073", 1400, 2100, "تمرين تقوية بالدمبل الخفيف", "Light-dumbbell strengthening exercise"),
  kneeTape: p("6094057", 1400, 2100, "شريط الكينيزيو على الركبة", "Kinesiology tape on the knee"),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
