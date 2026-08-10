"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { 
  ShoppingCart, 
  Search, 
  Package, 
  DollarSign, 
  ShoppingBag,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Info,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CheckoutModal } from "@/app/_components/student/CheckoutModal";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ItemWithDetails {
  _id: string;
  code: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  averageCost: number;
  unitId: string;
  unitName: string;
  categoryId: string;
  categoryName: string;
  warehouseId: string;
  warehouseName: string;
  isActive: boolean;
  _creationTime: number;
}

// ✅ مكون عرض رسالة الأدمن
function AdminMessage({ purchase }: { purchase: any }) {
  if (purchase.status === "approved" && purchase.adminNotes) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-green-700">📋 تعليمات الاستلام:</p>
            <p className="text-sm text-green-700 mt-1 whitespace-pre-wrap">
              {purchase.adminNotes}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (purchase.status === "rejected" && purchase.rejectionReason) {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-red-700">⚠️ سبب الرفض:</p>
            <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">
              {purchase.rejectionReason}
            </p>
            {purchase.adminNotes && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-xs text-red-600">
                  <span className="font-medium">ملاحظات إضافية:</span>
                  <span className="block mt-1">{purchase.adminNotes}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (purchase.status === "approved" && !purchase.adminNotes) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700">✅ تم الموافقة على طلبك</p>
        </div>
      </div>
    );
  }

  return null;
}

// ✅ مكون عرض حالة الطلب مع تفاصيل
function PurchaseStatusBadge({ purchase }: { purchase: any }) {
  const statusMap: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
    pending: { 
      label: "قيد المراجعة", 
      color: "text-yellow-700", 
      bgColor: "bg-yellow-100",
      icon: Clock 
    },
    approved: { 
      label: "تم الموافقة", 
      color: "text-green-700", 
      bgColor: "bg-green-100",
      icon: CheckCircle 
    },
    rejected: { 
      label: "مرفوض", 
      color: "text-red-700", 
      bgColor: "bg-red-100",
      icon: XCircle 
    },
    completed: { 
      label: "مكتمل", 
      color: "text-blue-700", 
      bgColor: "bg-blue-100",
      icon: CheckCircle 
    },
  };

  const status = statusMap[purchase.status] || statusMap.pending;
  const StatusIcon = status.icon;

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color} w-fit`}>
      <StatusIcon className="h-3 w-3" />
      {status.label}
    </span>
  );
}

export default function StudentPurchasesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ جلب بيانات المستخدم الحالي
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    user ? {} : "skip"
  );

  // جلب الأصناف المتاحة
  const items = useQuery(api.items.getAvailableForPurchase);
  const createPurchase = useMutation(api.items.createPurchaseRequest);
  
  // ✅ جلب دوال المعاملات
  const createTransaction = useMutation(api.transactions.transactions.createTransaction);

  // جلب طلبات الشراء السابقة للطالب
  const myPurchases = useQuery(api.purchases.getMyPurchases, 
    user ? {} : "skip"
  );

  // فلترة الأصناف حسب البحث
  const filteredItems = items?.filter((item: ItemWithDetails) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckout = (item: ItemWithDetails) => {
    setSelectedItem(item);
    setIsCheckoutOpen(true);
  };

  const handlePurchaseSubmit = async (data: {
    quantity: number;
    paymentProof: string;
  }) => {
    if (!selectedItem) return;
    if (!currentUser) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. إنشاء طلب الشراء
      const purchaseResult = await createPurchase({
        itemId: selectedItem._id as any,
        quantity: data.quantity,
        totalPrice: data.quantity * selectedItem.sellingPrice,
        paymentProof: data.paymentProof,
      });

      // ✅ 2. إنشاء معاملة مالية
      const transactionData: any = {
        studentId: currentUser._id,
        type: "purchase",
        category: "product_purchase",
        amount: data.quantity * selectedItem.sellingPrice,
        currency: "EGP",
        status: "completed",
        referenceId: purchaseResult,
        referenceType: "purchase",
        description: `Purchase of ${selectedItem.name}`,
        descriptionAr: `شراء ${selectedItem.name}`,
        paymentProof: data.paymentProof,
      };

      if (currentUser.parentId) {
        transactionData.parentId = currentUser.parentId as Id<"users">;
      }

      await createTransaction(transactionData);

      setIsCheckoutOpen(false);
      setSelectedItem(null);
      toast.success("✅ تم الشراء بنجاح");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الشراء");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (purchaseId: string) => {
    setExpandedPurchase(expandedPurchase === purchaseId ? null : purchaseId);
  };

  // حالة التحميل
  if (items === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/student"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                المشتريات
              </h1>
              <p className="text-gray-500 text-sm">
                تصفح المنتجات المتاحة وقم بشرائها
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ShoppingBag className="h-5 w-5 text-[#1a7a8a]" />
            <span className="text-sm font-medium text-gray-700">
              {items?.length || 0} منتج متاح
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتج بالاسم أو الكود..."
              className="w-full border border-gray-200 rounded-xl pr-12 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredItems?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">لا توجد منتجات</h3>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لم يتم إضافة أي منتجات بعد"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredItems?.map((item: ItemWithDetails) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:scale-105 group"
              >
                <div className="p-5">
                  <div className="w-full h-40 bg-linear-to-br from-[#e8f4f8] to-[#f0f4f8] rounded-xl flex items-center justify-center mb-4 relative">
                    <Package className="h-16 w-16 text-[#1a7a8a]/30" />
                    <span className="absolute top-2 left-2 bg-[#001f24] text-white text-xs px-2 py-1 rounded-lg">
                      {item.code}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                      {item.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {item.categoryName}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {item.unitName}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {item.warehouseName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400">سعر البيع</p>
                        <p className="text-lg font-bold text-[#001f24]">
                          {item.sellingPrice.toFixed(2)} <span className="text-sm font-normal text-gray-500">ج.م</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleCheckout(item)}
                        className="flex items-center gap-2 bg-[#001f24] hover:bg-[#03363d] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        شراء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Purchases History */}
        {myPurchases && myPurchases.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              طلباتي السابقة
            </h2>
            
            <div className="space-y-4">
              {myPurchases.map((purchase: any) => {
                const safeItemSellingPrice = purchase.itemSellingPrice ?? 0;
                const safeTotalPrice = purchase.totalPrice ?? 0;
                const safeQuantity = purchase.quantity ?? 0;
                
                return (
                  <div
                    key={purchase._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => toggleExpand(purchase._id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-37.5">
                          <p className="font-semibold text-gray-900">{purchase.itemName || "غير معروف"}</p>
                          <p className="text-xs text-gray-400">كود: {purchase.itemCode || "غير معروف"}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-gray-500">الكمية: </span>
                            <span className="font-medium text-gray-700">{safeQuantity}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">الإجمالي: </span>
                            <span className="font-medium text-[#001f24]">
                              {safeTotalPrice.toFixed(2)} ج.م
                            </span>
                          </div>
                          <PurchaseStatusBadge purchase={purchase} />
                          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                              expandedPurchase === purchase._id ? "rotate-180" : ""
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedPurchase === purchase._id && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              تفاصيل المنتج
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">الاسم:</span>
                                <span className="font-medium text-gray-700">{purchase.itemName || "غير معروف"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">الكود:</span>
                                <span className="font-medium text-gray-700">{purchase.itemCode || "غير معروف"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">سعر الوحدة:</span>
                                <span className="font-medium text-gray-700">
                                  {safeItemSellingPrice.toFixed(2)} ج.م
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">الكمية:</span>
                                <span className="font-medium text-gray-700">{safeQuantity}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                                <span className="text-gray-500 font-medium">الإجمالي:</span>
                                <span className="font-bold text-[#001f24]">
                                  {safeTotalPrice.toFixed(2)} ج.م
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              حالة الطلب
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">الحالة:</span>
                                <PurchaseStatusBadge purchase={purchase} />
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">تاريخ الطلب:</span>
                                <span className="font-medium text-gray-700">
                                  {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString("ar-EG", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }) : "غير معروف"}
                                </span>
                              </div>
                              {purchase.updatedAt && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">آخر تحديث:</span>
                                  <span className="font-medium text-gray-700">
                                    {new Date(purchase.updatedAt).toLocaleDateString("ar-EG", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            <AdminMessage purchase={purchase} />
                          </div>
                        </div>

                        {purchase.paymentProof && (
                          <div className="mt-3">
                            <button
                              onClick={() => window.open(purchase.paymentProof, "_blank")}
                              className="text-xs text-[#1a7a8a] hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              عرض إيصال الدفع
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ✅ CheckoutModal - تعديل teacher ليكون object مناسب */}
      {selectedItem && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSubmit={handlePurchaseSubmit}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}