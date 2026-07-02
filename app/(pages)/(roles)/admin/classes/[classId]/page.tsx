// app/(pages)/(roles)/admin/classes/[classId]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Loader2,
  MapPin,
  User,
  Info,
  X,
} from "lucide-react";
import { ClassInfoTab } from "@/app/_components/Classes/ClassInfoTab";
import { ClassStudentsTab } from "@/app/_components/Classes/ClassStudentsTab";
import { ClassTeachersTab } from "@/app/_components/Classes/ClassTeachersTab";
import { ClassSubjectsTab } from "@/app/_components/Classes/ClassSubjectsTab";
import { ClassScheduleTab } from "@/app/_components/Classes/ClassScheduleTab";
import Link from "next/link";


export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params.classId as string;

  const classData = useQuery(api.classes.classes.getClassById, {
    classId: classId as any,
  });

  const [activeTab, setActiveTab] = useState("info");

  const tabs = [
    { id: "info", label: "المعلومات", icon: Info },
    { id: "students", label: "الطلاب", icon: Users },
    { id: "teachers", label: "المعلمون", icon: GraduationCap },
    { id: "subjects", label: "المواد", icon: BookOpen },
    { id: "schedule", label: "الجدول", icon: Calendar },
  ];

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f7fafa]">
        <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]">
      {/* Header */}
      <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Right side - Icon and Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-white/10 rounded-xl shrink-0">
                <School className="h-8 w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white truncate">
                  {classData.classNameAr}
                </h1>
                <div className="flex items-center gap-2 text-[#a3ced6] text-sm mt-1 flex-wrap">
                  <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs">
                    {classData.classCode}
                  </span>
                  <span>•</span>
                  <span>{classData.grade}</span>
                  <span className="text-white/60">|</span>
                  <span>شعبة {classData.section}</span>
                  {classData.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-30">{classData.location}</span>
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-45">
                      {classData.supervisorName || "غير محدد"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Left side - Back button */}
            <Link href="/admin/classes" className="shrink-0">
              <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl border border-white/20 transition-colors">
                <X className="h-4 w-4" /> رجوع
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex justify-evenly gap-1 bg-white rounded-xl border border-[#c0c8c9] p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? "bg-[#001f24] text-white"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          {activeTab === "info" && <ClassInfoTab classId={classId} />}
          {activeTab === "students" && <ClassStudentsTab classId={classId} />}
          {activeTab === "teachers" && <ClassTeachersTab classId={classId} />}
          {activeTab === "subjects" && <ClassSubjectsTab classId={classId} />}
          {activeTab === "schedule" && <ClassScheduleTab classId={classId} />}
        </div>
      </div>
    </div>
  );
}