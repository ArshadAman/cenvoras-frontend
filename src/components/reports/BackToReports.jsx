import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function BackToReports() {
  return (
    <Link
      to="/reports"
      className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group mb-6"
    >
      <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" />
      </span>
      <span className="flex items-center gap-1.5">
        <ChartBarIcon className="w-3.5 h-3.5" />
        Back to Reports
      </span>
    </Link>
  );
}
