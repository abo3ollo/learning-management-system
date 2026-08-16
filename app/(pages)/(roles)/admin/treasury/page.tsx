// app/(pages)/(roles)/admin/treasury/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TreasuryDashboardPage() {
  const stats = useQuery(api.treasury.treasury.getTreasuryStats);

  // تعريف البطاقات
  const cards = [
    {
      id: "statement",
      title: "كشف حساب الخزينة",
      description: "عرض جميع الحركات المالية والرصيد التراكمي",
      icon: Wallet,
      href: "/admin/treasury/statement",
      color: "bg-[#1a7a8a]",
      bgColor: "bg-[#f0f7f8]",
      stats: {
        label: "الرصيد الحالي",
        value: stats?.balance || 0,
        format: "currency",
      },
    },
    {
      id: "receipts",
      title: "سندات القبض",
      description: "إدارة سندات القبض المالية الواردة",
      icon: Receipt,
      href: "/admin/treasury/receipts",
      color: "bg-green-600",
      bgColor: "bg-green-50",
      stats: {
        label: "إجمالي القبض",
        value: stats?.totalReceipts || 0,
        format: "currency",
      },
    },
    {
      id: "payments",
      title: "سندات الصرف",
      description: "إدارة سندات الصرف المالية الصادرة",
      icon: CreditCard,
      href: "/admin/treasury/payments",
      color: "bg-red-600",
      bgColor: "bg-red-50",
      stats: {
        label: "إجمالي الصرف",
        value: stats?.totalPayments || 0,
        format: "currency",
      },
    },
    // {
    //   id: "reports",
    //   title: "التقارير المالية",
    //   description: "عرض التقارير والإحصائيات المالية",
    //   icon: FileText,
    //   href: "/admin/treasury/reports",
    //   color: "bg-purple-600",
    //   bgColor: "bg-purple-50",
    //   stats: {
    //     label: "إجمالي المعاملات",
    //     value: (stats?.receiptCount || 0) + (stats?.paymentCount || 0),
    //     format: "number",
    //   },
    // },
  ];

  if (stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-[#1a7a8a]" />
            الخزينة المالية
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة سندات القبض والصرف وكشف الحساب المالي
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">إجمالي الوارد</p>
                  <p className="text-xl font-bold text-green-600">
                    {stats.totalReceipts.toFixed(2)} EGP
                  </p>
                </div>
                <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">إجمالي الصادر</p>
                  <p className="text-xl font-bold text-red-600">
                    {stats.totalPayments.toFixed(2)} EGP
                  </p>
                </div>
                <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">الرصيد الحالي</p>
                  <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-[#1a7a8a]' : 'text-red-600'}`}>
                    {stats.balance.toFixed(2)} EGP
                  </p>
                </div>
                <div className="h-10 w-10 bg-[#f0f7f8] rounded-full flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-[#1a7a8a]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">عدد المعاملات</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.receiptCount + stats.paymentCount}
                  </p>
                </div>
                <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.id} href={card.href}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`${card.bgColor} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {card.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {card.description}
                        </p>
                        
                        {/* Stats */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {card.stats.label}:
                          </span>
                          <span className={`text-sm font-bold ${
                            card.id === 'receipts' ? 'text-green-600' :
                            card.id === 'payments' ? 'text-red-600' :
                            card.id === 'statement' ? 'text-[#1a7a8a]' :
                            'text-purple-600'
                          }`}>
                            {card.stats.format === 'currency' 
                              ? `${card.stats.value.toFixed(2)} EGP`
                              : card.stats.value
                            }
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="self-center">
                        <ArrowLeft className="h-5 w-5 text-gray-300 group-hover:text-[#1a7a8a] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}