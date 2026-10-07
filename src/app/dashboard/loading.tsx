import { LoaderCircle } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      aria-label="Loading dashboard"
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-purple-400" />
      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}
