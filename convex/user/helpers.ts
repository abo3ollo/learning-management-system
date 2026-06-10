import { internalMutation } from "../_generated/server";

// توليد رقم طالب فريد
export async function generateStudentId(ctx: any): Promise<string> {
  let settings = await ctx.db.query("adminSettings").first();
  
  if (!settings) {
    const settingsId = await ctx.db.insert("adminSettings", {
      requireApproval: true,
      autoApproveRoles: ["student"],
      studentIdPrefix: "STU",
      nextStudentIdNumber: 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    settings = await ctx.db.get(settingsId);
  }
  
  const nextNumber = settings?.nextStudentIdNumber || 1000;
  const prefix = settings?.studentIdPrefix || "STU";
  const studentId = `${prefix}${nextNumber}`;
  
  await ctx.db.patch(settings._id, {
    nextStudentIdNumber: nextNumber + 1,
    updatedAt: Date.now(),
  });
  
  return studentId;
}