"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import { 
  MdOutlinePending, 
  MdOutlineEmail, 
  MdInfoOutline,
  MdCheckCircle,
  MdHourglassEmpty,
} from "react-icons/md";
import { FaUser, FaEnvelope, FaUserTag, FaPhone } from "react-icons/fa";
import { HiOutlineClock } from "react-icons/hi";
import { Loader2, Bell, UserCheck, Shield, Mail, Phone, User, Clock, LogOut, Users } from "lucide-react";

export default function PendingApprovalPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser) {
      // ✅ إذا تمت الموافقة → روح للوحة التحكم حسب الدور
      if (currentUser.status === "active" || currentUser.status === "approved") {
        const dashboardMap: Record<string, string> = {
          admin: "/admin",
          teacher: "/teacher",
          student: "/student",
          parent: "/parent",
        };
        router.push(dashboardMap[currentUser.role] || "/dashboard");
        return;
      }
      
      // ✅ إذا تم الرفض → روح صفحة الرفض
      if (currentUser.status === "rejected") {
        router.push("/account-rejected");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // ✅ شاشة التحميل
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ✅ تحديد اسم الدور بالعربية
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      student: "طالب",
      teacher: "معلم",
      parent: "ولي أمر",
      admin: "مشرف",
    };
    return roles[role] || role;
  };

  // ✅ تحديد أيقونة الدور
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student": return <User className="h-4 w-4" />;
      case "teacher": return <UserCheck className="h-4 w-4" />;
      case "parent": return <Users className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7fafa] p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-2xl border border-[#c0c8c9] shadow-sm overflow-hidden">
          {/* الهيدر - تدرج بحري */}
          <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-4 backdrop-blur">
              <MdOutlinePending className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              في انتظار الموافقة
            </h1>
            <p className="text-[#a3ced6] text-sm">
              تم استلام طلب التسجيل الخاص بك
            </p>
          </div>

          {/* المحتوى */}
          <div className="p-6">
            {/* رسالة إعلامية */}
            <div className="bg-[#e0f5f7] border border-[#1a7a8a]/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <MdInfoOutline className="h-5 w-5 text-[#1a7a8a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#001f24] text-sm mb-1">
                    ما الخطوة التالية؟
                  </p>
                  <p className="text-sm text-[#001f24]/80 leading-relaxed">
                    سيقوم المشرف بمراجعة بياناتك وإرسال إشعار إلكتروني لك عند الموافقة على حسابك. 
                    تستغرق هذه العملية عادةً أقل من 24 ساعة.
                  </p>
                </div>
              </div>
            </div>

            {/* بطاقة معلومات المستخدم */}
            <div className="bg-[#f7fafa] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-[#1a7a8a]" />
                <h3 className="font-semibold text-[#001f24] text-sm">
                  معلوماتك
                </h3>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    الاسم:
                  </dt>
                  <dd className="text-[#001f24] font-medium">{currentUser.name}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    البريد الإلكتروني:
                  </dt>
                  <dd className="text-[#001f24] font-medium">{currentUser.email}</dd>
                </div>
                {currentUser.phoneNumber && (
                  <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
                      رقم الهاتف:
                    </dt>
                    <dd className="text-[#001f24] font-medium">{currentUser.phoneNumber}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                  <dt className="flex items-center gap-2 text-gray-500">
                    {getRoleIcon(currentUser.role)}
                    الدور:
                  </dt>
                  <dd className="text-[#001f24] font-medium">
                    {getRoleLabel(currentUser.role)}
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    الحالة:
                  </dt>
                  <dd>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      في انتظار المراجعة
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* ✅ حالة الطلب - بطاقات إضافية */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
                  <MdHourglassEmpty className="h-4 w-4" />
                  <span className="text-xs font-semibold">قيد المراجعة</span>
                </div>
                <p className="text-xs text-blue-500">جارٍ مراجعة طلبك</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-semibold">إشعار</span>
                </div>
                <p className="text-xs text-green-500">سيصلك إشعار عند الموافقة</p>
              </div>
            </div>

            {/* ملاحظة */}
            <p className="text-xs text-gray-400 text-center mb-6">
              يمكنك العودة إلى هذه الصفحة أو متابعة بريدك الإلكتروني لمعرفة التحديثات.
            </p>

            {/* أزرار الإجراءات */}
            <div className="space-y-2">
              <SignOutButton>
                <button className="w-full bg-[#001f24] hover:bg-[#03363d] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>

        {/* تذييل */}
        <p className="text-center text-xs text-gray-400 mt-4">
          لديك حساب؟ <span className="text-[#1a7a8a] font-medium">في انتظار الموافقة</span>
        </p>
      </div>
    </div>
  );
}