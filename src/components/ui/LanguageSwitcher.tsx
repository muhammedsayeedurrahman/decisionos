"use client";

import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { usePillHoverAnimation } from "@/hooks/usePillHoverAnimation";

const LANGUAGES = [
  { code: "en", label: "English",  native: "English",  flag: "🇬🇧" },
  { code: "hi", label: "Hindi",    native: "हिंदी",    flag: "🇮🇳" },
  { code: "ta", label: "Tamil",    native: "தமிழ்",    flag: "🇮🇳" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

const LS_KEY = "decisionos_lang";

// Rendered twice (resting + hover-color label copies) by the pill-swap animation below.
function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.62,87.62,0,0,1-6.4,32.94l-44.7-27.49a15.92,15.92,0,0,0-6.24-2.23l-22.82-3.08a16,16,0,0,0-16,8L104,152v8H88a8,8,0,0,0-8,8v16.73A87.59,87.59,0,0,1,40,128C40,82.06,74.42,44.37,119.16,40.31l-.16.69v6.69a16,16,0,0,0,8.46,14.14l11.2,5.6a16,16,0,0,0,16.23-1L168,58v6a16,16,0,0,0,7.2,13.33L196,91.2a16.17,16.17,0,0,0,8,2.8H208l.33,8.68a15.95,15.95,0,0,0,7.14,12.92l1.79,1.17A88.78,88.78,0,0,1,216,128Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LangCode>("en");
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Real PillNav hover mechanic: circle reveal + label slide-swap ── */
  const { btnRef, circleRef, labelRef, labelHoverRef, onMouseEnter, onMouseLeave } = usePillHoverAnimation();

  /* Restore persisted language on mount */
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as LangCode | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      setSelected(saved);
    }
  }, []);

  /* ── Initial load animation: scale + fade in (matches PillNav) ── */
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "power3.easeOut" }
    );
  }, []);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (code: LangCode) => {
    setSelected(code);
    localStorage.setItem(LS_KEY, code);
    setOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === selected)!;

  return (
    <div ref={containerRef} className="relative flex-shrink-0" id="lang-switcher">
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Change language"
        className={[
          "relative flex items-center h-9 px-3.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider overflow-hidden",
          "transition-colors duration-150 cursor-pointer select-none",
          open
            ? "bg-zinc-950 dark:bg-zinc-700 text-white"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
        ].join(" ")}
      >
        {/* Pill-fill circle (GSAP-animated, same mechanic as PillNav's hover-circle) */}
        <span
          ref={circleRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 z-0"
          style={{ bottom: 0 }}
        />

        {/* Label stack: resting label slides up+out, red hover label slides up+in — same mechanic as PillNav */}
        <span className="relative inline-block leading-none">
          <span ref={labelRef} className="relative z-[2] inline-flex items-center gap-1.5 will-change-transform">
            <GlobeIcon />
            <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
            <ChevronIcon open={open} />
          </span>
          <span ref={labelHoverRef} className="absolute left-0 top-0 z-[3] inline-flex items-center gap-1.5 text-brand-red will-change-transform">
            <GlobeIcon />
            <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
            <ChevronIcon open={open} />
          </span>
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-[calc(100%+6px)] w-44 z-[200] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden"
          style={{ animation: "langDrop 0.15s ease-out forwards" }}
        >
          {/* Header label */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Interface Language
            </span>
          </div>

          {LANGUAGES.map((lang) => {
            const isActive = lang.code === selected;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 cursor-pointer",
                  isActive
                    ? "bg-zinc-950 dark:bg-zinc-800 text-white"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white",
                ].join(" ")}
              >
                {/* Flag */}
                <span className="text-base leading-none">{lang.flag}</span>

                {/* Labels */}
                <span className="flex flex-col">
                  <span className="text-[11px] font-bold leading-tight">{lang.label}</span>
                  <span
                    className={`text-[10px] leading-tight ${
                      isActive ? "text-zinc-300" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {lang.native}
                  </span>
                </span>

                {/* Active checkmark */}
                {isActive && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="ml-auto text-brand-red flex-shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

