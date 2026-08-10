"use client";

import { Eye, CheckCircle, XCircle, Clock, AlertCircle, Video, Award, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TransactionsTableProps {
  transactions: any[];
  onViewDetails: (transaction: any) => void;
  onStatusChange?: (id: string, status: string) => void;
  showStudent?: boolean;
  showActions?: boolean;
  lang: "en" | "ar";
}

const typeIcons = {
  platform: Video,
  aptitude: Award,
  purchase: ShoppingBag,
};

const typeColors = {
  platform: "bg-[#e0f5f7] text-[#1a7a8a]",
  aptitude: "bg-purple-100 text-purple-700",
  purchase: "bg-green-100 text-green-700",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  refunded: "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
};

const statusIcons = {
  pending: Clock,
  completed: CheckCircle,
  refunded: XCircle,
  failed: AlertCircle,
};

export function TransactionsTable({
  transactions,
  onViewDetails,
  onStatusChange,
  showStudent = false,
  showActions = false,
  lang,
}: TransactionsTableProps) {
  const t = {
    id: lang === "ar" ? "رقم" : "ID",
    student: lang === "ar" ? "الطالب" : "Student",
    type: lang === "ar" ? "النوع" : "Type",
    description: lang === "ar" ? "الوصف" : "Description",
    amount: lang === "ar" ? "المبلغ" : "Amount",
    status: lang === "ar" ? "الحالة" : "Status",
    date: lang === "ar" ? "التاريخ" : "Date",
    actions: lang === "ar" ? "الإجراءات" : "Actions",
    view: lang === "ar" ? "عرض" : "View",
    approve: lang === "ar" ? "موافقة" : "Approve",
    reject: lang === "ar" ? "رفض" : "Reject",
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{lang === "ar" ? "لا توجد معاملات" : "No transactions"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">#</th>
            {showStudent && (
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                {t.student}
              </th>
            )}
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
              {t.type}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
              {t.description}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
              {t.amount}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
              {t.status}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
              {t.date}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
              {t.actions}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction, index) => {
            const TypeIcon = typeIcons[transaction.type as keyof typeof typeIcons] || ShoppingBag;
            const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || Clock;

            return (
              <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                
                {showStudent && (
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{transaction.studentName}</p>
                      <p className="text-xs text-gray-400">{transaction.studentEmail}</p>
                    </div>
                  </td>
                )}

                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${typeColors[transaction.type as keyof typeof typeColors]}`}>
                    <TypeIcon className="h-3 w-3" />
                    {lang === "ar" 
                      ? transaction.type === "platform" ? "منصة" 
                        : transaction.type === "aptitude" ? "تحصيلات" 
                        : "مشتريات"
                      : transaction.type}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">
                    {lang === "ar" ? transaction.descriptionAr : transaction.description}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.amount.toFixed(2)} {transaction.currency}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                    <StatusIcon className="h-3 w-3" />
                    {lang === "ar"
                      ? transaction.status === "pending" ? "قيد المراجعة"
                        : transaction.status === "completed" ? "مكتمل"
                        : transaction.status === "refunded" ? "مرتجع"
                        : "فاشل"
                      : transaction.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(transaction.createdAt).toLocaleDateString("ar-EG")}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(transaction)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                      title={t.view}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {showActions && transaction.status === "pending" && onStatusChange && (
                      <>
                        <button
                          onClick={() => onStatusChange(transaction._id, "completed")}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                          title={t.approve}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onStatusChange(transaction._id, "failed")}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title={t.reject}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}