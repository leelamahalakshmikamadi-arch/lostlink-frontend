import { useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cloudflare-turnstile-api";

function TurnstileWidget({ onToken }) {
  const containerRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const [error, setError] = useState(() =>
    SITE_KEY ? "" : "Guest reporting is unavailable until the bot-check site key is configured."
  );

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return undefined;

    let widgetId;
    let cancelled = false;
    let script = document.getElementById(SCRIPT_ID);
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId !== undefined) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => {
          onTokenRef.current("");
          setError("Bot check failed to load. Please refresh and try again.");
        },
      });
      setError("");
    };

    if (window.turnstile) {
      render();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", () => setError("Bot check could not be loaded."));
      if (script.dataset.loaded === "true") render();
      script.addEventListener("load", () => { script.dataset.loaded = "true"; }, { once: true });
    }

    return () => {
      cancelled = true;
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  return (
    <div>
      <div ref={containerRef} />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default TurnstileWidget;
