"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import {
  FaArrowRight,
  FaPlay,
  FaDesktop,
  FaBroadcastTower,
  FaArchive,
  FaComments,
  FaChartLine,
  FaCheckCircle,
  FaStar,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaGlobe,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { HiOutlineAcademicCap } from "react-icons/hi";
import { MdOutlineMonitor, MdOutlineRadio } from "react-icons/md";
import { BsChatDots, BsBarChartSteps } from "react-icons/bs";
import { RiGraduationCapFill } from "react-icons/ri";

// ─── translations ────────────────────────────────────────────────
const t = {
  en: {
    dir: "ltr",
    nav: {
      students: "Students",
      teachers: "Teachers",
      parents: "Parents",
      liveClasses: "Live Classes",
      login: "Log In",
      getStarted: "Get Started",
    },
    hero: {
      badge: "The Future of Marine Education",
      headline1: "Learn Anytime, Anywhere with",
      brand: "Marine Academy",
      sub: "A comprehensive educational platform designed to empower students and teachers through advanced interactive tools and a safe, stimulating learning environment.",
      cta: "Start Your Journey Now",
      demo: "Free Demo",
      stats: [
        { value: "5000+", label: "Active Students" },
        { value: "200+", label: "Expert Teachers" },
        { value: "50+", label: "Weekly Live Classes" },
      ],
    },
    serve: {
      title: "Who Do We Serve?",
      sub: "We designed our tools to meet the specific needs of everyone in the educational ecosystem.",
      cards: [
        {
          icon: "🎓",
          title: "Students",
          desc: "An immersive learning experience with unlimited access to resources and personalised study plans that fit your own pace.",
        },
        {
          icon: "👨‍🏫",
          title: "Teachers",
          desc: "Advanced management tools, interactive virtual classrooms, and the ability to direct-track student performance and provide instant feedback.",
        },
        {
          icon: "👨‍👩‍👧",
          title: "Parents",
          desc: "A comprehensive dashboard to monitor children's education, and the ability to direct communications with staff to ensure best results.",
        },
      ],
    },
    live: {
      title: "Highly Interactive Live Classes",
      sub: "Go beyond the limits of traditional learning with our virtual classrooms that allow real-time interaction, progress tracking, and advanced digital explanation tools.",
      features: [
        { icon: FaChartLine,    title: "Real time Progress Tracking",  desc: "Analyse student performance during the session and identify strengths and weaknesses immediately." },
        { icon: FaComments,     title: "Interactive Discussions",       desc: "Breakout rooms to promote student collaboration and group problem solving." },
        { icon: FaArchive,      title: "Smart Archiving",               desc: "Automatically recording of all lectures with smart indexing for easy review." },
      ],
      badge: "Current Class: Advanced Navigation",
      live: "Live",
    },
    journey: {
      title: "How to Start Your Journey?",
      sub: "Simple steps separate you from joining the best specialised educational academy.",
      steps: [
        { n: "1", title: "Register Now",       desc: "Create your account in less than a minute for free." },
        { n: "2", title: "Choose Your Course",  desc: "Browse hundreds of specialised courses in various fields." },
        { n: "3", title: "Join the Class",      desc: "Start learning with elite experts." },
        { n: "4", title: "Track Your Progress", desc: "Get certified and receive periodic performance reports." },
      ],
    },
    parents: {
      title: "For Parents: Be Part of Their Success",
      sub: "We believe that the partnership between home and the academy is the key to success. We've provided all the tools you need to stay close to your child's educational journey.",
      features: [
        { icon: FaComments,     title: "Direct Communication", desc: "Live chats with teachers and coordinators at any time." },
        { icon: FaChartLine,    title: "Precise Tracking",    desc: "Weekly and monthly performance reports showing the student's progress." },
      ],
    },
    teachers: {
      title: "For Teachers: Teach with Creativity",
      sub: "Give your students the best educational experience through smart assignment management and virtual classroom tools that save time and increase productivity.",
      features: [
        { icon: FaCheckCircle,  title: "Automated Assignment Management", desc: "Automated grading and distribution task for each academic level." },
        { icon: FaDesktop,      title: "Integrated Virtual Classrooms",  desc: "Smart whiteboard tools, file sharing, and real-time polling." },
      ],
    },
    testimonials: {
      title: "What Do They Say About Us?",
      sub: "Success stories from our students and parents around the world.",
      items: [
        { stars: 5, text: '"Marine Academy has completely changed my view of education. The live classes are very interactive, and the content is rich and easy to understand!"', name: "Sara Ahmed", role: "Marine Science Student" },
        { stars: 5, text: '"As a teacher, I found everything I need to manage my classes efficiently here. The technical tools are fantastic and make transferring information to students much easier!"', name: "Mr. Mohamed Khaled", role: "Expert Teacher" },
      ],
    },
    cta: {
      title: "Ready to Start Your Learning Journey?",
      sub: "Join thousands of students today and enjoy a unique learning experience with the best teachers and experts.",
      btn1: "Start Now for Free",
      btn2: "Contact Academic Advisor",
    },
    footer: {
      brand: "Marine Academy",
      brandSub: "The global leader in marine and technical education, aiming to graduate a creative and technologically empowered generation.",
      cols: [
        { title: "Academy",   links: ["About Us", "Our Team", "Careers", "News"] },
        { title: "Resources", links: ["Blog", "Help Center", "Marine Standards", "Pricing"] },
        { title: "Legal",     links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
        { title: "Support",   links: ["Contact Us", "Fleet Training", "Global Support"] },
      ],
      sitemap: "Sitemap",
      lang: "English (EN)",
      copy: "© 2024 Marine Academy. All rights reserved.",
    },
  },
  ar: {
    dir: "rtl",
    nav: {
      students: "الطلاب",
      teachers: "المعلمون",
      parents: "أولياء الأمور",
      liveClasses: "الفصول المباشرة",
      pricing: "الأسعار",
      login: "تسجيل الدخول",
      getStarted: "ابدأ الآن",
    },
    hero: {
      badge: "مستقبل التعليم البحري",
      headline1: "تعلّم في أي وقت، من أي مكان مع",
      brand: "أكاديمية مارين",
      sub: "منصة تعليمية شاملة مصممة لتمكين الطلاب والمعلمين من خلال أدوات تفاعلية متقدمة وبيئة تعليمية آمنة ومحفِّزة.",
      cta: "ابدأ رحلتك الآن",
      demo: "عرض مجاني",
      stats: [
        { value: "+5000", label: "طالب نشط" },
        { value: "+200", label: "معلم خبير" },
        { value: "+50", label: "فصل مباشر أسبوعياً" },
      ],
    },
    serve: {
      title: "من نخدم؟",
      sub: "صمّمنا أدواتنا لتلبية الاحتياجات الخاصة لكل فرد في المنظومة التعليمية.",
      cards: [
        { icon: "🎓", title: "الطلاب",           desc: "تجربة تعليمية غامرة مع وصول غير محدود للموارد وخطط دراسية مخصصة تناسب وتيرتك الخاصة." },
        { icon: "👨‍🏫", title: "المعلمون",        desc: "أدوات إدارة متقدمة وفصول افتراضية تفاعلية وإمكانية متابعة أداء الطلاب مباشرةً وتقديم تغذية راجعة فورية." },
        { icon: "👨‍👩‍👧", title: "أولياء الأمور", desc: "لوحة تحكم شاملة لمتابعة التعليم والتواصل المباشر مع الكادر لضمان أفضل النتائج." },
      ],
    },
    live: {
      title: "فصول مباشرة تفاعلية للغاية",
      sub: "تجاوز حدود التعلم التقليدي مع فصولنا الافتراضية التي تتيح التفاعل الفوري ومتابعة التقدم وأدوات الشرح الرقمية المتقدمة.",
      features: [
        { icon: FaChartLine,     title: "تتبع التقدم الفوري",      desc: "تحليل أداء الطالب خلال الجلسة وتحديد نقاط القوة والضعف فوراً." },
        { icon: FaComments,      title: "نقاشات تفاعلية",          desc: "غرف تجمّع لتعزيز التعاون بين الطلاب وحل المشكلات جماعياً." },
        { icon: FaArchive,       title: "أرشفة ذكية",              desc: "تسجيل تلقائي لجميع المحاضرات مع فهرسة ذكية لسهولة المراجعة." },
      ],
      badge: "الفصل الحالي: الملاحة المتقدمة",
      live: "مباشر",
    },
    journey: {
      title: "كيف تبدأ رحلتك؟",
      sub: "خطوات بسيطة تفصلك عن الانضمام إلى أفضل أكاديمية تعليمية متخصصة.",
      steps: [
        { n: "1", title: "سجّل الآن",          desc: "أنشئ حسابك في أقل من دقيقة مجاناً." },
        { n: "2", title: "اختر دورتك",          desc: "تصفّح مئات الدورات المتخصصة في مجالات متنوعة." },
        { n: "3", title: "انضم إلى الفصل",      desc: "ابدأ التعلم مع نخبة من الخبراء." },
        { n: "4", title: "تابع تقدمك",          desc: "احصل على شهادة وتقارير أداء دورية." },
      ],
    },
    parents: {
      title: "لأولياء الأمور: كونوا جزءاً من نجاحهم",
      sub: "نؤمن بأن الشراكة بين المنزل والأكاديمية هي مفتاح النجاح. وفّرنا لك جميع الأدوات للبقاء قريباً من رحلة طفلك التعليمية.",
      features: [
        { icon: FaComments,      title: "تواصل مباشر", desc: "دردشات مباشرة مع المعلمين والمنسقين في أي وقت." },
        { icon: FaChartLine,     title: "متابعة دقيقة", desc: "تقارير أداء أسبوعية وشهرية تُظهر تقدم الطالب." },
      ],
    },
    teachers: {
      title: "للمعلمين: علّموا بإبداع",
      sub: "امنح طلابك أفضل تجربة تعليمية من خلال إدارة ذكية للواجبات وأدوات الفصول الافتراضية التي توفّر الوقت وتزيد الإنتاجية.",
      features: [
        { icon: FaCheckCircle,   title: "إدارة آلية للواجبات",      desc: "تصحيح وتوزيع آلي للمهام لكل مستوى دراسي." },
        { icon: FaDesktop,       title: "فصول افتراضية متكاملة",   desc: "أدوات لوح ذكي ومشاركة ملفات واستطلاع فوري." },
      ],
    },
    testimonials: {
      title: "ماذا يقولون عنّا؟",
      sub: "قصص نجاح طلابنا وأولياء أمورهم من حول العالم.",
      items: [
        { stars: 5, text: '"غيّرت أكاديمية مارين نظرتي للتعليم كلياً. الفصول المباشرة تفاعلية جداً والمحتوى غني وسهل الفهم!"', name: "سارة أحمد", role: "طالبة علوم بحرية" },
        { stars: 5, text: '"كمعلم، وجدت هنا كل ما أحتاجه لإدارة فصولي بكفاءة. الأدوات التقنية رائعة وتجعل إيصال المعلومات للطلاب أسهل بكثير!"', name: "الأستاذ محمد خالد", role: "معلم خبير" },
      ],
    },
    cta: {
      title: "هل أنت مستعد لبدء رحلتك التعليمية؟",
      sub: "انضم إلى آلاف الطلاب اليوم واستمتع بتجربة تعليمية فريدة مع أفضل المعلمين والخبراء.",
      btn1: "ابدأ الآن مجاناً",
      btn2: "تواصل مع مستشار أكاديمي",
    },
    footer: {
      brand: "أكاديمية مارين",
      brandSub: "الرائد العالمي في التعليم البحري والتقني، يسعى إلى تخريج جيل مبدع ومتمكن تكنولوجياً.",
      cols: [
        { title: "الأكاديمية", links: ["عن الأكاديمية", "فريقنا", "الوظائف", "الأخبار"] },
        { title: "الموارد",    links: ["المدونة", "مركز المساعدة", "معايير الأسطول", "الأسعار"] },
        { title: "القانونية", links: ["سياسة الخصوصية", "شروط الخدمة", "سياسة الكوكيز"] },
        { title: "الدعم",      links: ["اتصل بنا", "تدريب الأسطول", "الدعم العالمي"] },
      ],
      sitemap: "خريطة الموقع",
      lang: "العربية (AR)",
      copy: "© 2024 أكاديمية مارين. جميع الحقوق محفوظة.",
    },
  },
};

// ─── Component ───────────────────────────────────────────────────
export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const c = t[lang];

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  return (
    <div dir={c.dir} className="font-sans bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-[#0a2540] shrink-0">
            Marine Academy
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-6 text-sm text-gray-600">
            {[c.nav.students, c.nav.teachers, c.nav.parents, c.nav.liveClasses].map((item) => (
              <a key={item} href="#" className="hover:text-[#0a2540] transition-colors">{item}</a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {/* Language toggle */}
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
                  {c.nav.login}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-700 hover:text-[#0a2540] px-3 py-1.5 transition-colors">
                  {c.nav.login}
                </button>
              </SignInButton>
            )}
            {isSignedIn ? (
              <Link href="/onboarding">
                <button className="text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg hover:bg-[#0d3060] transition-colors">
                  {c.nav.getStarted}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg hover:bg-[#0d3060] transition-colors">
                  {c.nav.getStarted}
                </button>
              </SignInButton>
            )}
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleLang} className="p-2 text-gray-600">
              <FaGlobe className="h-5 w-5" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600">
              {mobileOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {[c.nav.students, c.nav.teachers, c.nav.parents, c.nav.liveClasses].map((item) => (
              <a key={item} href="#" className="block text-sm text-gray-600 py-1">{item}</a>
            ))}
            <div className="pt-2 flex gap-3">
              {isSignedIn ? (
                <Link href="/onboarding" className="flex-1">
                  <button className="w-full text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg">
                    {c.nav.getStarted}
                  </button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="flex-1 text-sm font-semibold bg-[#0a2540] text-white px-4 py-2 rounded-lg">
                    {c.nav.getStarted}
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 bg-linear-to-br from-[#f0f4f8] via-white to-[#e8f4f8]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold text-[#1a7a8a] bg-[#e0f5f7] px-3 py-1.5 rounded-full mb-6">
              {c.hero.badge}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-4">
              {c.hero.headline1}{" "}
              <span className="text-[#1a7a8a]">{c.hero.brand}</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              {c.hero.sub}
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              {isSignedIn ? (
                <Link href="/onboarding">
                  <button className="flex items-center gap-2 bg-[#0a2540] hover:bg-[#0d3060] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                    {c.hero.cta} <FaArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 bg-[#0a2540] hover:bg-[#0d3060] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                    {c.hero.cta} <FaArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
              )}
              <button className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors">
                <FaPlay className="h-4 w-4 text-[#1a7a8a]" /> {c.hero.demo}
              </button>
            </div>
            <div className="flex gap-10">
              {c.hero.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-[#0a2540]">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image placeholder */}
          <div className="relative hidden lg:block">
            <div className="w-full h-105 bg-linear-to-br from-[#0a2540] to-[#1a7a8a] rounded-3xl overflow-hidden flex items-center justify-center">
              <div className="text-center text-white opacity-60">
                <FaDesktop className="h-20 w-20 mx-auto mb-4" />
                <p className="text-sm">Platform Preview</p>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                <MdOutlineRadio className="h-4 w-4 text-[#1a7a8a]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0a2540]">{c.live.badge}</p>
                <p className="text-xs text-red-500 font-medium">● {c.live.live}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO WE SERVE ────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-3">{c.serve.title}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{c.serve.sub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {c.serve.cards.map((card) => (
              <div key={card.title} className="border border-gray-100 rounded-2xl p-8 hover:border-[#1a7a8a]/30 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-[#e0f5f7] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#1a7a8a]/10 transition-colors">
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-3">{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE CLASSES ────────────────────────────────────────── */}
      <section className="py-20 bg-[#f7fafa]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Mock screen */}
          <div className="bg-[#0a2540] rounded-3xl overflow-hidden aspect-video flex items-center justify-center relative order-last lg:order-first">
            <div className="text-center text-white opacity-40">
              <FaDesktop className="h-16 w-16 mx-auto mb-3" />
              <p className="text-xs">Live Class Interface</p>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur rounded-xl px-4 py-2 flex items-center justify-between">
              <p className="text-white text-xs font-medium">{c.live.badge}</p>
              <span className="text-red-400 text-xs font-semibold">● {c.live.live}</span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-[#0a2540] mb-4">{c.live.title}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">{c.live.sub}</p>
            <div className="space-y-5">
              {c.live.features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-[#1a7a8a]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0a2540] mb-1">{f.title}</p>
                      <p className="text-sm text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO START ────────────────────────────────────────── */}
      <section className="py-20 bg-[#0a2540]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">{c.journey.title}</h2>
            <p className="text-[#8eafc4] max-w-xl mx-auto">{c.journey.sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.journey.steps.map((step) => (
              <div key={step.n} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-[#1a7a8a] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">{step.n}</span>
                </div>
                <h3 className="text-white font-bold mb-2">{step.title}</h3>
                <p className="text-[#8eafc4] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR PARENTS ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#0a2540] mb-4">{c.parents.title}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">{c.parents.sub}</p>
            <div className="grid sm:grid-cols-2 gap-5">
              {c.parents.features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="border border-gray-100 rounded-xl p-5 hover:border-[#1a7a8a]/30 transition-colors">
                    <Icon className="h-6 w-6 text-[#1a7a8a] mb-3" />
                    <p className="font-semibold text-[#0a2540] mb-1">{f.title}</p>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:block bg-linear-to-br from-[#e0f5f7] to-[#f0f9fa] rounded-3xl aspect-square flex items-center justify-center">
            <div className="text-center text-[#1a7a8a] opacity-40 p-12">
              <span className="text-8xl">👨‍👩‍👧</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR TEACHERS ────────────────────────────────────────── */}
      <section className="py-20 bg-[#f7fafa]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="bg-linear-to-br from-[#0a2540] to-[#1a7a8a] rounded-3xl aspect-square flex items-center justify-center">
            <div className="text-center text-white opacity-40 p-12">
              <span className="text-8xl">👨‍🏫</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0a2540] mb-4">{c.teachers.title}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">{c.teachers.sub}</p>
            <div className="space-y-4">
              {c.teachers.features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-4 items-start border border-gray-100 rounded-xl p-5">
                    <Icon className="h-5 w-5 text-[#1a7a8a] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#0a2540] mb-1">{f.title}</p>
                      <p className="text-sm text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-3">{c.testimonials.title}</h2>
            <p className="text-gray-500">{c.testimonials.sub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {c.testimonials.items.map((item) => (
              <div key={item.name} className="border border-gray-100 rounded-2xl p-8 hover:border-[#1a7a8a]/30 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: item.stars }).map((_, i) => (
                    <FaStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{item.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                    <span className="text-[#1a7a8a] font-bold text-sm">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540] text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-24 bg-[#0a2540]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{c.cta.title}</h2>
          <p className="text-[#8eafc4] mb-10 leading-relaxed">{c.cta.sub}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isSignedIn ? (
              <Link href="/onboarding">
                <button className="bg-white text-[#0a2540] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                  {c.cta.btn1}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="bg-white text-[#0a2540] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                  {c.cta.btn1}
                </button>
              </SignInButton>
            )}
            <button className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              {c.cta.btn2}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-[#060f1a] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <p className="text-xl font-bold mb-2">{c.footer.brand}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{c.footer.brandSub}</p>
              <div className="flex gap-3">
                {[FaFacebook, FaTwitter, FaInstagram].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Icon className="h-4 w-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* Link cols */}
            {c.footer.cols.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
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
            <p className="text-sm text-gray-500">{c.footer.copy}</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{c.footer.sitemap}</a>
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
              >
                <FaGlobe className="h-4 w-4" />
                {c.footer.lang}
                <FaChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}