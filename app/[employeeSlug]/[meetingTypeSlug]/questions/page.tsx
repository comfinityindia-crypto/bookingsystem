"use client";

import { useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function QuestionsRedirect({
  params: paramsPromise,
}: {
  params: Promise<{ employeeSlug: string; meetingTypeSlug: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(
      `/${params.employeeSlug}/${params.meetingTypeSlug}/book${qs ? `?${qs}` : ""}`
    );
  }, [params, router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
