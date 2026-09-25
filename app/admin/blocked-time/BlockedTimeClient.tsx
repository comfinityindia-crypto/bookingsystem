"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlockItem {
  id: string;
  reason: string | null;
  label: string;
}

interface EmployeeItem {
  id: string;
  name: string;
  timezone: string;
  blocks: BlockItem[];
}

export default function BlockedTimeClient({ employees }: { employees: EmployeeItem[] }) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const selected = employees.find((e) => e.id === employeeId);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    if (end <= start) {
      alert("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/blocked-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, start, end, reason: reason || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "Failed to block time.");
        return;
      }
      setStart("");
      setEnd("");
      setReason("");
      router.refresh();
    } catch {
      alert("Error blocking time.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this blocked time? Those slots will be bookable again.")) return;
    setRemovingId(id);
    try {
      const res = await fetch(`/api/admin/blocked-times?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Failed to remove blocked time.");
        return;
      }
      router.refresh();
    } catch {
      alert("Error removing blocked time.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Blocked Time</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mark times when you are not available. Visitors will not see these slots while booking.
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">
          No active team members found.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Add form */}
          <form
            onSubmit={handleAdd}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 h-fit"
          >
            <h2 className="font-semibold text-gray-900">Block a time</h2>

            {employees.length > 1 && (
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Team member</span>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-gray-600">From</span>
              <input
                type="datetime-local"
                required
                step={1800}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">To</span>
              <input
                type="datetime-local"
                required
                step={1800}
                value={end}
                min={start || undefined}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Reason (optional, only you see this)</span>
              <input
                type="text"
                maxLength={200}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Client visit"
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </label>

            <p className="text-[11px] text-gray-400">Times are in {selected?.timezone}.</p>

            <button
              type="submit"
              disabled={saving || !employeeId}
              className="w-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2.5 rounded-xl"
            >
              {saving ? "Saving…" : "Block this time"}
            </button>
          </form>

          {/* Upcoming blocks */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Upcoming blocked times{employees.length > 1 && selected ? ` · ${selected.name}` : ""}
              </h2>
            </div>
            {!selected || selected.blocks.length === 0 ? (
              <div className="text-center py-12 px-6 text-sm text-gray-500">
                Nothing blocked. All working hours are open for booking.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {selected.blocks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{b.label}</div>
                      {b.reason && <div className="text-xs text-gray-500 mt-0.5">{b.reason}</div>}
                    </div>
                    <button
                      onClick={() => handleRemove(b.id)}
                      disabled={removingId === b.id}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {removingId === b.id ? "Removing…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
