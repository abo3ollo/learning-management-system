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
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CheckoutModal } from "../../../../_components/student/CheckoutModal";

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

export default function StudentPurchasesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // جلب الأصناف المتاحة
  const items = useQuery(api.items.getAvailableForPurchase);
  const createPurchase = useMutation(api.items.createPurchaseRequest);

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

    await createPurchase({
      itemId: selectedItem._id as any,
      quantity: data.quantity,
      totalPrice: data.quantity * selectedItem.sellingPrice,
      paymentProof: data.paymentProof,
    });

    setIsCheckoutOpen(false);
    setSelectedItem(null);
  };

  // حالة التحميل
  if (items === undefined) {
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
              href="/student/dashboard"
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
                  {/* Product Image Placeholder */}
                  <div className="w-full h-40 bg-linear-to-br from-[#e8f4f8] to-[#f0f4f8] rounded-xl flex items-center justify-center mb-4 relative">
                    <Package className="h-16 w-16 text-[#1a7a8a]/30" />
                    <span className="absolute top-2 left-2 bg-[#001f24] text-white text-xs px-2 py-1 rounded-lg">
                      {item.code}
                    </span>
                  </div>

                  {/* Product Info */}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">المنتج</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">الكمية</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">الإجمالي</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myPurchases.map((purchase: any) => {
                      const statusMap: Record<string, { label: string; color: string; icon: any }> = {
                        pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
                        approved: { label: "تم الموافقة", color: "bg-green-100 text-green-700", icon: CheckCircle },
                        rejected: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: XCircle },
                        completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
                      };
                      const status = statusMap[purchase.status] || statusMap.pending;
                      const StatusIcon = status.icon;

                      return (
                        <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">{purchase.itemName}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{purchase.quantity}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {purchase.totalPrice.toFixed(2)} ج.م
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color} w-fit`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(purchase.createdAt).toLocaleDateString("ar-EG")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
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
    </div>
  );
}