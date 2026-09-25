"use client";

/**
 * Public Booking Landing Page + Contact Details — merged Screen 1+4
 * URL: / (or meeting.comfinity.com)
 *
 * Shows employee cards; picking one expands an inline contact-details
 * form right here instead of a separate "enter your details" page. The
 * visitor's info is carried forward as query params into the meeting
 * type + calendar page, where the booking is finalized on slot pick.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type EmployeeCard = {
  id: string;
  slug: string;
  name: string;
  designation: string;
  bio: string;
  expertiseTags: string[];
  photoUrl: string | null;
  linkedinUrl: string;
};

export default function LandingClient({ employees }: { employees: EmployeeCard[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-gray-900">Comfinity</span>
          </div>
          <span className="text-sm text-gray-400">Powered by ARMI</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Available for conversations
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Book a conversation<br className="hidden sm:block" /> with {employees.length === 1 ? employees[0].name : "our team"}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          We build technology that solves real business problems — AI, automation, and digital platforms.
          Choose a conversation topic and pick a time that works for you.
        </p>
      </section>

      {/* ── Employee Cards ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className={
            employees.length === 1
              ? "max-w-xl mx-auto"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
          }
        >
          {employees.map((employee) => (
            <EmployeeCardBlock
              key={employee.id}
              employee={employee}
              isOpen={openSlug === employee.slug}
              onToggle={() => setOpenSlug(openSlug === employee.slug ? null : employee.slug)}
            />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Comfinity Technologies ·{" "}
          <span className="text-blue-500">Powered by ARMI</span>
        </p>
      </footer>
    </div>
  );
}

function EmployeeCardBlock({
  employee,
  isOpen,
  onToggle,
}: {
  employee: EmployeeCard;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const params = new URLSearchParams({
      name: name.trim(),
      email: email.trim(),
    });
    if (company.trim()) params.set("company", company.trim());
    if (phone.trim()) params.set("phone", phone.trim());
    if (topic.trim()) params.set("topic", topic.trim());

    router.push(`/${employee.slug}?${params.toString()}`);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          {employee.photoUrl ? (
            <Image
              src={employee.photoUrl}
              alt={employee.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-semibold text-xl">{initials}</span>
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-lg leading-tight">{employee.name}</h2>
          <p className="text-sm text-blue-600 font-medium">{employee.designation}</p>
          {employee.linkedinUrl && (
            <a
              href={employee.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors mt-1 inline-block"
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{employee.bio}</p>

      {/* Expertise tags */}
      {employee.expertiseTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {employee.expertiseTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {!isOpen ? (
        <button
          onClick={onToggle}
          className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
        >
          Book with {employee.name.split(" ")[0]} →
        </button>
      ) : (
        <form onSubmit={handleContinue} className="border-t border-gray-100 pt-5 mt-1 space-y-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Enter your details to continue</p>

          <div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name *"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address *"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What would you like to discuss? (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onToggle}
              className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !email.trim()}
              className="flex-[2] text-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              Choose a time →
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
