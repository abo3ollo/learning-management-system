"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Loader2, DollarSign, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CoursePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  initialPrice?: number;
  initialCurrency?: string;
  teacherName?: string;
}

const CURRENCIES = [
  { value: "EGP", label: "جنيه مصري", symbol: "ج.م" },
  { value: "USD", label: "دولار أمريكي", symbol: "$" },
  { value: "SAR", label: "ريال سعودي", symbol: "ر.س" },
  { value: "AED", label: "درهم إماراتي", symbol: "د.إ" },
  { value: "KWD", label: "دينار كويتي", symbol: "د.ك" },
  { value: "BHD", label: "دينار بحريني", symbol: "ب.د" },
  { value: "QAR", label: "ريال قطري", symbol: "ر.ق" },
];

export function CoursePriceModal({
  isOpen,
  onClose,
  teacherId,
  initialPrice = 0,
  initialCurrency = "EGP",
  teacherName = "",
}: CoursePriceModalProps) {
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("EGP");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCoursePrice = useMutation(api.coursePrice.coursePrice.updateCoursePrice);

  useEffect(() => {
    if (isOpen) {
      setPrice(initialPrice > 0 ? initialPrice.toString() : "");
      setCurrency(initialCurrency || "EGP");
      setError(null);
    }
  }, [isOpen, initialPrice, initialCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setError("يرجى إدخال سعر صحيح");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateCoursePrice({
        teacherId: teacherId as any,
        price: priceValue,
        currency: currency,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ السعر");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const getCurrencySymbol = (code: string) => {
    const found = CURRENCIES.find(c => c.value === code);
    return found?.symbol || code;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">سعر الكورس</h2>
              {teacherName && (
                <p className="text-sm text-gray-500">{teacherName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="flex items-start gap-2 text-sm text-blue-700">
              <span className="text-lg">ℹ️</span>
              <div>
                <p className="font-medium">سعر الكورس الكامل</p>
                <p className="text-xs mt-1">
                  هذا السعر يشمل <strong>جميع المواد</strong> التي يقدمها هذا المعلم
                </p>
              </div>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 block mb-2">
              سعر الكورس <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="أدخل سعر الكورس"
                className="pr-12 text-lg font-medium border-gray-200 focus:border-green-500 focus:ring-green-500"
                required
                autoFocus
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {getCurrencySymbol(currency)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 هذا السعر سيظهر للطلاب عند شراء الكورس كامل
            </p>
          </div>

          {/* Currency Select */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 block mb-2">
              العملة
            </Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.symbol} - {curr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Price Suggestions */}
          <div>
            <p className="text-xs text-gray-500 mb-2">أسعار مقترحة:</p>
            <div className="flex flex-wrap gap-2">
              {[100, 200, 300, 500, 750, 1000].map((suggestedPrice) => (
                <button
                  key={suggestedPrice}
                  type="button"
                  onClick={() => setPrice(suggestedPrice.toString())}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    parseFloat(price) === suggestedPrice
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                  }`}
                >
                  {suggestedPrice} {getCurrencySymbol(currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ السعر
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}