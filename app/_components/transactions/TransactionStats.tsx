"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Video,
  Award,
  ShoppingBag,
} from "lucide-react";

interface TransactionStatsProps {
  stats: {
    totalAmount: number;
    totalCount: number;
    completedCount: number;
    pendingCount: number;
    refundedCount: number;
    failedCount: number;
    platformTotal: number;
    aptitudeTotal: number;
    purchaseTotal: number;
  };
  currency: string;
  lang: "en" | "ar";
}

export function TransactionStats({ stats, currency, lang }: TransactionStatsProps) {
  const t = {
    totalAmount: lang === "ar" ? "إجمالي المبالغ" : "Total Amount",
    totalCount: lang === "ar" ? "عدد المعاملات" : "Total Transactions",
    completed: lang === "ar" ? "مكتملة" : "Completed",
    pending: lang === "ar" ? "معلقة" : "Pending",
    refunded: lang === "ar" ? "مرتجعة" : "Refunded",
    failed: lang === "ar" ? "فاشلة" : "Failed",
    platform: lang === "ar" ? "المنصة" : "Platform",
    aptitude: lang === "ar" ? "تحصيلات" : "Aptitude",
    purchase: lang === "ar" ? "مشتريات" : "Purchases",
  };

  const formatAmount = (amount: number) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{t.totalAmount}</p>
                <p className="text-xl font-bold text-gray-900">{formatAmount(stats.totalAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{t.totalCount}</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">{t.completed}</p>
                <p className="text-xl font-bold text-green-600">{stats.completedCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">{t.pending}</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pendingCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600">{t.refunded}</p>
                <p className="text-xl font-bold text-orange-600">{stats.refundedCount}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">{t.failed}</p>
                <p className="text-xl font-bold text-red-600">{stats.failedCount}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفصيل حسب النوع */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#e0f5f7] rounded-lg flex items-center justify-center">
                <Video className="h-4 w-4 text-[#1a7a8a]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t.platform}</p>
                <p className="text-lg font-bold text-[#1a7a8a]">
                  {formatAmount(stats.platformTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t.aptitude}</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatAmount(stats.aptitudeTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t.purchase}</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(stats.purchaseTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}