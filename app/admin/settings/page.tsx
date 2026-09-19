import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            General organization preferences, scheduling defaults, and company branding.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Organization Information */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Company & Branding
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                disabled
                defaultValue="Comfinity Technologies"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Public Booking Domain / Slug
              </label>
              <input
                type="text"
                disabled
                defaultValue="meeting.comfinity.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Scheduling Defaults */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Default Scheduling Rules
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900">Default Buffer Time</div>
                <div className="text-xs text-gray-500">
                  Minimum break reserved between consecutive meetings
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                15 Minutes
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900">Default Daily Limit</div>
                <div className="text-xs text-gray-500">
                  Maximum conversations an employee can host per day
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                4 Meetings / Day
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold text-gray-900">Primary Timezone</div>
                <div className="text-xs text-gray-500">
                  Default timezone applied to employee working hours
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                Asia/Kolkata (IST)
              </span>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            System Connections
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <div className="font-semibold text-gray-900">Google Calendar & Meet</div>
                  <div className="text-xs text-gray-500">
                    Two-way FreeBusy availability checking and video call creation
                  </div>
                </div>
              </div>
              <Link
                href="/admin/employees"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Manage Team Sync →
              </Link>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="font-semibold text-gray-900">Email Delivery</div>
                  <div className="text-xs text-gray-500">
                    Automated calendar invitations and notification dispatches via Resend
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
