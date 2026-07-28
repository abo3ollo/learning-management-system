"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface InvoiceItem {
  itemId: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
  itemName?: string;
  itemCode?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export function InvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: InvoiceModalProps) {
  const [date, setDate] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const warehouses = useQuery(api.warehouses.getAll);
  const allItems = useQuery(api.items.getAll);

  useEffect(() => {
    if (initialData) {
      setDate(new Date(initialData.date).toISOString().split("T")[0]);
      setWarehouseId(initialData.warehouseId || "");
      setNotes(initialData.notes || "");
      
      // جلب تفاصيل الأصناف في الفاتورة
      if (initialData._id) {
        // سيتم جلب التفاصيل من API منفصل
        fetchInvoiceDetails(initialData._id);
      }
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setWarehouseId("");
      setNotes("");
      setItems([]);
    }
  }, [initialData, isOpen]);

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      // يمكن إضافة Query لجلب تفاصيل الفاتورة
      // هنا سنفترض أن initialData يحتوي على items
      if (initialData?.items) {
        setItems(initialData.items);
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!selectedItemId || !quantity) return;

    const selectedItem = allItems?.find((item: any) => item._id === selectedItemId);
    if (!selectedItem) return;

    const qty = Number(quantity);
    const price = selectedItem.purchasePrice;
    const total = qty * price;

    const newItem: InvoiceItem = {
      itemId: selectedItemId,
      quantity: qty,
      purchasePrice: price,
      totalPrice: total,
      itemName: selectedItem.name,
      itemCode: selectedItem.code,
    };

    setItems([...items, newItem]);
    setSelectedItemId("");
    setQuantity("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        date: new Date(date).getTime(),
        warehouseId,
        notes,
        items: items.map(({ itemId, quantity, purchasePrice }) => ({
          itemId,
          quantity,
          purchasePrice,
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "تعديل فاتورة" : "فاتورة جديدة"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                المخزن <span className="text-red-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                required
              >
                <option value="">اختر المخزن</option>
                {warehouses?.map((warehouse: any) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                ملاحظات
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات على الفاتورة"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] resize-none"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              إضافة صنف للفاتورة
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-50">
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                >
                  <option value="">اختر الصنف</option>
                  {allItems
                    ?.filter((item: any) => item.warehouseId === warehouseId)
                    .map((item: any) => (
                      <option key={item._id} value={item._id}>
                        {item.code} - {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="الكمية"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedItemId || !quantity}
                className="flex items-center gap-2 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                إضافة
              </button>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">اسم الصنف</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">الكمية</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">سعر الشراء</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">الإجمالي</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.itemName || "جاري التحميل..."}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.purchasePrice.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.totalPrice.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700 text-left">
                        الإجمالي الكلي
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-[#001f24]">
                        {totalAmount.toFixed(2)} ج.م
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || !warehouseId || items.length === 0}
              className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                initialData ? "تحديث الفاتورة" : "حفظ الفاتورة"
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