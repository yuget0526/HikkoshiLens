"use client";

import { useUiStore } from "@/stores/uiStore";

export function Footer() {
  const toggle = useUiStore((s) => s.toggleFooter);

  return (
    <footer className="h-fit fixed bottom-0 w-fit flex align-middle p-1">
      <p className="text-gray-600 text-xs">&copy; 2025 hikkoshilens.</p>
    </footer>
  );
}
