"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  MdErrorOutline, 
  MdEmail, 
  MdSupportAgent,
  MdInfoOutline,
} from "react-icons/md";
import { 
  FaUser, 
  FaEnvelope, 
  FaUserTag, 
  FaExclamationTriangle,
  FaPhone,
} from "react-icons/fa";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { Loader2, AlertCircle, Mail, Phone, User, Shield, XCircle, LogOut, Clock } from "lucide-react";

export default function AccountRejectedPage() {
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
      
      // ✅ إذا كان لا يزال pending → روح pending-approval
      if (currentUser.status === "pending") {
        router.push("/pending-approval");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // ✅ شاشة التحميل
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7fafa] p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-2xl border border-[#c0c8c9] shadow-sm overflow-hidden">
          {/* الهيدر - تدرج أحمر */}
          <div className="bg-linear-to-r from-red-700 to-red-500 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-4 backdrop-blur">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              تم رفض الحساب
            </h1>
            <p className="text-red-100 text-sm">
              تم رفض طلب التسجيل الخاص بك
            </p>
          </div>

          {/* المحتوى */}
          <div className="p-6">
            {/* سبب الرفض */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm mb-1">
                    سبب الرفض:
                  </p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {currentUser.rejectionReason ||
                      "لم يتم تقديم سبب محدد. يرجى التواصل مع الدعم للحصول على مزيد من المعلومات."}
                  </p>
                </div>
              </div>
            </div>

            {/* بطاقة معلومات المستخدم */}
            <div className="bg-[#f7fafa] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-gray-500" />
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
                <div className="flex items-center justify-between pt-1">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <Shield className="h-3.5 w-3.5" />
                    الدور المطلوب:
                  </dt>
                  <dd className="text-[#001f24] font-medium">
                    {getRoleLabel(currentUser.role)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* رسالة المساعدة */}
            <div className="bg-[#e0f5f7] border border-[#1a7a8a]/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <MdSupportAgent className="h-5 w-5 text-[#1a7a8a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#001f24] text-sm mb-1">
                    هل تحتاج مساعدة؟
                  </p>
                  <p className="text-sm text-[#001f24]/80 leading-relaxed">
                    إذا كنت تعتقد أن هذا خطأ أو ترغب في إعادة التقديم بمعلومات مختلفة،
                    يرجى التواصل مع فريق الدعم على
                  </p>
                  <a 
                    href="mailto:support@marineacademy.com" 
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[#1a7a8a] hover:text-[#001f24] transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    support@marineacademy.com
                  </a>
                </div>
              </div>
            </div>

            {/* ✅ معلومات إضافية */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                <XCircle className="h-3.5 w-3.5" />
                مرفوض
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                {new Date(currentUser.updatedAt || currentUser.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>

            {/* أزرار الإجراءات */}
            <div className="space-y-2">
              <SignOutButton>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>

        {/* تذييل */}
        <p className="text-center text-xs text-gray-400 mt-4">
          تم رفض حسابك. يمكنك التواصل مع الدعم للمساعدة.
        </p>
      </div>
    </div>
  );
}