import { useEffect, useState } from "react";

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(
    window.matchMedia?.("(display-mode: standalone)").matches ?? false
  );

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !promptEvent) return null;

  const install = async () => {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <button className="btn btn-small btn-secondary" onClick={install}>
      Install app
    </button>
  );
}
