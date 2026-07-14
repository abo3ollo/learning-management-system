// app/(pages)/trips/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
    ArrowRight,
    Calendar,
    MapPin,
    Clock,
    Users,
    Star,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Loader2,
    Globe,
    Award,
    Shield,
    GraduationCap,
    Building2,
    Sparkles,
    Target,
    MessageCircle,
    CheckCircle,
    Home,
    Plane,
    Briefcase,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TripsPage() {
    const [lang, setLang] = useState<"en" | "ar">("ar");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const tripsPerPage = 6;

    const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

    // تعريف الخدمات مع دعم اللغة
    const services = [
        {
            icon: Home,
            title: { ar: "تنظيم إقامة", en: "Accommodation Arrangement" },
            desc: {
                ar: "نوفّر لك السكن بما يناسب احتياجاتك سواء في سكن الطلاب أو مع عائلة مضيفة.",
                en: "We provide accommodation that suits your needs, whether in student housing or with a host family."
            }
        },
        {
            icon: BookOpen,
            title: { ar: "تنسيق البرنامج التعليمي", en: "Educational Program Coordination" },
            desc: {
                ar: "ننسق كل تفاصيل برنامجك: المدة، المستوى، المعهد، السكن، والأنشطة المناسبة.",
                en: "We coordinate all details of your program: duration, level, institute, accommodation, and appropriate activities."
            }
        },
        {
            icon: Target,
            title: { ar: "ترشيح المعهد أو المخيم الأنسب", en: "Best Institute or Camp Recommendation" },
            desc: {
                ar: "نحلل هدفك وسنواتك ومهاراتك، ونرشح لك الخيار الأفضل بدقة واحترافية.",
                en: "We analyze your goal, years, and skills, and recommend the best option with precision and professionalism."
            }
        },
        {
            icon: MessageCircle,
            title: { ar: "استشارة مجانية", en: "Free Consultation" },
            desc: {
                ar: "جلسة استشارية مجانية تحدد فيها عملياً أفضل مسار لتحقيق هدفك.",
                en: "A free consultation session where you practically determine the best path to achieve your goal."
            }
        },
        {
            icon: Shield,
            title: { ar: "دعم وإرشاد متواصل", en: "Continuous Support and Guidance" },
            desc: {
                ar: "نوافرك قبل السفر وأثناء الإقامة لتوفير تجربة مناسبة في كل مرحلة.",
                en: "We support you before travel and during your stay to provide a suitable experience at every stage."
            }
        },
        {
            icon: Calendar,
            title: { ar: "خطة أنشطة وفعاليات", en: "Activities and Events Plan" },
            desc: {
                ar: "نُعدّ لك خطة أنشطة خارجية تعزز الممارسة اليومية وتنوع تجاربك.",
                en: "We prepare an external activities plan that enhances daily practice and diversifies your experiences."
            }
        }
    ];

    // تعريف المسارات
    const paths = [
        {
            icon: GraduationCap,
            title: { ar: "البرامج الصيفية والمخيمات", en: "Summer Programs and Camps" },
            desc: {
                ar: "تجربة متكاملة للطالب تجمع الدراسة والأنشطة.",
                en: "An integrated student experience combining study and activities."
            }
        },
        {
            icon: BookOpen,
            title: { ar: "البرامج التعليمية كاملة", en: "Complete Educational Programs" },
            desc: {
                ar: "تجربة متكاملة للطالب تجمع الدراسة والأنشطة.",
                en: "An integrated student experience combining study and activities."
            }
        },
        {
            icon: Award,
            title: { ar: "الجيزة العامة", en: "General Preparation" },
            desc: {
                ar: "تأسيس وتطوير شامل لمعايير التعلم.",
                en: "Comprehensive foundation and development of learning standards."
            }
        }
    ];

    return (
        <div className="min-h-screen bg-[#f7fafa]" dir={lang === "ar" ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-white/80 hover:text-white transition-colors">
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {lang === "ar" ? "الرحلات التعليمية" : "Educational Trips"}
                            </h1>
                            <p className="text-[#a3ced6] text-sm">
                                {lang === "ar"
                                    ? "استكشف العالم وتعلم مع رحلاتنا التعليمية المميزة"
                                    : "Explore the world and learn with our distinctive educational trips"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
                    >
                        <Globe className="h-4 w-4" />
                        {lang === "en" ? "AR" : "EN"}
                    </button>
                </div>
            </header>

            <div className="w-full mx-auto  py-8 space-y-16">

                {/* ================= HERO ================= */}
                <section className="relative flex flex-col items-center justify-center w-full min-h-screen overflow-hidden -mt-24  pb-24 md:px-10">
                    {/* Background */}
                    <div
                        className="absolute inset-0 bg-cover"
                        style={{
                            backgroundImage: "url('/images/london.jpg')",
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-b from-[#001f24]/90 via-[#001f24]/80 to-[#03363d]/95" />

                    {/* Content */}
                    <div className="relative z-10 w-[90%] md:w-[85%] lg:w-[80%] container mx-auto">
                        <div className={`w-full text-${lang === "ar" ? "right" : "left"} text-white`}>

                            {/* Badge */}
                            <div className={`inline-flex items-center gap-2 mb-3 md:mb-4 bg-[#1a7a8a]/20 text-[#1a7a8a] border border-[#1a7a8a]/30 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm backdrop-blur-sm`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1a7a8a] animate-pulse"></span>
                                {lang === "ar"
                                    ? "منصتك الموثوقة للدراسة في بريطانيا"
                                    : "Your Trusted UK Education Partner"}
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                                {lang === "ar" ? (
                                    <>
                                        تعلم الإنجليزية
                                        <br />
                                        في
                                        <span className="text-[#1a7a8a]"> بريطانيا</span>
                                        <br />
                                        بخطوات واضحة
                                    </>
                                ) : (
                                    <>
                                        Learn English
                                        <br />
                                        in
                                        <span className="text-[#1a7a8a]"> Britain</span>
                                        <br />
                                        with Confidence
                                    </>
                                )}
                            </h1>

                            {/* Subtitle */}
                            <p className={`mt-3 md:mt-4 text-sm md:text-base lg:text-lg text-[#a3ced6] leading-relaxed max-w-xl ${lang === "ar" ? "text-right" : "text-left"}`}>
                                {lang === "ar"
                                    ? "نرشح لك المعاهد والبرامج المناسبة حسب مستوى وهدفك وميزانيتك. مع دعم مستمر، نعمل على التواصل حتى العودة."
                                    : "We recommend the right institutes and programs based on your level, goal, and budget. With continuous support, we stay connected until your return."}
                            </p>

                            {/* Trust indicators */}
                            <div className={`flex flex-wrap items-center gap-3 md:gap-5 mt-3 md:mt-4 text-xs md:text-sm text-[#a3ced6] ${lang === "ar" ? "justify-start" : "justify-start"}`}>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#1a7a8a]" />
                                    <span>{lang === "ar" ? "معاهد معتمدة" : "Accredited Institutes"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#1a7a8a]" />
                                    <span>{lang === "ar" ? "إقامة آمنة" : "Safe Accommodation"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#1a7a8a]" />
                                    <span>{lang === "ar" ? "دعم متواصل" : "Continuous Support"}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className={`mt-4 md:mt-6 flex flex-wrap gap-3 ${lang === "ar" ? "justify-start" : "justify-start"}`}>
                                <a
                                    href="https://wa.me/966500000000"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button className="bg-[#25D366] hover:bg-[#1da851] text-white h-10 md:h-11 px-4 md:px-5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-[#25D366]/30 hover:scale-105 text-xs md:text-sm gap-2">
                                        <MessageCircle className="h-4 w-4" />
                                        {lang === "ar" ? "تواصل عبر واتساب" : "WhatsApp"}
                                    </Button>
                                </a>

                                <Link href="/contact">
                                    <Button className="bg-[#1a7a8a] hover:bg-[#15707e] text-white h-10 md:h-11 px-4 md:px-5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-[#1a7a8a]/30 hover:scale-105 text-xs md:text-sm">
                                        {lang === "ar" ? "تواصل معنا" : "Contact Us"}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Cards - Taxi style cards */}
                    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-3 md:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">

                            <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-default group">
                                <CardContent className="p-3 md:p-4 text-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1a7a8a]/30 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                                        <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-[#1a7a8a]" />
                                    </div>
                                    <h4 className="font-semibold text-xs md:text-sm">{lang === "ar" ? "برامج متنوعة" : "Diverse Programs"}</h4>
                                    <p className="text-[10px] md:text-xs text-[#a3ced6] mt-0.5">
                                        {lang === "ar" ? "عام • مكثف • صيفي" : "General • Intensive • Summer"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-default group">
                                <CardContent className="p-3 md:p-4 text-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1a7a8a]/30 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                                        <Home className="h-5 w-5 md:h-6 md:w-6 text-[#1a7a8a]" />
                                    </div>
                                    <h4 className="font-semibold text-xs md:text-sm">{lang === "ar" ? "خيارات إقامة" : "Accommodation"}</h4>
                                    <p className="text-[10px] md:text-xs text-[#a3ced6] mt-0.5">
                                        {lang === "ar" ? "عائلية • طلابية" : "Host Family • Student"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-default group">
                                <CardContent className="p-3 md:p-4 text-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1a7a8a]/30 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                                        <Plane className="h-5 w-5 md:h-6 md:w-6 text-[#1a7a8a]" />
                                    </div>
                                    <h4 className="font-semibold text-xs md:text-sm">{lang === "ar" ? "أنشطة ورحلات" : "Activities & Trips"}</h4>
                                    <p className="text-[10px] md:text-xs text-[#a3ced6] mt-0.5">
                                        {lang === "ar" ? "داخل وخارج المعهد" : "Inside & Outside"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-default group">
                                <CardContent className="p-3 md:p-4 text-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1a7a8a]/30 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                                        <Shield className="h-5 w-5 md:h-6 md:w-6 text-[#1a7a8a]" />
                                    </div>
                                    <h4 className="font-semibold text-xs md:text-sm">{lang === "ar" ? "متابعة ودعم" : "Support & Follow-up"}</h4>
                                    <p className="text-[10px] md:text-xs text-[#a3ced6] mt-0.5">
                                        {lang === "ar" ? "قبل وأثناء السفر" : "Before & During"}
                                    </p>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </section>

                {/* ============================================================ */}
                {/* 1. لماذا الدراسة في بريطانيا؟ */}
                {/* ============================================================ */}
                <section className="w-[85%] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540]">
                            {lang === "ar" ? "لماذا الدراسة في بريطانيا؟" : "Why Study in Britain?"}
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#e0f5f7] flex items-center justify-center text-[#1a7a8a] font-bold text-xl shrink-0">01</div>
                                <div>
                                    <h4 className="font-bold text-[#0a2540] text-lg">
                                        {lang === "ar" ? "اللغة في بيئتها الطبيعية" : "Language in Its Natural Environment"}
                                    </h4>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {lang === "ar"
                                            ? "تعمل على تحسين اللغة في كل بلد، من المفترض أن اللغة الرادسة، مما يتحقق من نجاح النمو في مجال التعليم."
                                            : "Work on improving the language in every country, from the assumption that the language is spoken, which ensures the success of growth in the field of education."}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#e0f5f7] flex items-center justify-center text-[#1a7a8a] font-bold text-xl shrink-0">02</div>
                                <div>
                                    <h4 className="font-bold text-[#0a2540] text-lg">
                                        {lang === "ar" ? "معاهد بمعايير جودة عالية" : "Institutes with High Quality Standards"}
                                    </h4>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {lang === "ar"
                                            ? "تعمل مع معاهد وحكومات محاكاة وفق معايير جودة صارمة لضمان تجربة تعليمية استثنائية لكل المستندات."
                                            : "Working with institutes and governments simulated according to strict quality standards to ensure an exceptional educational experience for everyone."}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#e0f5f7] flex items-center justify-center text-[#1a7a8a] font-bold text-xl shrink-0">03</div>
                                <div>
                                    <h4 className="font-bold text-[#0a2540] text-lg">
                                        {lang === "ar" ? "تنوع ثقافي يعزز الثقة" : "Cultural Diversity Builds Confidence"}
                                    </h4>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {lang === "ar"
                                            ? "التواصل مع طلاب من أكثر من 50 جنسية تتجاوز معيار المحادثة بشكل شامل، ويجب أن تكون اللغة حقيقية بالفضة."
                                            : "Communication with students from more than 50 nationalities goes beyond the standard of conversation comprehensively, and the language must be truly fluent."}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#e0f5f7] flex items-center justify-center text-[#1a7a8a] font-bold text-xl shrink-0">04</div>
                                <div>
                                    <h4 className="font-bold text-[#0a2540] text-lg">
                                        {lang === "ar" ? "تجربة تعليمية متكاملة" : "Integrated Educational Experience"}
                                    </h4>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {lang === "ar"
                                            ? "الدراسات + التدريب + الإقامة في حزمة واحدة متنوعة تُحقق أفضل عائد من الوقت والكفاءة."
                                            : "Studies + Training + Accommodation in one diverse package achieves the best return on time and efficiency."}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="text-center mt-8">
                        <Badge className="bg-[#1a7a8a] text-white text-sm px-4 py-2">
                            {lang === "ar" ? "السفر: القوى" : "Travel: The Power"}
                        </Badge>
                    </div>
                </section>

                {/* ============================================================ */}
                {/* 2. لم نهد البرامج؟ */}
                {/* ============================================================ */}
                <section className=" w-[85%] mx-auto bg-linear-to-r from-[#0a2540] to-[#1a7a8a] rounded-2xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {lang === "ar" ? "لم نهد البرامج؟" : "Why Our Programs?"}
                    </h2>
                    <p className="text-[#a3ced6] text-lg max-w-2xl mx-auto">
                        {lang === "ar"
                            ? "ضمّمت لأهدافك أنت — ترشيح دقيق يضمن أن يحصل كل متقدم على الخيار الأنسب لعموم ومسؤولية واحدة."
                            : "Designed for your goals — precise recommendations ensure every applicant gets the most suitable option."}
                    </p>
                </section>

                {/* ============================================================ */}
                {/* 3. خدماتنا */}
                {/* ============================================================ */}
                <section className="w-[85%] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540]">
                            {lang === "ar" ? "خدماتنا" : "Our Services"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {lang === "ar" ? "ماذا نقدم لك؟" : "What Do We Offer You?"}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service, idx) => {
                            const Icon = service.icon;
                            return (
                                <Card key={idx} className="p-6 border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 rounded-2xl bg-[#e0f5f7] flex items-center justify-center mb-4">
                                        <Icon className="h-6 w-6 text-[#1a7a8a]" />
                                    </div>
                                    <h4 className="font-bold text-[#0a2540] text-lg mb-2">
                                        {lang === "ar" ? service.title.ar : service.title.en}
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                        {lang === "ar" ? service.desc.ar : service.desc.en}
                                    </p>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* ============================================================ */}
                {/* 4. كيف نبدأ؟ */}
                {/* ============================================================ */}
                <section className="w-[85%] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540]">
                            {lang === "ar" ? "كيف نبدأ؟" : "How to Start?"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {lang === "ar" ? "ثلاث خطوات بسيطة" : "Three Simple Steps"}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="p-8 text-center border-0 shadow-sm hover:shadow-md transition-all">
                            <div className="w-16 h-16 rounded-full bg-[#1a7a8a] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">1</div>
                            <h4 className="font-bold text-[#0a2540] text-lg">
                                {lang === "ar" ? "أخبرنا بهدفك" : "Tell Us Your Goal"}
                            </h4>
                            <p className="text-gray-500 text-sm mt-2">
                                {lang === "ar"
                                    ? "شاركنا هدفك، ومدة الدراسة والمدينة المفضلة وميزانيتك تقريباً."
                                    : "Share your goal, duration of study, preferred city, and approximate budget."}
                            </p>
                        </Card>
                        <Card className="p-8 text-center border-0 shadow-sm hover:shadow-md transition-all">
                            <div className="w-16 h-16 rounded-full bg-[#1a7a8a] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">2</div>
                            <h4 className="font-bold text-[#0a2540] text-lg">
                                {lang === "ar" ? "نُرسل لك الخيارات" : "We Send You Options"}
                            </h4>
                            <p className="text-gray-500 text-sm mt-2">
                                {lang === "ar"
                                    ? "نعد لك خيارات مناسبة مع توصية واضحة ومبررات الاختيار بوضوح وشفافية تامة."
                                    : "We prepare suitable options with clear recommendations and justification for the choice with complete transparency."}
                            </p>
                        </Card>
                        <Card className="p-8 text-center border-0 shadow-sm hover:shadow-md transition-all">
                            <div className="w-16 h-16 rounded-full bg-[#1a7a8a] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">3</div>
                            <h4 className="font-bold text-[#0a2540] text-lg">
                                {lang === "ar" ? "نُكمل الإجراءات معاً" : "We Complete the Procedures Together"}
                            </h4>
                            <p className="text-gray-500 text-sm mt-2">
                                {lang === "ar"
                                    ? "نكمل معك إجراءات الحجز والترتيبات اللازمة حتى تجلس على مقعد الدراسة."
                                    : "We complete with you the booking procedures and necessary arrangements until you sit on the study seat."}
                            </p>
                        </Card>
                    </div>
                </section>

                {/* ============================================================ */}
                {/* 5. اختر مسارك المناسب */}
                {/* ============================================================ */}
                <section className="w-[85%] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540]">
                            {lang === "ar" ? "اختر مسارك المناسب" : "Choose Your Suitable Path"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {lang === "ar"
                                ? "اختر البرنامج التأسيسي أو اطلب ترشيحاً مباشراً حسب هدفك ومستواك."
                                : "Choose the foundation program or request a direct recommendation according to your goal and level."}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {paths.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <Card key={idx} className="p-6 border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                                    <div className="w-14 h-14 rounded-2xl bg-[#e0f5f7] flex items-center justify-center mb-4">
                                        <Icon className="h-7 w-7 text-[#1a7a8a]" />
                                    </div>
                                    <h4 className="font-bold text-[#0a2540] text-lg">
                                        {lang === "ar" ? item.title.ar : item.title.en}
                                    </h4>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {lang === "ar" ? item.desc.ar : item.desc.en}
                                    </p>
                                    <Button variant="link" className="text-[#1a7a8a] p-0 mt-3">
                                        {lang === "ar" ? "اعرف أكثر" : "Learn More"}
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* ============================================================ */}
                {/* 6. إقامة مريحة */}
                {/* ============================================================ */}
                <section className="w-[85%] mx-auto bg-linear-to-r from-[#0a2540] to-[#1a7a8a] rounded-2xl p-8 md:p-12 text-center">
                    <Home className="h-12 w-12 text-white/80 mx-auto mb-4" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        {lang === "ar" ? "إقامة مريحة تُكمل تجربتك" : "Comfortable Accommodation Complements Your Experience"}
                    </h2>
                    <p className="text-[#a3ced6] text-lg max-w-2xl mx-auto">
                        {lang === "ar"
                            ? "الإقامة جزء أساسي من نجاح التجربة، لذلك نعرض خيارات مدروسة وفق احتياجات وميزانيات."
                            : "Accommodation is an essential part of the success of the experience, so we offer studied options according to needs and budgets."}
                    </p>
                </section>

                {/* ============================================================ */}
                {/* 7. ابدأ اليوم */}
                {/* ============================================================ */}
                <section className=" w-[85%] mx-auto bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
                    <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3">
                        {lang === "ar" ? "ابدأ اليوم" : "Start Today"}
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
                        {lang === "ar"
                            ? "ابدأ بخطوة بسيطة واختر البرنامج الصحيح من أول مرة. احجز استشارات المحاسبة الآن، واترك لنا مهمة ترشيح المعهد أو المخيم الأنسب وترتيب جميع التفاصيل."
                            : "Start with a simple step and choose the right program from the first time. Book your accounting consultation now, and leave the task of recommending the most suitable institute or camp and arranging all the details to us."}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/contact">
                            <Button className="bg-[#0a2540] hover:bg-[#1a3a5c] text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                                {lang === "ar" ? "تواصل عبر الإنترنت" : "Contact Online"}
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="border-2 border-[#0a2540] text-[#0a2540] hover:bg-[#0a2540] hover:text-white px-8 py-6 text-lg rounded-xl transition-all">
                                {lang === "ar" ? "تواصل معنا" : "Contact Us"}
                            </Button>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}