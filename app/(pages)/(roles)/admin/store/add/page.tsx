// app/(pages)/(roles)/admin/store/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const typeOptions = [
  { value: "books", label: "كتب" },
  { value: "stationery", label: "قرطاسية" },
  { value: "electronics", label: "إلكترونيات" },
  { value: "uniforms", label: "زي مدرسي" },
  { value: "supplies", label: "مستلزمات" },
  { value: "other", label: "أخرى" },
];

const unitOptions = [
  { value: "piece", label: "قطعة" },
  { value: "kg", label: "كيلو" },
  { value: "meter", label: "متر" },
  { value: "box", label: "علبة" },
  { value: "liter", label: "لتر" },
  { value: "other", label: "أخرى" },
];

export default function AddStoreItemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const grades = useQuery(api.grades.grades.getActiveGrades);

  const createItem = useMutation(api.store.items.createItem);

  // ── Form state ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    type: "other",
    description: "",
    unit: "piece",
    purchasePrice: "",
    sellingPrice: "",
    quantity: "",
    minStock: "",
    gradeId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // ✅ معالجة تغيير الـ Select - تقبل string | null
  const handleTypeChange = (value: string | null) => {
    handleChange("type", value || "other");
  };

  const handleUnitChange = (value: string | null) => {
    handleChange("unit", value || "piece");
  };

  const handleGradeChange = (value: string | null) => {
    handleChange("gradeId", value || "");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "اسم الصنف مطلوب";
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = "سعر الشراء مطلوب";
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = "سعر البيع مطلوب";
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = "الكمية مطلوبة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createItem({
        name: formData.name.trim(),
        type: formData.type as any,
        description: formData.description || undefined,
        unit: formData.unit as any,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
        gradeId: formData.gradeId ? (formData.gradeId as any) : undefined,
      });

      router.push("/admin/store");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إضافة الصنف");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001f24] flex items-center gap-2">
            <Package className="h-6 w-6 text-[#1a7a8a]" />
            إضافة صنف جديد
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أدخل بيانات الصنف الجديد لإضافته إلى المخزن
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>بيانات الصنف</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* الاسم */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                اسم الصنف <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="مثال: قلم رصاص"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* النوع والوحدة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع *</Label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وحدة القياس *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={handleUnitChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوحدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* الأسعار */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  سعر الشراء <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">ج.م</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange("purchasePrice", e.target.value)}
                    placeholder="0.00"
                    className={errors.purchasePrice ? "border-red-500" : "pr-12"}
                  />
                </div>
                {errors.purchasePrice && (
                  <p className="text-xs text-red-500">{errors.purchasePrice}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  سعر البيع <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">ج.م</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => handleChange("sellingPrice", e.target.value)}
                    placeholder="0.00"
                    className={errors.sellingPrice ? "border-red-500" : "pr-12"}
                  />
                </div>
                {errors.sellingPrice && (
                  <p className="text-xs text-red-500">{errors.sellingPrice}</p>
                )}
              </div>
            </div>

            {/* الكمية والحد الأدنى */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  الكمية الأولية <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  placeholder="0"
                  className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500">{errors.quantity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى للمخزون</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  placeholder="اختياري"
                />
                <p className="text-xs text-gray-400">
                  تنبيه عند الوصول لهذا الحد
                </p>
              </div>
            </div>

            {/* الصف الدراسي */}
            <div className="space-y-2">
              <Label>الصف الدراسي</Label>
              <Select
                value={formData.gradeId}
                onValueChange={handleGradeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون صف</SelectItem>
                  {grades?.map((g: any) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الوصف */}
            <div className="space-y-2">
              <Label>الوصف</Label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                rows={3}
                placeholder="وصف تفصيلي للصنف (اختياري)"
              />
            </div>

            {/* أزرار */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    إضافة الصنف
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}