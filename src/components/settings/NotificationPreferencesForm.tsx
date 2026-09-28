"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreferences } from "@/actions/profile";

export default function NotificationPreferencesForm({
  initialPushEnabled,
}: {
  initialPushEnabled: boolean;
}) {
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (checked: boolean) => {
    setPushEnabled(checked);
    setError(null);

    const formData = new FormData();
    if (checked) {
      formData.set("pushEnabled", "on");
    }

    startTransition(async () => {
      const result = await updateNotificationPreferences({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        setPushEnabled(!checked);
      }
    });
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg text-left">
      <label className="flex items-center justify-between py-2.5">
        <span className="text-sm text-slate-700">푸시 알림 받기</span>
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={isPending}
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
      </label>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
