"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("jengo:theme", next);
    } catch {
      // storage unavailable: the choice just won't persist
    }
    setTheme(next);
  };

  return (
    <button type="button" className="foot-btn" onClick={flip}>
      {theme === "dark" ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
