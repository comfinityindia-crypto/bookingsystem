"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Inline "Change time" control for an upcoming booking.
 * `currentLocal` is the current start as "YYYY-MM-DDTHH:mm" in the employee's timezone.
 */
export default function ChangeTimeButton({
  bookingId,
  currentLocal,
  timezone,
}: {
  bookingId: string;
  currentLocal: string;
  timezone: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentLocal);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!value || value === currentLocal) return;
    if (!confirm("Change the meeting time? The visitor will be emailed about the new time.")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStart: value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "Failed to change the meeting time.");
        return;
      }
      if (json.emailSent === false) {
        alert("Time changed, but the email to the visitor failed to send.");
      }
      setOpen(false);
      router.refresh();
    } catch {
      alert("Error changing the meeting time.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
      >
        <span>🕒</span>
        <span>Change time</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="datetime-local"
        step={1800}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
      />
      <span className="text-[11px] text-gray-400">{timezone}</span>
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={saving || value === currentLocal}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg"
        >
          {saving ? "Saving…" : "Save & notify"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setValue(currentLocal);
          }}
          disabled={saving}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
