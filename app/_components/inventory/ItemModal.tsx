"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export function ItemModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ItemModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    purchasePrice: "",
    sellingPrice: "",
    averageCost: "",
    unitId: "",
    categoryId: "",
    warehouseId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const units = useQuery(api.units.getAll);
  const categories = useQuery(api.categories.getAll);
  const warehouses = useQuery(api.warehouses.getAll);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        purchasePrice: String(initialData.purchasePrice || ""),
        sellingPrice: String(initialData.sellingPrice || ""),
        averageCost: String(initialData.averageCost || ""),
        unitId: initialData.unitId || "",
        categoryId: initialData.categoryId || "",
        warehouseId: initialData.warehouseId || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        purchasePrice: "",
        sellingPrice: "",
        averageCost: "",
        unitId: "",
        categoryId: "",
        warehouseId: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || 
        !formData.unitId || !formData.categoryId || !formData.warehouseId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "تعديل صنف" : "إضافة صنف جديد"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                الكود <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField("code", e.target.value)}
                placeholder="كود الصنف"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                اسم الصنف <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="اسم الصنف"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                سعر الشراء <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => updateField("purchasePrice", e.target.value)}
                placeholder="سعر الشراء"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                سعر البيع <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => updateField("sellingPrice", e.target.value)}
                placeholder="سعر البيع"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                متوسط التكلفة <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.averageCost}
                onChange={(e) => updateField("averageCost", e.target.value)}
                placeholder="متوسط التكلفة"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                الوحدة <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unitId}
                onChange={(e) => updateField("unitId", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
              >
                <option value="">اختر الوحدة</option>
                {units?.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                المجموعة <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
              >
                <option value="">اختر المجموعة</option>
                {categories?.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                المخزن <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.warehouseId}
                onChange={(e) => updateField("warehouseId", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
              >
                <option value="">اختر المخزن</option>
                {warehouses?.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || !formData.code.trim() || !formData.name.trim() || 
                       !formData.unitId || !formData.categoryId || !formData.warehouseId}
              className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                initialData ? "تحديث" : "إضافة"
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