// app/(pages)/(roles)/admin/landing/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  Eye,
  Globe,
  Mail,
  Settings,
  Plus,
  Trash2,
  Edit,
  Star,
  Users,
  BookOpen,
  Layout,
  TrendingUp,
  Shield,
  Trophy,
  GraduationCap,
  Play,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────
interface LandingSettings {
  _id?: string;
  // Hero Fields
  heroBadge: string;
  heroBadgeAr: string;
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  heroImageUrl: string;
  heroRating?: string;
  heroRatingLabel?: string;
  heroRatingLabelAr?: string;

  heroBottomText?: string;
  heroBottomTextAr?: string;
  heroBottomSmText?: string;
  heroBottomSmTextAr?: string;

  schoolName: string;
  schoolNameAr: string;

  // CTA
  ctaText: string;
  ctaTextAr: string;
  ctaUrl: string;
  secondaryCta: string;
  secondaryCtaAr: string;
  secondaryCtaUrl: string;

  // Trust Badges
  trustBadge1?: string;
  trustBadge1Ar?: string;
  trustBadge2?: string;
  trustBadge2Ar?: string;
  trustBadge2Year?: string;
  trustBadge3Value?: string;
  trustBadge3?: string;
  trustBadge3Ar?: string;

  // Floating Badges
  floatingBadge1?: string;
  floatingBadge1Ar?: string;
  floatingBadge2?: string;
  floatingBadge2Ar?: string;

  // Stats
  stats: Array<{ value: string; label: string; labelAr: string }>;
  themeMode: "dark" | "light";
  showTestimonials: boolean;
  showCourses: boolean;
  showGallery: boolean;

  // Contact
  contactEmail: string;
  contactPhone: string;
  whatsappLink: string;
  address: string;
  addressAr: string;

  // Footer
  footerDescription: string;
  footerDescriptionAr: string;

  // SEO
  seoTitle: string;
  seoTitleAr: string;
  seoDescription: string;
  seoDescriptionAr: string;
  updatedAt?: number;
}

// ─── Default Values ─────────────────────────────────────────────
const defaultSection = {
  isEnabled: true,
  slug: "",
  title: "",
  titleAr: "",
  subtitle: "",
  subtitleAr: "",
  body: "",
  bodyAr: "",
  ctaText: "",
  ctaTextAr: "",
  ctaUrl: "",
  mediaUrl: "",
  mediaType: "image" as const,
  features: [],
  cards: [],
  steps: [],
};

const defaultCourse = {
  isPublished: true,
  isFeatured: false,
  title: "",
  titleAr: "",
  summary: "",
  summaryAr: "",
  instructor: "",
  rating: 5,
  imageUrl: "",
  ctaUrl: "",
  ctaText: "سجل الآن",
  ctaTextAr: "سجل الآن",
  priceLabel: "",
  priceLabelAr: "",
};

const defaultTestimonial = {
  isPublished: true,
  name: "",
  nameAr: "",
  role: "",
  roleAr: "",
  text: "",
  textAr: "",
  rating: 5,
  avatarUrl: "",
};

const defaultVideo = {
  isPublished: true,
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  videoUrl: "",
  thumbnailUrl: "",
  embedType: "youtube" as const,
};

const defaultAnnouncement = {
  isPublished: true,
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  points: [] as string[],
  pointsAr: [] as string[],
  imageUrl: "",
};

// ─── Main Component ────────────────────────────────────────────
export default function AdminLandingPage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"section" | "course" | "testimonial" | "gallery" | "video" | "announcement" | "subscription">("section");

  // جلب بيانات Landing Page
  const landingData = useQuery(api.landing.landing.getLandingData);
  const sections = useQuery(api.landing.landing.getSections);
  const courses = useQuery(api.landing.landing.getCourses);
  const testimonials = useQuery(api.landing.landing.getTestimonials);
  const gallery = useQuery(api.landing.landing.getGallery);
  const videoTestimonials = useQuery(api.landing.landing.getVideoTestimonials);
  const announcements = useQuery(api.landing.landing.getAnnouncements);
  const subscriptions = useQuery(api.landing.landing.getSubscriptions);

  const updateSettings = useMutation(api.landing.landing.updateSettings);
  const createSection = useMutation(api.landing.landing.createSection);
  const updateSection = useMutation(api.landing.landing.updateSection);
  const deleteSection = useMutation(api.landing.landing.deleteSection);
  const createCourse = useMutation(api.landing.landing.createCourse);
  const updateCourse = useMutation(api.landing.landing.updateCourse);
  const deleteCourse = useMutation(api.landing.landing.deleteCourse);
  const createTestimonial = useMutation(api.landing.landing.createTestimonial);
  const updateTestimonial = useMutation(api.landing.landing.updateTestimonial);
  const deleteTestimonial = useMutation(api.landing.landing.deleteTestimonial);
  const createGalleryItem = useMutation(api.landing.landing.createGalleryItem);
  const updateGalleryItem = useMutation(api.landing.landing.updateGalleryItem);
  const deleteGalleryItem = useMutation(api.landing.landing.deleteGalleryItem);
  const createVideoTestimonial = useMutation(api.landing.landing.createVideoTestimonial);
  const updateVideoTestimonial = useMutation(api.landing.landing.updateVideoTestimonial);
  const deleteVideoTestimonial = useMutation(api.landing.landing.deleteVideoTestimonial);
  const createAnnouncement = useMutation(api.landing.landing.createAnnouncement);
  const updateAnnouncement = useMutation(api.landing.landing.updateAnnouncement);
  const deleteAnnouncement = useMutation(api.landing.landing.deleteAnnouncement);
  const createSubscription = useMutation(api.landing.landing.createSubscription);
  const updateSubscription = useMutation(api.landing.landing.updateSubscription);
  const deleteSubscription = useMutation(api.landing.landing.deleteSubscription);

  const [settings, setSettings] = useState<LandingSettings>({
    heroBadge: "The Future of Marine Education",
    heroBadgeAr: "مستقبل التعليم البحري",
    heroTitle: "Book Your Private Tutor for",
    heroTitleAr: "احجز معلمك الخصوصي لـ",
    heroSubtitle: "A comprehensive educational platform designed to empower students and teachers through advanced interactive tools.",
    heroSubtitleAr: "منصة تعليمية شاملة مصممة لتمكين الطلاب والمعلمين من خلال أدوات تفاعلية متقدمة.",
    heroBottomText: "Learn English in Britain with Confidence",
    heroBottomTextAr: "تعلم الإنجليزية في بريطانيا بخطوات واضحة",
    heroBottomSmText: "Steps Steps to Learn English in Britain",
    heroBottomSmTextAr: "خطوات تعلم الإنجليزية في بريطانيا",
    heroImageUrl: "/images/Hero1.png",
    schoolName: "Test Academy",
    schoolNameAr: "أكاديمية تجريبي",
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
    themeMode: "dark",
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
    seoTitle: "Test Academy - Premier Marine Education Platform",
    seoTitleAr: "أكاديمية تجريبي - منصة التعليم البحري الرائدة",
    seoDescription: "Marine Academy offers comprehensive marine education with live classes, expert teachers, and interactive learning tools.",
    seoDescriptionAr: "تقدم أكاديمية مارين تعليماً بحرياً شاملاً مع فصول مباشرة ومعلمين خبراء وأدوات تعلم تفاعلية.",
  });

  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  // ─── Dialog Handlers ──────────────────────────────────────────

  const openCreateDialog = (type: "section" | "course" | "testimonial" | "gallery" | "video" | "announcement" | "subscription") => {
    setDialogType(type);
    let defaults = {};
    switch (type) {
      case "section":
        defaults = { ...defaultSection };
        break;
      case "announcement":
        defaults = { ...defaultAnnouncement };
        break;
      case "course":
        defaults = { ...defaultCourse };
        break;
      case "testimonial":
        defaults = { ...defaultTestimonial };
        break;
      case "gallery":
        defaults = {
          isPublished: true,
          title: "",
          titleAr: "",
          caption: "",
          captionAr: "",
          category: "",
          imageUrl: ""
        };
        break;
      case "subscription": // ✅ أضف هذا
        defaults = {
          isPublished: true,
          isPopular: false,
          title: "",
          titleAr: "",
          description: "",
          descriptionAr: "",
          type: "monthly",
          price: 0,
          priceAr: "",
          sessionsCount: 0,
          grade: "primary",
          features: [],
          featuresAr: [],
        };
        break;
      case "video":
        defaults = { ...defaultVideo };
        break;
    }
    setEditingItem(defaults);
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: "section" | "course" | "testimonial" | "gallery" | "video" | "announcement", item: any) => {
    setDialogType(type);
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };

  // ─── Save Settings ──────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      toast.success("تم حفظ الإعدادات بنجاح!");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── CRUD Handlers ─────────────────────────────────────────────

  const handleSaveItem = async () => {
    if (!editingItem) return;

    const isEditing = !!editingItem._id;

    try {
      if (isEditing) {
        const { _id, _creationTime, createdAt, updatedAt, ...cleanData } = editingItem;

        switch (dialogType) {
          case "section":
            await updateSection({ sectionId: _id as any, ...cleanData });
            break;
          case "course":
            await updateCourse({ courseId: _id as any, ...cleanData });
            break;
          case "testimonial":
            await updateTestimonial({ testimonialId: _id as any, ...cleanData });
            break;
          case "gallery":
            await updateGalleryItem({ itemId: _id as any, ...cleanData });
            break;
          case "video":
            await updateVideoTestimonial({ videoId: _id as any, ...cleanData });
            break;
          case "announcement": // ✅ أضف هذا
            await updateAnnouncement({ announcementId: _id as any, ...cleanData });
            break;
          case "subscription": // ✅ أضف هذا
            await updateSubscription({ subscriptionId: _id as any, ...cleanData });
            break;
        }
        toast.success("✅ تم التحديث بنجاح");
      } else {
        switch (dialogType) {
          case "section":
            await createSection({ ...editingItem, displayOrder: sections?.length || 0 });
            break;
          case "course":
            await createCourse({ ...editingItem, displayOrder: courses?.length || 0 });
            break;
          case "testimonial":
            await createTestimonial({ ...editingItem, displayOrder: testimonials?.length || 0 });
            break;
          case "gallery":
            await createGalleryItem({ ...editingItem, displayOrder: gallery?.length || 0 });
            break;
          case "video":
            await createVideoTestimonial({ ...editingItem, displayOrder: videoTestimonials?.length || 0 });
            break;
          case "announcement": // ✅ أضف هذا
            await createAnnouncement({ ...editingItem, displayOrder: announcements?.length || 0 });
            break;
          case "subscription": // ✅ أضف هذا
            await createSubscription({ ...editingItem, displayOrder: subscriptions?.length || 0 });
            break;
        }
        toast.success("✅ تم الإضافة بنجاح");
      }
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;
    try {
      switch (type) {
        case "section":
          await deleteSection({ sectionId: id as any });
          break;
        case "course":
          await deleteCourse({ courseId: id as any });
          break;
        case "testimonial":
          await deleteTestimonial({ testimonialId: id as any });
          break;
        case "gallery":
          await deleteGalleryItem({ itemId: id as any });
          break;
        case "video":
          await deleteVideoTestimonial({ videoId: id as any });
          break;
        case "announcement": // ✅ أضف هذا
          await deleteAnnouncement({ announcementId: id as any });
          break;
        case "subscription": // ✅ أضف هذا
          await deleteSubscription({ subscriptionId: id as any });
          break;
      }
      toast.success("✅ تم الحذف بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  // ─── Render Functions ─────────────────────────────────────────

  const renderHeroTab = () => (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#1a7a8a]" />
            محتوى الهيرو
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating Badge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>تقييم الطالب</Label>
              <Input
                value={settings.heroRating || "4.8"}
                onChange={(e) => setSettings({ ...settings, heroRating: e.target.value })}
                placeholder="4.8"
              />
            </div>
            <div className="space-y-2">
              <Label>نص التقييم (عربي)</Label>
              <Input
                value={settings.heroRatingLabelAr || "نسبة رضا الطالب"}
                onChange={(e) => setSettings({ ...settings, heroRatingLabelAr: e.target.value })}
                placeholder="نسبة رضا الطالب"
              />
            </div>
            <div className="space-y-2">
              <Label>نص التقييم (إنجليزي)</Label>
              <Input
                value={settings.heroRatingLabel || "Student Satisfaction"}
                onChange={(e) => setSettings({ ...settings, heroRatingLabel: e.target.value })}
                placeholder="Student Satisfaction"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الشارة (عربي)</Label>
              <Input
                value={settings.heroBadgeAr || "مستقبل التعليم البحري"}
                onChange={(e) => setSettings({ ...settings, heroBadgeAr: e.target.value })}
                placeholder="مثال: مستقبل التعليم البحري"
              />
            </div>
            <div className="space-y-2">
              <Label>الشارة (إنجليزي)</Label>
              <Input
                value={settings.heroBadge || "The Future of Marine Education"}
                onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                placeholder="Example: The Future of Marine Education"
              />
            </div>
          </div>

          {/* Main Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>العنوان الرئيسي (عربي)</Label>
              <Textarea
                value={settings.heroTitleAr || "احجز معلمك الخصوصي لـ"}
                onChange={(e) => setSettings({ ...settings, heroTitleAr: e.target.value })}
                placeholder="احجز معلمك الخصوصي لـ"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان الرئيسي (إنجليزي)</Label>
              <Textarea
                value={settings.heroTitle || "Book Your Private Tutor for"}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                placeholder="Book Your Private Tutor for"
                rows={2}
              />
            </div>
          </div>

          {/* Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>النص الفرعي (عربي)</Label>
              <Textarea
                value={settings.heroSubtitleAr || "يفهمك المادة ويضمنك العالمة الكاملة"}
                onChange={(e) => setSettings({ ...settings, heroSubtitleAr: e.target.value })}
                placeholder="يفهمك المادة ويضمنك العالمة الكاملة"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>النص الفرعي (إنجليزي)</Label>
              <Textarea
                value={settings.heroSubtitle || "Understands the subject and guarantees you the full mark"}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                placeholder="Understands the subject and guarantees you the full mark"
                rows={2}
              />
            </div>
          </div>

          {/* Hero Image */}
          <div className="space-y-2">
            <Label>صورة الهيرو (رابط)</Label>
            <Input
              value={settings.heroImageUrl || "/images/hero.png"}
              onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
              placeholder="/images/hero.png"
            />
            {settings.heroImageUrl && (
              <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border border-[#c0c8c9]">
                <img
                  src={settings.heroImageUrl}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* ✅ Hero Bottom Text - النص الموجود تحت الصورة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>نص تحت الصورة (عربي)</Label>
              <Textarea
                value={settings.heroBottomTextAr || "تعلم الإنجليزية في بريطانيا بخطوات واضحة"}
                onChange={(e) => setSettings({ ...settings, heroBottomTextAr: e.target.value })}
                placeholder="نص تحت الصورة بالعربية"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>نص تحت الصورة (إنجليزي)</Label>
              <Textarea
                value={settings.heroBottomText || "Learn English in Britain with Confidence"}
                onChange={(e) => setSettings({ ...settings, heroBottomText: e.target.value })}
                placeholder="Text under image in English"
                rows={1}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>نص الصغير تحت الصورة (عربي)</Label>
              <Textarea
                value={settings.heroBottomSmTextAr || "تعلم الإنجليزية في بريطانيا بخطوات واضحة"}
                onChange={(e) => setSettings({ ...settings, heroBottomSmTextAr: e.target.value })}
                placeholder="نص تحت الصورة بالعربية"
                rows={1}
              />
            </div>
            <div className="space-y-2">
              <Label>نص الصغير تحت الصورة (إنجليزي)</Label>
              <Textarea
                value={settings.heroBottomSmText || "Learn English in Britain with Confidence"}
                onChange={(e) => setSettings({ ...settings, heroBottomSmText: e.target.value })}
                placeholder="Text under image in English"
                rows={1}
              />
            </div>
          </div>

          {/* Primary CTA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>زر الدعوة الأساسي (عربي)</Label>
              <Input
                value={settings.ctaTextAr || "إعرف أكثر عن باقات الدروس"}
                onChange={(e) => setSettings({ ...settings, ctaTextAr: e.target.value })}
                placeholder="إعرف أكثر عن باقات الدروس"
              />
            </div>
            <div className="space-y-2">
              <Label>زر الدعوة الأساسي (إنجليزي)</Label>
              <Input
                value={settings.ctaText || "Learn More About Lesson Packages"}
                onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
                placeholder="Learn More About Lesson Packages"
              />
            </div>
            <div className="space-y-2">
              <Label>الرابط</Label>
              <Input
                value={settings.ctaUrl || "/onboarding"}
                onChange={(e) => setSettings({ ...settings, ctaUrl: e.target.value })}
                placeholder="/onboarding"
              />
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>زر ثانوي (عربي)</Label>
              <Input
                value={settings.secondaryCtaAr || "تواصل معنا"}
                onChange={(e) => setSettings({ ...settings, secondaryCtaAr: e.target.value })}
                placeholder="تواصل معنا"
              />
            </div>
            <div className="space-y-2">
              <Label>زر ثانوي (إنجليزي)</Label>
              <Input
                value={settings.secondaryCta || "Contact Us"}
                onChange={(e) => setSettings({ ...settings, secondaryCta: e.target.value })}
                placeholder="Contact Us"
              />
            </div>
            <div className="space-y-2">
              <Label>الرابط</Label>
              <Input
                value={settings.secondaryCtaUrl || "#"}
                onChange={(e) => setSettings({ ...settings, secondaryCtaUrl: e.target.value })}
                placeholder="#"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#1a7a8a]" />
            شهادات الثقة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Badge 1 - Accreditation */}
            <div className="p-4 border border-[#c0c8c9] rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[#1a7a8a]" />
                </div>
                <Label className="text-sm font-semibold">الجهة المعتمدة</Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={settings.trustBadge1Ar || "المركز الوطني للتعليم الإلكتروني"}
                  onChange={(e) => setSettings({ ...settings, trustBadge1Ar: e.target.value })}
                  placeholder="المركز الوطني للتعليم الإلكتروني"
                />
                <Input
                  value={settings.trustBadge1 || "National eLearning Center"}
                  onChange={(e) => setSettings({ ...settings, trustBadge1: e.target.value })}
                  placeholder="National eLearning Center"
                />
              </div>
            </div>

            {/* Badge 2 - Most Downloaded */}
            <div className="p-4 border border-[#c0c8c9] rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-[#1a7a8a]" />
                </div>
                <Label className="text-sm font-semibold">الإنجاز</Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={settings.trustBadge2Ar || "المدرسة الأكثر تحميلاً"}
                  onChange={(e) => setSettings({ ...settings, trustBadge2Ar: e.target.value })}
                  placeholder="المدرسة الأكثر تحميلاً"
                />
                <Input
                  value={settings.trustBadge2 || "Most Downloaded School"}
                  onChange={(e) => setSettings({ ...settings, trustBadge2: e.target.value })}
                  placeholder="Most Downloaded School"
                />
                <Input
                  value={settings.trustBadge2Year || "2023/2024"}
                  onChange={(e) => setSettings({ ...settings, trustBadge2Year: e.target.value })}
                  placeholder="2023/2024"
                />
              </div>
            </div>

            {/* Badge 3 - Academic Levels */}
            <div className="p-4 border border-[#c0c8c9] rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-[#1a7a8a]" />
                </div>
                <Label className="text-sm font-semibold">المراحل الدراسية</Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={settings.trustBadge3Value || "14+"}
                  onChange={(e) => setSettings({ ...settings, trustBadge3Value: e.target.value })}
                  placeholder="14+"
                />
                <Input
                  value={settings.trustBadge3Ar || "لجميع المراحل الدراسية"}
                  onChange={(e) => setSettings({ ...settings, trustBadge3Ar: e.target.value })}
                  placeholder="لجميع المراحل الدراسية"
                />
                <Input
                  value={settings.trustBadge3 || "For All Academic Levels"}
                  onChange={(e) => setSettings({ ...settings, trustBadge3: e.target.value })}
                  placeholder="For All Academic Levels"
                />
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border border-[#c0c8c9] rounded-lg">
              <Label className="text-sm font-semibold">بطاقة عائمة - المنهاج</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs">العنوان</Label>
                  <Input
                    value={settings.floatingBadge1 || "IB/IGCSE"}
                    onChange={(e) => setSettings({ ...settings, floatingBadge1: e.target.value })}
                    placeholder="IB/IGCSE"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">الوصف</Label>
                  <Input
                    value={settings.floatingBadge1Ar || "المنهاج الوطني"}
                    onChange={(e) => setSettings({ ...settings, floatingBadge1Ar: e.target.value })}
                    placeholder="المنهاج الوطني"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-[#c0c8c9] rounded-lg">
              <Label className="text-sm font-semibold">بطاقة عائمة - فصول مباشرة</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs">العنوان</Label>
                  <Input
                    value={settings.floatingBadge2 || "Live Classes"}
                    onChange={(e) => setSettings({ ...settings, floatingBadge2: e.target.value })}
                    placeholder="Live Classes"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">الوصف</Label>
                  <Input
                    value={settings.floatingBadge2Ar || "فصول مباشرة"}
                    onChange={(e) => setSettings({ ...settings, floatingBadge2Ar: e.target.value })}
                    placeholder="فصول مباشرة"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1a7a8a]" />
            الإحصائيات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.stats.map((stat, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-end border-b pb-4">
                <div className="space-y-1">
                  <Label className="text-xs">القيمة</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => {
                      const newStats = [...settings.stats];
                      newStats[index].value = e.target.value;
                      setSettings({ ...settings, stats: newStats });
                    }}
                    placeholder="5000+"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">التسمية (عربي)</Label>
                  <Input
                    value={stat.labelAr}
                    onChange={(e) => {
                      const newStats = [...settings.stats];
                      newStats[index].labelAr = e.target.value;
                      setSettings({ ...settings, stats: newStats });
                    }}
                    placeholder="طالب نشط"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">التسمية (إنجليزي)</Label>
                  <Input
                    value={stat.label}
                    onChange={(e) => {
                      const newStats = [...settings.stats];
                      newStats[index].label = e.target.value;
                      setSettings({ ...settings, stats: newStats });
                    }}
                    placeholder="Active Students"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSettings({
                  ...settings,
                  stats: [...settings.stats, { value: "", label: "", labelAr: "" }],
                });
              }}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة إحصائية
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );

  const renderSectionsTab = () => (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الأقسام</h3>
        <Button
          onClick={() => openCreateDialog("section")}
          className="bg-[#001f24] hover:bg-[#03363d] text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {!sections || sections.length === 0 ? (
        <Card className="p-8 text-center">
          <Layout className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">لا توجد أقسام</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section: any) => (
            <Card key={section._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{section.title || section.titleAr}</h4>
                    <p className="text-sm text-gray-500">{section.slug}</p>
                    <Badge className={section.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {section.isEnabled ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog("section", section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteItem("section", section._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{section.body || section.bodyAr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );


  const renderAnnouncementsTab = () => {
    const announcementsData = announcements;

    if (announcementsData === undefined) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
        </div>
      );
    }

    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">الإعلانات</h3>
          <Button
            onClick={() => {
              setDialogType("announcement");
              setEditingItem({
                isPublished: true,
                title: "",
                titleAr: "",
                description: "",
                descriptionAr: "",
                points: [],
                pointsAr: [],
                imageUrl: "",
              });
              setIsDialogOpen(true);
            }}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة إعلان
          </Button>
        </div>

        {!announcements || announcements.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">لا توجد إعلانات</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((item: any) => (
              <Card key={item._id} className="overflow-hidden">
                <div className="relative h-48 w-full  bg-gray-100">
                  <img
                    src={item.imageUrl || "/images/announcement-placeholder.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/announcement-placeholder.jpg";
                    }}
                  />
                  <Badge className={`absolute top-3 right-3 ${item.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {item.isPublished ? "منشور" : "غير منشور"}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#001f24] line-clamp-1">
                        {item.title || item.titleAr}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {item.description || item.descriptionAr}
                      </p>
                      {item.points && item.points.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.points.slice(0, 2).map((point: string, idx: number) => (
                            <p key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                              <span className="text-[#1a7a8a]">•</span>
                              {point.length > 30 ? point.slice(0, 30) + "..." : point}
                            </p>
                          ))}
                          {item.points.length > 2 && (
                            <p className="text-xs text-[#1a7a8a]">+{item.points.length - 2} نقاط أخرى</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 mr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDialogType("announcement");
                          setEditingItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (confirm("هل أنت متأكد من حذف هذا الإعلان؟")) {
                            await deleteAnnouncement({ announcementId: item._id });
                            toast.success("تم حذف الإعلان بنجاح");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };


  const renderSubscriptionsTab = () => {


    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">باقات الاشتراك</h3>
          <Button
            onClick={() => {
              setDialogType("subscription");
              setEditingItem({
                isPublished: true,
                isPopular: false,
                title: "",
                titleAr: "",
                description: "",
                descriptionAr: "",
                type: "monthly",
                price: 0,
                priceAr: "",
                sessionsCount: 0,
                grade: "primary",
                features: [],
                featuresAr: [],
              });
              setIsDialogOpen(true);
            }}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة باقة
          </Button>
        </div>

        {!subscriptions || subscriptions.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">لا توجد باقات اشتراك</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((item: any) => (
              <Card key={item._id} className={`overflow-hidden ${item.isPopular ? 'border-[#1a7a8a] border-2' : ''}`}>
                {item.isPopular && (
                  <div className="bg-[#1a7a8a] text-white text-center text-xs font-semibold py-1">
                    الأكثر طلباً
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#001f24]">
                        {item.title || item.titleAr}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {item.description || item.descriptionAr}
                      </p>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-[#1a7a8a]">{item.price}</span>
                        <span className="text-sm text-gray-500 mr-1">ر.س</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.sessionsCount} حصة • {item.grade === "primary" ? "ابتدائي" : item.grade === "middle" ? "متوسط" : "ثانوي"}
                      </div>
                      {item.features && item.features.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.features.slice(0, 2).map((feature: string, idx: number) => (
                            <p key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                              <span className="text-[#1a7a8a]">•</span>
                              {feature.length > 30 ? feature.slice(0, 30) + "..." : feature}
                            </p>
                          ))}
                          {item.features.length > 2 && (
                            <p className="text-xs text-[#1a7a8a]">+{item.features.length - 2} مميزات أخرى</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 mr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDialogType("subscription");
                          setEditingItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (confirm("هل أنت متأكد من حذف هذه الباقة؟")) {
                            await deleteSubscription({ subscriptionId: item._id });
                            toast.success("تم حذف الباقة بنجاح");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={item.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {item.isPublished ? "منشور" : "غير منشور"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };


const renderVideoTestimonialsTab = () => {
  

  const getEmbedUrl = (videoUrl: string, embedType: string) => {
    if (embedType === "youtube") {
      // استخراج ID الفيديو من رابط YouTube
      const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
      return videoUrl;
    }
    if (embedType === "vimeo") {
      const match = videoUrl.match(/vimeo\.com\/(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
      return videoUrl;
    }
    return videoUrl;
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">فيديوهات الشهادات</h3>
        <Button
          onClick={() => openCreateDialog("video")}
          className="bg-[#001f24] hover:bg-[#03363d] text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة فيديو
        </Button>
      </div>

      {!videoTestimonials || videoTestimonials.length === 0 ? (
        <Card className="p-8 text-center">
          <Play className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">لا توجد فيديوهات شهادات</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoTestimonials.map((video: any) => {
            const isPlaying = playingVideo === video._id;
            const embedUrl = getEmbedUrl(video.videoUrl, video.embedType || "youtube");

            return (
              <Card key={video._id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Video Player / Thumbnail */}
                  <div 
                    className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-gray-100 cursor-pointer group"
                    onClick={() => setPlayingVideo(isPlaying ? null : video._id)}
                  >
                    {isPlaying ? (
                      // ✅ تشغيل الفيديو
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.title || video.titleAr}
                      />
                    ) : (
                      // ✅ عرض الصورة المصغرة
                      <>
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || video.titleAr}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          // ✅ صورة افتراضية إذا لم توجد صورة مصغرة
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#1a7a8a]/20 to-[#001f24]/20">
                            <Play className="h-16 w-16 text-[#1a7a8a]/40" />
                          </div>
                        )}
                        {/* ✅ زر التشغيل overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all duration-300">
                          <div className="w-14 h-14 bg-[#1a7a8a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Play className="h-6 w-6 text-white mr-1" />
                          </div>
                        </div>
                        {/* ✅ شارة النوع */}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/70 text-white text-xs">
                            {video.embedType === "youtube" ? "YouTube" : 
                             video.embedType === "vimeo" ? "Vimeo" : "فيديو"}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ✅ معلومات الفيديو */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {video.title || video.titleAr}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {video.description || video.descriptionAr}
                      </p>
                    </div>
                    <div className="flex gap-1 mr-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog("video", video)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteItem("video", video._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ✅ حالة النشر */}
                  <div className="mt-2 flex items-center gap-3">
                    <Badge className={video.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {video.isPublished ? "منشور" : "غير منشور"}
                    </Badge>
                    {isPlaying && (
                      <Badge variant="outline" className="text-[#1a7a8a] border-[#1a7a8a]">
                        <Play className="h-3 w-3 ml-1" />
                        يعمل الآن
                      </Badge>
                    )}
                  </div>

                  {/* ✅ زر إغلاق الفيديو */}
                  {isPlaying && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideo(null);
                      }}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full"
                    >
                      إغلاق الفيديو
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

  const renderCoursesTab = () => (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الدورات</h3>
        <Button
          onClick={() => openCreateDialog("course")}
          className="bg-[#001f24] hover:bg-[#03363d] text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة دورة
        </Button>
      </div>

      {!courses || courses.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">لا توجد دورات</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Card key={course._id}>
              <CardContent className="p-4">
                {course.imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{course.title}</h4>
                    <p className="text-sm text-gray-500">{course.instructor}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{course.rating || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog("course", course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteItem("course", course._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge className={course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {course.isPublished ? "منشور" : "غير منشور"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTestimonialsTab = () => (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">التوصيات</h3>
        <Button
          onClick={() => openCreateDialog("testimonial")}
          className="bg-[#001f24] hover:bg-[#03363d] text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة توصية
        </Button>
      </div>

      {!testimonials || testimonials.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">لا توجد توصيات</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((item: any) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: item.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{item.text}</p>
                    <p className="font-semibold mt-2">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.role}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog("testimonial", item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteItem("testimonial", item._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge className={item.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {item.isPublished ? "منشور" : "غير منشور"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Dialog ──────────────────────────────────────────────────

  const renderDialog = () => {
    if (!editingItem) return null;

    const isEditing = !!editingItem._id;
    let title = "";
    let fields = null;

    switch (dialogType) {
      case "section":
        title = isEditing ? "تعديل القسم" : "إضافة قسم جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المعرف (slug)</Label>
              <Input
                value={editingItem.slug || ""}
                onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                placeholder="about-us"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المحتوى (عربي)</Label>
                <Textarea
                  value={editingItem.bodyAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, bodyAr: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>المحتوى (إنجليزي)</Label>
                <Textarea
                  value={editingItem.body || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, body: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isEnabled ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isEnabled: e.target.checked })}
                />
                مفعل
              </Label>
            </div>
          </div>
        );
        break;

      case "announcement":
        title = isEditing ? "تعديل الإعلان" : "إضافة إعلان جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.descriptionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>النقاط (عربي) - كل نقطة في سطر جديد</Label>
              <Textarea
                value={editingItem.pointsAr?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  pointsAr: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="نقطة 1\nنقطة 2\nنقطة 3"
              />
            </div>

            <div className="space-y-2">
              <Label>النقاط (إنجليزي) - كل نقطة في سطر جديد</Label>
              <Textarea
                value={editingItem.points?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  points: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="Point 1\nPoint 2\nPoint 3"
              />
            </div>

            <div className="space-y-2">
              <Label>رابط الصورة</Label>
              <Input
                value={editingItem.imageUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {editingItem.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.imageUrl}
                    alt="Announcement"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      case "subscription":
        title = isEditing ? "تعديل باقة الاشتراك" : "إضافة باقة اشتراك جديدة";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.descriptionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (ر.س)</Label>
                <Input
                  type="number"
                  value={editingItem.price || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>عدد الحصص</Label>
                <Input
                  type="number"
                  value={editingItem.sessionsCount || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, sessionsCount: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المرحلة الدراسية</Label>
                <select
                  value={editingItem.grade || "primary"}
                  onChange={(e) => setEditingItem({ ...editingItem, grade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                >
                  <option value="primary">ابتدائي</option>
                  <option value="middle">متوسط</option>
                  <option value="high">ثانوي</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>نوع الباقة</Label>
                <select
                  value={editingItem.type || "monthly"}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                >
                  <option value="single">حصة واحدة</option>
                  <option value="monthly">شهري</option>
                  <option value="quarterly">فصلي</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>المميزات (عربي) - كل مميزة في سطر جديد</Label>
              <Textarea
                value={editingItem.featuresAr?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  featuresAr: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="مميزة 1\nمميزة 2\nمميزة 3"
              />
            </div>

            <div className="space-y-2">
              <Label>المميزات (إنجليزي) - كل مميزة في سطر جديد</Label>
              <Textarea
                value={editingItem.features?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  features: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="Feature 1\nFeature 2\nFeature 3"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPopular ?? false}
                  onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                />
                الأكثر طلباً
              </Label>
            </div>
          </div>
        );
        break;

      case "video":
        title = isEditing ? "تعديل فيديو الشهادة" : "إضافة فيديو شهادة جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.descriptionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رابط الفيديو</Label>
              <Input
                value={editingItem.videoUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... أو رابط الملف"
              />
            </div>
            <div className="space-y-2">
              <Label>صورة الغلاف (اختياري)</Label>
              <Input
                value={editingItem.thumbnailUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع التضمين</Label>
              <select
                value={editingItem.embedType || "youtube"}
                onChange={(e) => setEditingItem({ ...editingItem, embedType: e.target.value as "youtube" | "vimeo" | "file" })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="file">ملف فيديو</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      case "course":
        title = isEditing ? "تعديل الدورة" : "إضافة دورة جديدة";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الملخص (عربي)</Label>
                <Textarea
                  value={editingItem.summaryAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, summaryAr: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>الملخص (إنجليزي)</Label>
                <Textarea
                  value={editingItem.summary || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدرس</Label>
                <Input
                  value={editingItem.instructor || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, instructor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>التقييم (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={editingItem.rating || 5}
                  onChange={(e) => setEditingItem({ ...editingItem, rating: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة الدورة (رابط)</Label>
              <Input
                value={editingItem.imageUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                placeholder="/images/course.jpg"
              />
              {editingItem.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.imageUrl}
                    alt="Course"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>رابط الدورة</Label>
              <Input
                value={editingItem.ctaUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, ctaUrl: e.target.value })}
                placeholder="/courses/1"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isFeatured ?? false}
                  onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                />
                مميز
              </Label>
            </div>
          </div>
        );
        break;

      case "testimonial":
        title = isEditing ? "تعديل التوصية" : "إضافة توصية جديدة";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={editingItem.nameAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={editingItem.name || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المنصب (عربي)</Label>
                <Input
                  value={editingItem.roleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, roleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>المنصب (إنجليزي)</Label>
                <Input
                  value={editingItem.role || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النص (عربي)</Label>
                <Textarea
                  value={editingItem.textAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, textAr: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>النص (إنجليزي)</Label>
                <Textarea
                  value={editingItem.text || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>التقييم (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={editingItem.rating || 5}
                onChange={(e) => setEditingItem({ ...editingItem, rating: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      case "gallery":
        title = isEditing ? "تعديل عنصر المعرض" : "إضافة عنصر معرض جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.captionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, captionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.caption || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Input
                value={editingItem.category || ""}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                placeholder="Workshop, Revision, Community"
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الصورة</Label>
              <Input
                value={editingItem.imageUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                placeholder="/images/gallery.jpg"
              />
              {editingItem.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.imageUrl}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {fields}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setEditingItem(null);
            }}>
              إلغاء
            </Button>
            <Button
              onClick={handleSaveItem}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isEditing ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────

  if (landingData === undefined || sections === undefined || courses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24] flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#1a7a8a]" />
            إدارة Landing Page
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            التحكم في محتوى الصفحة الرئيسية للتطبيق
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              معاينة
            </Button>
          </Link>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <TabsTrigger value="hero">
            <Globe className="h-4 w-4 ml-2" />
            الهيرو
          </TabsTrigger>
          {/* <TabsTrigger value="sections">
            <Layout className="h-4 w-4 ml-2" />
            الأقسام
          </TabsTrigger> */}
          <TabsTrigger value="announcements">
            <Megaphone className="h-4 w-4 ml-2" />
            الإعلانات
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <TrendingUp className="h-4 w-4 ml-2" />
            الاشتراكات
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 ml-2" />
            الدورات
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Play className="h-4 w-4 ml-2" />
            الفيديوهات
          </TabsTrigger>
          <TabsTrigger value="testimonials">
            <Star className="h-4 w-4 ml-2" />
            التوصيات
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 ml-2" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-4">
          {renderHeroTab()}
        </TabsContent>

        <TabsContent value="sections" className="mt-4">
          {renderSectionsTab()}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          {renderAnnouncementsTab()}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4">
          {renderSubscriptionsTab()}
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          {renderCoursesTab()}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {renderVideoTestimonialsTab()}
        </TabsContent>

        <TabsContent value="testimonials" className="mt-4">
          {renderTestimonialsTab()}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المدرسة (عربي)</Label>
                    <Input
                      value={settings.schoolNameAr || "أكاديمية مارين"}
                      onChange={(e) => setSettings({ ...settings, schoolNameAr: e.target.value })}
                      placeholder="أكاديمية مارين"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المدرسة (إنجليزي)</Label>
                    <Input
                      value={settings.schoolName || "Marine Academy"}
                      onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                      placeholder="Marine Academy"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>وضع السمة</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="dark"
                        checked={settings.themeMode === "dark"}
                        onChange={() => setSettings({ ...settings, themeMode: "dark" })}
                      />
                      داكن
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="light"
                        checked={settings.themeMode === "light"}
                        onChange={() => setSettings({ ...settings, themeMode: "light" })}
                      />
                      فاتح
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>رابط واتساب</Label>
                  <Input
                    value={settings.whatsappLink}
                    onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>العنوان (عربي)</Label>
                    <Input
                      value={settings.addressAr}
                      onChange={(e) => setSettings({ ...settings, addressAr: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان (إنجليزي)</Label>
                    <Input
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وصف التذييل (عربي)</Label>
                    <Textarea
                      value={settings.footerDescriptionAr}
                      onChange={(e) => setSettings({ ...settings, footerDescriptionAr: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وصف التذييل (إنجليزي)</Label>
                    <Textarea
                      value={settings.footerDescription}
                      onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>إظهار الأقسام</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showCourses}
                        onChange={(e) => setSettings({ ...settings, showCourses: e.target.checked })}
                      />
                      الدورات
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showTestimonials}
                        onChange={(e) => setSettings({ ...settings, showTestimonials: e.target.checked })}
                      />
                      التوصيات
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      {renderDialog()}
    </div>
  );
}