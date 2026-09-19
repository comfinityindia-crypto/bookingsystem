import { prisma } from "@/lib/prisma";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

const SEED_EMPLOYEES = [
  {
    id: "seed-1",
    slug: "sooraj",
    name: "Sooraj Sudevan",
    email: "comfinityindia@gmail.com",
    designation: "Co-Founder",
    timezone: "Asia/Kolkata",
    dailyMeetingLimit: 5,
    bufferMinutes: 15,
    googleCalendarConnected: false,
    googleCalendarEmail: null,
    isActive: true,
  },
];

async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        designation: true,
        timezone: true,
        dailyMeetingLimit: true,
        bufferMinutes: true,
        googleCalendarConnected: true,
        googleCalendarEmail: true,
        isActive: true,
      },
    });

    return employees.length > 0 ? employees : SEED_EMPLOYEES;
  } catch {
    return SEED_EMPLOYEES;
  }
}

export default async function AdminEmployeesPage() {
  const employees = await getEmployees();
  return <EmployeesClient employees={employees} />;
}
