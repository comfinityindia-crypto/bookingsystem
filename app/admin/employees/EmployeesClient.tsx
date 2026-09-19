"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface EmployeeItem {
  id: string;
  name: string;
  slug: string;
  email: string;
  designation: string;
  timezone: string;
  dailyMeetingLimit: number;
  bufferMinutes: number;
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
  isActive: boolean;
}

export default function EmployeesClient({
  employees,
}: {
  employees: EmployeeItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  async function handleDisconnect(employeeId: string) {
    if (!confirm("Are you sure you want to disconnect Google Calendar for this employee?")) {
      return;
    }

    setDisconnectingId(employeeId);
    try {
      const res = await fetch("/api/auth/google/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to disconnect calendar.");
      }
    } catch {
      alert("Error disconnecting calendar.");
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div>
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team & Calendars</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your team members and connect their Google Calendars for real-time availability and automatic Meet links.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {success === "calendar_connected" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="font-medium">Google Calendar successfully connected! Real-time busy times and Google Meet generation are now active.</span>
          </div>
          <button
            onClick={() => router.replace("/admin/employees")}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => router.replace("/admin/employees")}
            className="text-red-700 hover:text-red-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Employee Cards */}
      <div className="space-y-4">
        {employees.map((emp) => {
          const initials = emp.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={emp.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-base">{initials}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">
                      {emp.name}
                    </h2>
                    {emp.isActive ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">{emp.designation}</p>
                  <p className="text-xs text-gray-500 mt-1">{emp.email}</p>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    <span>🌐 {emp.timezone}</span>
                    <span>⏱️ {emp.bufferMinutes}m buffer</span>
                    <span>📊 Max {emp.dailyMeetingLimit}/day</span>
                  </div>
                </div>
              </div>

              {/* Right: Calendar Connection Status & Action */}
              <div className="md:border-l md:border-gray-100 md:pl-6 shrink-0 flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-start lg:items-center gap-3">
                {emp.googleCalendarConnected ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Google Calendar Synced</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                        {emp.googleCalendarEmail || emp.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(emp.id)}
                      disabled={disconnectingId === emp.id}
                      className="text-xs text-gray-400 hover:text-red-600 font-medium px-2 py-1.5 transition-colors"
                    >
                      {disconnectingId === emp.id ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2">
                      <div className="flex items-center gap-1.5 font-medium text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span>Calendar Not Connected</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Using default working hours</div>
                    </div>
                    <a
                      href={`/api/auth/google/connect?employeeId=${emp.id}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-2xs"
                    >
                      <span>Connect Google Calendar</span>
                      <span>→</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
