// app/(pages)/(roles)/admin/treasury/statement/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Loader2,
    RefreshCw,
    FileText,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

function formatDate(ts?: number) {
    if (!ts) return "—";
    return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

export default function TreasuryStatementPage() {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // ── Queries ───────────────────────────────────────────────────
    const statementData = useQuery(
        api.treasury.treasury.getTreasuryStatement,
        {
            startDate: startDate ? new Date(startDate).getTime() : undefined,
            endDate: endDate ? new Date(endDate).getTime() : undefined,
        }
    );

    const stats = useQuery(api.treasury.treasury.getTreasuryStats);

    // ── Loading ──────────────────────────────────────────────────
    if (statementData === undefined || stats === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
            </div>
        );
    }

    const { statement, totals } = statementData;

    return (
        <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/treasury"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="العودة للرئيسية"
                        >
                            <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </Link>
                        <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-[#1a7a8a]" />
                            كشف حساب الخزينة
                        </h1>
                        <p className="text-sm text-gray-500">
                            عرض جميع الحركات المالية والرصيد التراكمي
                        </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        تحديث
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">إجمالي الوارد</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {totals.totalIncoming.toFixed(2)} EGP
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
                                        {totals.totalOutgoing.toFixed(2)} EGP
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
                                    <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-[#1a7a8a]' : 'text-red-600'}`}>
                                        {totals.balance.toFixed(2)} EGP
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
                                        {statement.length}
                                    </p>
                                </div>
                                <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">من:</span>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">إلى:</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                }}
                                className="text-sm"
                            >
                                إلغاء الفلترة
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {statement.length === 0 ? (
                        <div className="py-16 text-center">
                            <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400">لا توجد حركات مالية</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>رقم السند</TableHead>
                                            <TableHead>النوع</TableHead>
                                            <TableHead className="text-green-600">وارد</TableHead>
                                            <TableHead className="text-red-600">صادر</TableHead>
                                            <TableHead>البيان</TableHead>
                                            <TableHead>التاريخ</TableHead>
                                            <TableHead className="text-[#1a7a8a] font-bold">الرصيد</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {statement.map((item: any, index: number) => (
                                            <TableRow key={item.voucherId}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-mono font-medium">
                                                    {item.voucherNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'receipt'
                                                            ? 'bg-green-50 text-green-600'
                                                            : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {item.type === 'receipt' ? 'قبض' : 'صرف'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-green-600 font-medium">
                                                    {item.incoming > 0 ? item.incoming.toFixed(2) : "—"}
                                                </TableCell>
                                                <TableCell className="text-red-600 font-medium">
                                                    {item.outgoing > 0 ? item.outgoing.toFixed(2) : "—"}
                                                </TableCell>
                                                <TableCell className="max-w-32 truncate">
                                                    {item.notes || (item.type === 'receipt' ? item.recipientName : item.payeeName)}
                                                </TableCell>
                                                <TableCell>{formatDate(item.date)}</TableCell>
                                                <TableCell className={`font-bold ${item.balance >= 0 ? 'text-[#1a7a8a]' : 'text-red-600'}`}>
                                                    {item.balance.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-gray-50 bg-[#f7fafa] grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">إجمالي الوارد:</span>
                                    <span className="text-sm font-bold text-green-600">
                                        {totals.totalIncoming.toFixed(2)} EGP
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">إجمالي الصادر:</span>
                                    <span className="text-sm font-bold text-red-600">
                                        {totals.totalOutgoing.toFixed(2)} EGP
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">الرصيد النهائي:</span>
                                    <span className={`text-sm font-bold ${totals.balance >= 0 ? 'text-[#1a7a8a]' : 'text-red-600'}`}>
                                        {totals.balance.toFixed(2)} EGP
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}