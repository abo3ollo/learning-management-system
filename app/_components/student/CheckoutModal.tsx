"use client";

import { useState, useRef } from "react";
import { X, Loader2, Upload, Package, DollarSign, Hash } from "lucide-react";
import Image from "next/image";

interface ItemDetails {
  _id: string;
  code: string;
  name: string;
  sellingPrice: number;
  unitName: string;
  categoryName: string;
  warehouseName: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetails;
  onSubmit: (data: { quantity: number; paymentProof: string }) => Promise<void>;
}

export function CheckoutModal({
  isOpen,
  onClose,
  item,
  onSubmit,
}: CheckoutModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalPrice = quantity * item.sellingPrice;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من حجم الملف (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith("image/")) {
      setError("يرجى رفع ملف صورة فقط");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError("حدث خطأ أثناء قراءة الصورة");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1) {
      setError("الكمية يجب أن تكون على الأقل 1");
      return;
    }

    if (!paymentProof) {
      setError("يرجى رفع إيصال الدفع");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ quantity, paymentProof });
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إتمام الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">إتمام الشراء</h2>
            <p className="text-sm text-gray-500">تأكيد طلب الشراء ورفع إيصال الدفع</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-[#e8f4f8] to-[#f0f4f8] rounded-xl flex items-center justify-center shrink-0">
                <Package className="h-8 w-8 text-[#1a7a8a]/40" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1 text-xs">
                  <span className="bg-white px-2 py-1 rounded-lg text-gray-600 border border-gray-200">
                    <Hash className="h-3 w-3 inline ml-1" />
                    {item.code}
                  </span>
                  <span className="bg-white px-2 py-1 rounded-lg text-gray-600 border border-gray-200">
                    {item.unitName}
                  </span>
                  <span className="bg-white px-2 py-1 rounded-lg text-gray-600 border border-gray-200">
                    {item.categoryName}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-bold text-[#001f24]">
                    {item.sellingPrice.toFixed(2)} <span className="text-sm font-normal text-gray-500">ج.م / {item.unitName}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              الكمية <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decreaseQuantity}
                className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center border border-gray-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              />
              <button
                type="button"
                onClick={increaseQuantity}
                className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                +
              </button>
              <span className="text-sm text-gray-500">{item.unitName}</span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#001f24] text-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الإجمالي</span>
              <span className="text-xl font-bold">
                {totalPrice.toFixed(2)} <span className="text-sm font-normal">ج.م</span>
              </span>
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              إيصال الدفع <span className="text-red-500">*</span>
            </label>
            
            {!paymentProof ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#1a7a8a] transition-colors cursor-pointer"
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">اضغط لرفع إيصال الدفع</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (حد أقصى 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={paymentProof}
                      alt="إيصال الدفع"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">تم رفع الإيصال</p>
                    <p className="text-xs text-gray-400">اضغط على الزر لتغيير الصورة</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    تغيير
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentProof("")}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || !paymentProof}
              className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "تأكيد الشراء"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}