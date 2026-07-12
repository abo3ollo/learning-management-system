// app/page.tsx

"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaPlay,
  FaStar,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaGlobe,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineEmail, MdOutlineRadio } from "react-icons/md";
import { Loader2 } from "lucide-react";
import * as Icons from "react-icons/fa";
import { PiStudentBold } from "react-icons/pi";
import { RiParentFill } from "react-icons/ri";
import { FaPhoneFlip } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui/card";

// ─── Icon Mapping ────────────────────────────────────────────────
const iconMap: Record<string, any> = {
  PiStudentBold: PiStudentBold,
  FaChalkboardTeacher: Icons.FaChalkboardTeacher,
  RiParentFill: RiParentFill,
  FaChartLine: Icons.FaChartLine,
  FaComments: Icons.FaComments,
  FaArchive: Icons.FaArchive,
  FaCheckCircle: Icons.FaCheckCircle,
  FaDesktop: Icons.FaDesktop,
  FaBroadcastTower: Icons.FaBroadcastTower,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Icons.FaCircle;
}

// ─── Component ───────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedEmbedType, setSelectedEmbedType] = useState<string>("youtube");

  // ✅ جلب البيانات من Convex - مع تمرير args فارغ
  const settings = useQuery(api.landing.landing.getPublicSettings, {});
  const sections = useQuery(api.landing.landing.getPublicSections, {});
  const courses = useQuery(api.landing.landing.getPublicCourses, {});
  const testimonials = useQuery(api.landing.landing.getPublicTestimonials, {});
  const videoTestimonials = useQuery(api.landing.landing.getPublicVideoTestimonials, {});

  // قائمة المواد
  const subjects = {
    ar: ["فيزياء", "رياضيات", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية"],
    en: ["Physics", "Mathematics", "Chemistry", "Biology", "Arabic", "English"]
  };

  // تغيير المادة كل 2 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubjectIndex((prev) => (prev + 1) % subjects.ar.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // حالة التحميل
  if (settings === undefined || sections === undefined || courses === undefined || testimonials === undefined || videoTestimonials === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // إذا لم توجد إعدادات، استخدم البيانات الافتراضية
  const defaultSettings = {
    heroBadge: "The Future of Marine Education",
    heroBadgeAr: "مستقبل التعليم البحري",
    heroTitle: "Learn Anytime, Anywhere with Marine Academy",
    heroTitleAr: "تعلّم في أي وقت، من أي مكان مع أكاديمية مارين",
    heroSubtitle: "A comprehensive educational platform designed to empower students and teachers through advanced interactive tools.",
    heroSubtitleAr: "منصة تعليمية شاملة مصممة لتمكين الطلاب والمعلمين من خلال أدوات تفاعلية متقدمة.",
    heroImageUrl: "/images/hero.png",
    ctaText: "Start Your Journey Now",
    ctaTextAr: "ابدأ رحلتك الآن",
    ctaUrl: "/onboarding",
    secondaryCta: "Free Demo",
    secondaryCtaAr: "عرض مجاني",
    secondaryCtaUrl: "#",
    stats: [
      { value: "5000+", label: "Active Students", labelAr: "طالب نشط" },
      { value: "200+", label: "Expert Teachers", labelAr: "معلم خبير" },
      { value: "50+", label: "Weekly Live Classes", labelAr: "فصل مباشر أسبوعياً" },
    ],
    themeMode: "dark" as const,
    showTestimonials: true,
    showCourses: true,
    showGallery: true,
    contactEmail: "info@marineacademy.com",
    contactPhone: "+966 50 000 0000",
    whatsappLink: "https://wa.me/966500000000",
    address: "Riyadh, Saudi Arabia",
    addressAr: "الرياض، المملكة العربية السعودية",
    footerDescription: "The global leader in marine and technical education.",
    footerDescriptionAr: "الرائد العالمي في التعليم البحري والتقني.",
    seoTitle: "Marine Academy - Premier Marine Education Platform",
    seoTitleAr: "أكاديمية مارين - منصة التعليم البحري الرائدة",
    seoDescription: "Marine Academy offers comprehensive marine education with live classes, expert teachers, and interactive learning tools.",
    seoDescriptionAr: "تقدم أكاديمية مارين تعليماً بحرياً شاملاً مع فصول مباشرة ومعلمين خبراء وأدوات تعلم تفاعلية.",
  };

  // دمج الإعدادات مع الافتراضية
  const data = { ...defaultSettings, ...settings };

  // دوال المساعدة للغة
  const t = {
    dir: lang === "ar" ? "rtl" : "ltr",
    nav: {
      students: lang === "ar" ? "الطلاب" : "Students",
      teachers: lang === "ar" ? "المعلمون" : "Teachers",
      parents: lang === "ar" ? "أولياء الأمور" : "Parents",
      liveClasses: lang === "ar" ? "الفصول المباشرة" : "Live Classes",
      login: lang === "ar" ? "تسجيل الدخول" : "Log In",
      getStarted: lang === "ar" ? "ابدأ الآن" : "Get Started",
    },
    hero: {
      badge: lang === "ar" ? data.heroBadgeAr : data.heroBadge,
      headline1: lang === "ar" ? "تعلّم في أي وقت، من أي مكان مع" : "Learn Anytime, Anywhere with",
      brand: lang === "ar" ? "أكاديمية مارين" : "Marine Academy",
      sub: lang === "ar" ? data.heroSubtitleAr : data.heroSubtitle,
      cta: lang === "ar" ? data.ctaTextAr : data.ctaText,
      demo: lang === "ar" ? data.secondaryCtaAr : data.secondaryCta,
      stats: data.stats.map((s: any) => ({
        value: s.value,
        label: lang === "ar" ? s.labelAr : s.label,
      })),
    },
    live: {
      badge: lang === "ar" ? "الفصل الحالي: الملاحة المتقدمة" : "Current Class: Advanced Navigation",
      live: lang === "ar" ? "مباشر" : "Live",
    },
    footer: {
      brand: lang === "ar" ? "أكاديمية مارين" : "Marine Academy",
      brandSub: lang === "ar" ? data.footerDescriptionAr : data.footerDescription,
      cols: lang === "ar" ? [
        { title: "الأكاديمية", links: ["عن الأكاديمية", "فريقنا", "الوظائف", "الأخبار"] },
        { title: "الموارد", links: ["المدونة", "مركز المساعدة", "معايير الأسطول", "الأسعار"] },
        { title: "القانونية", links: ["سياسة الخصوصية", "شروط الخدمة", "سياسة الكوكيز"] },
        { title: "الدعم", links: ["اتصل بنا", "تدريب الأسطول", "الدعم العالمي"] },
      ] : [
        { title: "Academy", links: ["About Us", "Our Team", "Careers", "News"] },
        { title: "Resources", links: ["Blog", "Help Center", "Marine Standards", "Pricing"] },
        { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
        { title: "Support", links: ["Contact Us", "Fleet Training", "Global Support"] },
      ],
      sitemap: lang === "ar" ? "خريطة الموقع" : "Sitemap",
      lang: lang === "ar" ? "العربية (AR)" : "English (EN)",
      copy: lang === "ar" ? "© 2024 أكاديمية مارين. جميع الحقوق محفوظة." : "© 2024 Marine Academy. All rights reserved.",
    },
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // عرض الأقسام من Convex
  const renderSections = () => {
    if (!sections || sections.length === 0) return null;

    return sections.map((section: any) => {
      const hasFeatures = section.features && section.features.length > 0;
      const hasCards = section.cards && section.cards.length > 0;
      const hasSteps = section.steps && section.steps.length > 0;

      return (
        <section key={section._id} className="py-20 bg-white" >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#0a2540] mb-3">
                {lang === "ar" ? section.titleAr || section.title : section.title}
              </h2>
              {section.subtitle && (
                <p className="text-gray-500 max-w-xl mx-auto">
                  {lang === "ar" ? section.subtitleAr || section.subtitle : section.subtitle}
                </p>
              )}
            </div>

            {/* عرض الكروت (Cards) */}
            {hasCards && (
              <div className="grid md:grid-cols-3 gap-6">
                {section.cards.map((card: any, idx: number) => {
                  const Icon = getIcon(card.icon);
                  return (
                    <div key={idx} className="border border-gray-100 rounded-2xl p-8 hover:border-[#1a7a8a]/30 hover:shadow-md transition-all group">
                      <div className="w-14 h-14 bg-[#e0f5f7] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#1a7a8a]/10 transition-colors">
                        <Icon className="w-7 h-7 text-[#1a6774]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0a2540] mb-3">
                        {lang === "ar" ? card.titleAr || card.title : card.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {lang === "ar" ? card.descAr || card.desc : card.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* عرض المميزات (Features) */}
            {hasFeatures && (
              <div className="space-y-5">
                {section.features.map((feature: any, idx: number) => {
                  const Icon = getIcon(feature.icon);
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-5 w-5 text-[#1a7a8a]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0a2540] mb-1">
                          {lang === "ar" ? feature.titleAr || feature.title : feature.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {lang === "ar" ? feature.descAr || feature.desc : feature.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* عرض الخطوات (Steps) */}
            {hasSteps && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.steps.map((step: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-[#1a7a8a] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    <h3 className="text-white font-bold mb-2">
                      {lang === "ar" ? step.titleAr || step.title : step.title}
                    </h3>
                    <p className="text-[#8eafc4] text-sm leading-relaxed">
                      {lang === "ar" ? step.descAr || step.desc : step.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    });
  };

  // ── VIDEO TESTIMONIALS SECTION ──────────────────────────────
const renderVideoTestimonials = () => {
  if (!videoTestimonials || videoTestimonials.length === 0) return null;

  return (
    <>
      <section className="py-20 bg-[#f7fafa]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#0a2540] mb-3">
              {lang === "ar" ? "لا تسمع منا... اسمع من طلابنا" : "Don't just take our word for it... hear from our students."}
            </h2>
            {/* <p className="text-gray-500">
              {lang === "ar" ? "أبواب السعودية" : "Abwab Saudi"}
            </p> */}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoTestimonials.map((video: any) => {
              const isYouTube = video.embedType === "youtube";
              const videoId = getYouTubeId(video.videoUrl);
              
              // ✅ عدة مصادر لغلاف اليوتيوب
              const getYouTubeThumbnail = (id: string) => {
                // جرب هذه المصادر بالترتيب
                const sources = [
                  `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,  // جودة عالية
                  `https://img.youtube.com/vi/${id}/hqdefault.jpg`,     // جودة متوسطة
                  `https://img.youtube.com/vi/${id}/mqdefault.jpg`,     // جودة منخفضة
                  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,     // بديل
                  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,         // بديل
                ];
                return sources;
              };

              const thumbnailSources = isYouTube && videoId 
                ? getYouTubeThumbnail(videoId)
                : [video.thumbnailUrl || '/images/video-placeholder.jpg'];

              // استخدام الصورة الأولى كمصدر رئيسي
              const thumbnailUrl = thumbnailSources[0];
              
              const embedUrl = isYouTube
                ? `https://www.youtube.com/embed/${videoId}`
                : video.videoUrl;

              return (
                <div 
                  key={video._id} 
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gray-900"
                  style={{ aspectRatio: '4/5' }}
                  onClick={() => openVideo(embedUrl, video.embedType)}
                >
                  {/* Thumbnail with fallback */}
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // إذا فشل التحميل، جرب الصورة التالية
                      const img = e.target as HTMLImageElement;
                      const currentSrc = img.src;
                      const currentIndex = thumbnailSources.indexOf(currentSrc);
                      
                      if (currentIndex < thumbnailSources.length - 1) {
                        img.src = thumbnailSources[currentIndex + 1];
                      } else {
                        // إذا فشلت كل الصور، استخدم صورة افتراضية
                        img.src = '/images/video-placeholder.jpg';
                      }
                    }}
                    loading="lazy"
                  />

                  {/* YouTube watermark indicator */}
                  {isYouTube && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube
                    </div>
                  )}

                  {/* Overlay with Play Button */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                      <svg 
                        className="w-8 h-8 md:w-10 md:h-10 text-[#0a2540] ml-1" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Title overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {lang === "ar" ? video.titleAr || video.title : video.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeVideo}
        >
          <div 
            className="relative w-full max-w-4xl"
            style={{ aspectRatio: '16/9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl transition-colors"
            >
              ✕
            </button>
            {selectedEmbedType === "youtube" ? (
              <iframe
                src={selectedVideo + (selectedVideo.includes('?') ? '&autoplay=1' : '?autoplay=1')}
                className="w-full h-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={selectedVideo}
                className="w-full h-full rounded-xl"
                controls
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

  // دالة مساعدة لاستخراج ID الفيديو من رابط YouTube
  function getYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "";
  }

  // عرض الدورات
  const renderCourses = () => {
    // ✅ استخدام data.showCourses
    if (!data.showCourses || !courses || courses.length === 0) return null;

    return (
      <section className="py-20 bg-[#f7fafa]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-3">
              {lang === "ar" ? "دوراتنا المميزة" : "Featured Courses"}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {lang === "ar" ? "اختر من بين أفضل الدورات التعليمية" : "Choose from our best educational courses"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course: any) => (
              <div key={course._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full h-48 bg-[#0a2540] overflow-hidden">
                  <img
                    src={course.imageUrl || "/images/course-placeholder.jpg"}
                    alt={course.title}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/course-placeholder.jpg";
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#0a2540] mb-2">
                    {lang === "ar" ? course.titleAr || course.title : course.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {lang === "ar" ? course.summaryAr || course.summary : course.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">👨‍🏫 {course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                  </div>
                  <Link href={course.ctaUrl || "#"}>
                    <button className="w-full mt-4 bg-[#001f24] hover:bg-[#03363d] text-white font-semibold py-2 rounded-lg transition-colors">
                      {lang === "ar" ? course.ctaTextAr || "سجل الآن" : course.ctaText || "Enroll Now"}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // عرض التوصيات
  const renderTestimonials = () => {
    // ✅ استخدام data.showTestimonials
    if (!data.showTestimonials || !testimonials || testimonials.length === 0) return null;

    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-3">
              {lang === "ar" ? "ماذا يقولون عنّا؟" : "What Do They Say About Us?"}
            </h2>
            <p className="text-gray-500">
              {lang === "ar" ? "قصص نجاح طلابنا وأولياء أمورهم" : "Success stories from our students and parents"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.slice(0, 4).map((item: any) => (
              <div key={item._id} className="border border-gray-100 rounded-2xl p-8 hover:border-[#1a7a8a]/30 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <FaStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {lang === "ar" ? item.textAr || item.text : item.text}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                    <span className="text-[#1a7a8a] font-bold text-sm">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540] text-sm">
                      {lang === "ar" ? item.nameAr || item.name : item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === "ar" ? item.roleAr || item.role : item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };


   const openVideo = (videoUrl: string, embedType: string) => {
    setSelectedVideo(videoUrl);
    setSelectedEmbedType(embedType);
  };

  // دالة إغلاق الفيديو
  const closeVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div dir={t.dir} className="font-sans bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-[#0a2540] shrink-0">
            Marine Academy
          </Link>

          {/* <div className="hidden lg:flex items-center gap-6 text-sm text-gray-600">
            {[t.nav.students, t.nav.teachers, t.nav.parents, t.nav.liveClasses].map((item) => (
              <a key={item} href="#" className="hover:text-[#0a2540] transition-colors">{item}</a>
            ))}
          </div> */}

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#0a2540] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <FaGlobe className="h-4 w-4" />
              {lang === "en" ? "EN" : "AR"}
            </button>
            {isSignedIn ? (
              <Link href="/onboarding">
                <button className="text-sm font-medium text-gray-700 hover:text-[#0a2540] px-3 py-1.5 transition-colors">
                  {t.nav.login}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-700 hover:text-[#0a2540] px-3 py-1.5 transition-colors">
                  {t.nav.login}
                </button>
              </SignInButton>
            )}
            {isSignedIn ? (
              <Link href="/onboarding">
                <button className="text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg hover:bg-[#0d3060] transition-colors">
                  {t.nav.getStarted}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg hover:bg-[#0d3060] transition-colors">
                  {t.nav.getStarted}
                </button>
              </SignInButton>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleLang} className="p-2 text-gray-600">
              <FaGlobe className="h-5 w-5" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600">
              {mobileOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {[t.nav.students, t.nav.teachers, t.nav.parents, t.nav.liveClasses].map((item) => (
              <a key={item} href="#" className="block text-sm text-gray-600 py-1">{item}</a>
            ))}
            <div className="pt-2 flex gap-3">
              {isSignedIn ? (
                <Link href="/onboarding" className="flex-1">
                  <button className="w-full text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg">
                    {t.nav.getStarted}
                  </button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="flex-1 text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg">
                    {t.nav.getStarted}
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 bg-linear-to-br from-[#f0f4f8] via-white to-[#e8f4f8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Rating Badge */}
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-gray-200 rounded-full px-4 py-2 mb-6 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-sm">★★★★★</span>
                  <span className="text-sm font-semibold text-gray-800 mr-1">4.8/5</span>
                </div>
                <span className="text-xs text-gray-500 border-r border-gray-200 pr-3">
                  {lang === "ar" ? "نسبة رضا الطالب" : "Student Satisfaction"}
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0a2540] leading-tight mb-4">
                {lang === "ar" ? (
                  <>
                    احجز معلمك الخصوصي لـ
                    <br />
                    <span className="text-[#1a7a8a] inline-block min-w-30 transition-all duration-500 ease-in-out">
                      {subjects.ar[currentSubjectIndex]}
                    </span>
                  </>
                ) : (
                  <>
                    Book Your Private Tutor for
                    <br />
                    <span className="text-[#1a7a8a] inline-block min-w-35 transition-all duration-500 ease-in-out">
                      {subjects.en[currentSubjectIndex]}
                    </span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                {lang === "ar"
                  ? "يفهمك المادة ويضمنك العالمة الكاملة"
                  : "Understands the subject and guarantees you the full mark"}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href={data.ctaUrl || "/onboarding"}>
                  <button className="bg-[#0a2540] hover:bg-[#1a3a5c] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    {lang === "ar" ? "إعرف أكثر عن باقات الدروس" : "Learn More About Lesson Packages"}
                  </button>
                </Link>
                <button className="border-2 border-[#0a2540] text-[#0a2540] hover:bg-[#0a2540] hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300">
                  {lang === "ar" ? "تواصل معنا" : "Contact Us"}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#1a7a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a2540]">
                      {lang === "ar" ? "معتمدين من" : "Accredited by"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === "ar" ? "المركز الوطني للتعليم الإلكتروني" : "National eLearning Center"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#1a7a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a2540]">
                      {lang === "ar" ? "المدرسة الأكثر تحميلاً" : "Most Downloaded School"}
                    </p>
                    <p className="text-xs text-gray-500">
                      2023/2024 {lang === "ar" ? "لعام" : "Year"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#1a7a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a2540]">
                      14+
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === "ar" ? "لجميع المراحل الدراسية" : "For All Academic Levels"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={data.heroImageUrl || "/images/hero.png"}
                    alt="Hero illustration"
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/hero-placeholder.jpg";
                    }}
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#0a2540]/20 to-transparent"></div>
                </div>

                {/* Floating Badge - IB/IGCSE */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1a7a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0a2540]">IB/IGCSE</p>
                      <p className="text-xs text-gray-500">
                        {lang === "ar" ? "المنهاج الوطني" : "National Curriculum"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge - Live Class */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1a7a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0a2540]">
                        {lang === "ar" ? "فصول مباشرة" : "Live Classes"}
                      </p>
                      <p className="text-xs text-red-500 font-medium">● {lang === "ar" ? "مباشر الآن" : "Live Now"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats floating on image */}
              <div className="absolute top-1/4 -left-6 bg-white/95 backdrop-blur rounded-2xl shadow-xl px-5 py-3 border border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0a2540]">4.8</p>
                  <p className="text-xs text-gray-500">⭐ {lang === "ar" ? "تقييم" : "Rating"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dynamic Sections from Convex ────────────────────────── */}
      {renderSections()}

      {/* ── Courses from Convex ─────────────────────────────────── */}
      {renderCourses()}

      {/* ── VIDEO TESTIMONIALS ─────────────────────────────────── */}
      {renderVideoTestimonials()}


      {/* ── CONTACT SECTION ────────────────────────────────────────── */}
      <section className="py-20 bg-linear-to-br from-[#0a2540] to-[#1a7a8a]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {lang === "ar" ? "تواصل معنا للمزيد من التفاصيل" : "Contact Us for More Details"}
          </h2>
          <p className="text-[#a3ced6] text-lg mb-8 max-w-2xl mx-auto">
            {lang === "ar"
              ? "نحن هنا للإجابة على جميع استفساراتك ومساعدتك في اختيار المسار التعليمي المناسب"
              : "We are here to answer all your questions and help you choose the right educational path"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* WhatsApp Button */}
            <a
              href={data.whatsappLink || "https://wa.me/966500000000"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Icons.FaWhatsapp className="h-6 w-6" />
              <span className="text-lg font-medium">
                {lang === "ar" ? "تواصل عبر الواتساب" : "Contact via WhatsApp"}
              </span>
            </a>

            {/* Email Button (Optional) */}
            {data.contactEmail && (
              <a
                href={`mailto:${data.contactEmail}`}
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <MdOutlineEmail className="h-6 w-6" />
                <span className="text-lg font-medium">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                </span>
              </a>
            )}

            {/* Phone Button (Optional) */}
            {data.contactPhone && (
              <a
                href={`tel:${data.contactPhone}`}
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <Icons.FaPhone className="h-6 w-6" />
                <span className="text-lg font-medium">
                  {lang === "ar" ? "اتصل بنا" : "Call Us"}
                </span>
              </a>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80">
            {data.contactEmail && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{data.contactEmail}</span>
              </div>
            )}
            {data.contactPhone && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span dir="ltr">{data.contactPhone}</span>
              </div>
            )}
            {data.address && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{lang === "ar" ? data.addressAr || data.address : data.address}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Testimonials from Convex ────────────────────────────── */}
      {renderTestimonials()}

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-24 bg-[#0a2540]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {lang === "ar" ? "هل أنت مستعد لبدء رحلتك التعليمية؟" : "Ready to Start Your Learning Journey?"}
          </h2>
          <p className="text-[#8eafc4] mb-10 leading-relaxed">
            {lang === "ar"
              ? "انضم إلى آلاف الطلاب اليوم واستمتع بتجربة تعليمية فريدة مع أفضل المعلمين والخبراء."
              : "Join thousands of students today and enjoy a unique learning experience with the best teachers and experts."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isSignedIn ? (
              <Link href={data.ctaUrl || "/onboarding"}>
                <button className="bg-white text-[#0a2540] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "ar" ? "ابدأ الآن مجاناً" : "Start Now for Free"}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="bg-white text-[#0a2540] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "ar" ? "ابدأ الآن مجاناً" : "Start Now for Free"}
                </button>
              </SignInButton>
            )}
            <button className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              {lang === "ar" ? "تواصل مع مستشار أكاديمي" : "Contact Academic Advisor"}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-[#060f1a] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <p className="text-xl font-bold mb-2">{t.footer.brand}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{t.footer.brandSub}</p>
              <div className="flex gap-3">
                {[FaFacebook, FaTwitter, FaInstagram].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Icon className="h-4 w-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>

            {t.footer.cols.map((col: any) => (
              <div key={col.title}>
                <p className="text-sm font-semibold mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link: string) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">{t.footer.copy}</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{t.footer.sitemap}</a>
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
              >
                <FaGlobe className="h-4 w-4" />
                {t.footer.lang}
                <FaChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}