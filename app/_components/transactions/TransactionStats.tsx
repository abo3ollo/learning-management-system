// app/_components/transactions/TransactionStats.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";

interface TransactionStatsProps {
  stats: any;
  currency?: string;
  lang: "en" | "ar";
}

export function TransactionStats({ stats, currency = "EGP", lang }: TransactionStatsProps) {
  const t = {
    total: lang === "ar" ? "إجمالي المعاملات" : "Total Transactions",
    totalAmount: lang === "ar" ? "إجمالي المبالغ" : "Total Amount",
    pending: lang === "ar" ? "قيد المراجعة" : "Pending",
    approved: lang === "ar" ? "تمت الموافقة" : "Approved",
    rejected: lang === "ar" ? "مرفوضة" : "Rejected",
    platform: lang === "ar" ? "منصة" : "Platform",
    aptitude: lang === "ar" ? "قدرات" : "Aptitude",
    academic: lang === "ar" ? "تحصيلي" : "Academic",
    purchase: lang === "ar" ? "مشتريات" : "Purchase",
  };

  return (
    <div className="space-y-4">
      {/* ✅ الصف الأول - الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{t.total}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-lg">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{t.totalAmount}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalAmount?.toFixed(2) || 0} <span className="text-sm font-normal">{currency}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-lg">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">{t.pending}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendingCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>

        

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">{t.approved}</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.approvedCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-lg">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">{t.rejected}</p>
                <p className="text-2xl font-bold text-red-600">{stats?.rejectedCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-red-600 text-lg">❌</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ الصف الثاني - المبالغ حسب النوع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a7a8a]">{t.platform}</p>
                <p className="text-xl font-bold text-[#1a7a8a]">
                  {stats?.platformTotal?.toFixed(2) || 0} <span className="text-sm font-normal">{currency}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                <span className="text-[#1a7a8a] text-lg">💻</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">{t.aptitude}</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats?.aptitudeTotal?.toFixed(2) || 0} <span className="text-sm font-normal">{currency}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-lg">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">{t.academic}</p>
                <p className="text-xl font-bold text-blue-600">
                  {stats?.academicTotal?.toFixed(2) || 0} <span className="text-sm font-normal">{currency}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-lg">📚</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">{t.purchase}</p>
                <p className="text-xl font-bold text-green-600">
                  {stats?.purchaseTotal?.toFixed(2) || 0} <span className="text-sm font-normal">{currency}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-lg">🛒</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}