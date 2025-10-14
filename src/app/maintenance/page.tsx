import { getMaintenanceStatus } from "@/lib/maintenance-utils";
import RoofCalcLogo from "@/components/RoofCalcLogo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function MaintenancePage() {
  const settings = await getMaintenanceStatus();

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <RoofCalcLogo className="h-16 w-16 text-primary" size={64} />
        </div>

        {/* Maintenance Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg
                className="w-10 h-10 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            System Under Maintenance
          </h1>

          {/* Message */}
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            {settings.maintenanceMessage ||
              "We're performing scheduled maintenance to improve your experience. Please check back soon."}
          </p>

          {/* Scheduled End Time */}
          {settings.maintenanceScheduledEnd && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Expected completion:
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatDate(settings.maintenanceScheduledEnd)}
              </p>
            </div>
          )}

          {/* Info */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We apologize for any inconvenience. Our team is working hard to
              restore service as quickly as possible.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} RoofCal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

