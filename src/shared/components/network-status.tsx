"use client";

import { useEffect, useState } from "react";
import { useTranslate } from "@/shared/i18n/locale-provider";

type NetworkState = "hidden" | "offline" | "online";

export function NetworkStatus() {
  const t = useTranslate();
  const [networkState, setNetworkState] = useState<NetworkState>("hidden");

  useEffect(() => {
    let hideOnlineNotice: number | undefined;
    const handleOffline = () => {
      if (hideOnlineNotice) window.clearTimeout(hideOnlineNotice);
      setNetworkState("offline");
    };
    const handleOnline = () => {
      setNetworkState("online");
      if (hideOnlineNotice) window.clearTimeout(hideOnlineNotice);
      hideOnlineNotice = window.setTimeout(() => setNetworkState("hidden"), 3200);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (hideOnlineNotice) window.clearTimeout(hideOnlineNotice);
    };
  }, []);

  if (networkState === "hidden") return null;

  const isOffline = networkState === "offline";
  return (
    <div className={`network-status-banner${isOffline ? "" : " is-online"}`} role={isOffline ? "alert" : "status"} aria-live={isOffline ? "assertive" : "polite"}>
      <span className="network-status-dot" aria-hidden="true" />
      <div className="network-status-copy">
        <strong>{t(isOffline ? "Sin conexión" : "Conexión restablecida")}</strong>
        <span>{t(isOffline ? "Se interrumpió la conexión. Conserva lo que escribiste; las acciones que requieran internet no se completarán hasta que vuelva." : "Tu dispositivo volvió a conectarse. Puedes volver a intentar la acción que falló.")}</span>
      </div>
    </div>
  );
}
