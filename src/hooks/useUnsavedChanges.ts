"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isBypassed, setIsBypassed] = useState(false);

  // 1. Native browser reload / close tab (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isBypassed) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isBypassed]);

  // 2. Intercept link click in document
  useEffect(() => {
    if (!isDirty || isBypassed) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Don't intercept anchor links (#), javascript links, or target="_blank"
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || targetAttr === "_blank") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setPendingUrl(href);
      setPendingAction(null);
      setShowModal(true);
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, [isDirty, isBypassed]);

  // Helper to check before performing custom actions (like closing a modal)
  const confirmIfDirty = useCallback(
    (onProceed: () => void) => {
      if (isDirty && !isBypassed) {
        setPendingAction(() => onProceed);
        setPendingUrl(null);
        setShowModal(true);
      } else {
        onProceed();
      }
    },
    [isDirty, isBypassed]
  );

  const confirmLeave = useCallback(() => {
    setShowModal(false);
    setIsBypassed(true); // Disable beforeunload & link intercept for this navigation

    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    } else if (pendingUrl) {
      let url = pendingUrl;

      // Strip locale prefix if present (e.g. /vi/coordinator/dashboard -> /coordinator/dashboard)
      // Because next-intl's router.push automatically prepends locale!
      if (url.startsWith("/vi/")) {
        url = url.replace(/^\/vi/, "");
      } else if (url.startsWith("/en/")) {
        url = url.replace(/^\/en/, "");
      }
      if (!url) url = "/";

      setPendingUrl(null);
      router.push(url);
    }
  }, [pendingAction, pendingUrl, router]);

  const cancelStay = useCallback(() => {
    setShowModal(false);
    setPendingUrl(null);
    setPendingAction(null);
  }, []);

  return {
    showModal,
    confirmLeave,
    cancelStay,
    confirmIfDirty,
  };
}

