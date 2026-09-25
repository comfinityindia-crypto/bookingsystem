"use client";

/**
 * Legacy calendar URL redirect
 * URL: /[employeeSlug]/[meetingTypeSlug]
 *
 * The meeting-type selection and calendar/slot picker were merged into
 * the employee page (Screen 2+3). This route now just forwards old links
 * there, preselecting the meeting type.
 */

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function LegacyMeetingTypeRedirect({
  params: paramsPromise,
}: {
  params: Promise<{ employeeSlug: string; meetingTypeSlug: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${params.employeeSlug}?meetingType=${params.meetingTypeSlug}`);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
