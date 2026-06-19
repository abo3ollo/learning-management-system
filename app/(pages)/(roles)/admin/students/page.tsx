"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  Download,
  Loader2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddStudentModal } from "@/app/_components/AddStudentModal";
import { SiGoogleclassroom } from "react-icons/si";

export default function AdminStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const studentsData = useQuery(api.user.students.getStudents, {
    status: selectedFilter !== "all" ? selectedFilter : undefined,
    search: searchQuery || undefined,
  });
  console.log(studentsData);
  const pendingApprovals = useQuery(api.user.admin.getPendingRegistrations);

  const deleteStudent = useMutation(api.user.students.deleteStudent);

  const students = studentsData || [];
  const isLoading = studentsData === undefined;
  const pendingCount = pendingApprovals?.length ?? 0;
  const activeCount = students.filter((s: any) => s.status === "approved").length;

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      icon: GraduationCap,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      trend: "+12%",
      up: true,
    },
    {
      label: "Pending Approval",
      value: pendingCount,
      icon: UserPlus,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      trend: `+${pendingCount}`,
      up: true,
    },
    {
      label: "Active Students",
      value: activeCount,
      icon: GraduationCap,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      trend: "+5%",
      up: true,
    },
  ];

  const handleDelete = async (studentId: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setDeletingId(studentId);
    try {
      await deleteStudent({ studentId: studentId as any });
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    } finally {
      setDeletingId(null);
    }
  };

  const statusStyle: Record<string, string> = {
    approved: "bg-green-50 text-green-700 border border-green-200",
    pending:  "bg-amber-50 text-amber-700 border border-amber-200",
    rejected: "bg-red-50 text-red-600 border border-red-200",
  };

  const statusLabel: Record<string, string> = {
    approved: "Active",
    pending:  "Pending",
    rejected: "Rejected",
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-[#001f24]">Students</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold text-[#001f24]">Manage Students</h2>
          <p className="text-gray-500 mt-1 text-sm">
            View, add, and manage all registered students.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.up ? "text-green-600" : "text-red-500"
                  }`}>
                    {stat.trend} {stat.up ? "↗" : "↘"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#001f24]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search + filter */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200 focus-visible:ring-[#03363d]/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
            >
              <option value="all">All Students</option>
              <option value="approved">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSelectedFilter("all"); setSearchQuery(""); }}
              className="border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#f7fafa]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Parent</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#001f24]" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <GraduationCap className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No students found</p>
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add First Student
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student: any) => (
                    <tr key={student._id} className="hover:bg-[#f7fafa] transition-colors">
                      {/* Student */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <span className="text-blue-600 font-bold text-sm">
                              {student.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#001f24] text-sm">{student.name}</p>
                            <p className="text-xs text-gray-400 font-mono">
                              #{student._id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {student.email}
                          </p>
                          {student.phoneNumber && (
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {student.phoneNumber}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <SiGoogleclassroom  className="h-3.5 w-3.5 text-gray-400" />
                            {student.classInfo?.classNameAr || "No class assigned"}
                          </p>
                          
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {student.parents?.[0]?.email || "No parent email"}
                          </p>
                          {student.phoneNumber && (
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {student.parents?.[0]?.phoneNumber || "No parent phone number"}
                              
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(student.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          statusStyle[student.status] ?? "bg-gray-100 text-gray-600"
                        }`}>
                          {statusLabel[student.status] ?? student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/students/${student._id}`}>
                            <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors group">
                              <Edit className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                            </button>
                          </Link>
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            onClick={() => handleDelete(student._id)}
                            disabled={deletingId === student._id}
                          >
                            {deletingId === student._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {students.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-[#001f24]">{students.length}</span> students
              </p>
            </div>
          )}
        </div>
      </div>

      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}