import React, { useEffect, useRef, useState, useMemo } from "react";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { themes } from "@/constants/Themes";
import { Palette, Check, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/core/components/ui/button";

interface ThemeSelectorProps {
  openThemeSelector?: boolean;
  setOpenThemeSelector?: (open: boolean) => void;
  variant?: "dropdown" | "inline";
  className?: string;
}

const THEME_STORAGE_KEY = "chat-app-theme";
const DEFAULT_THEME = "light";

export function ThemeSelector({
  openThemeSelector: controlledOpen,
  setOpenThemeSelector: controlledSetOpen,
  variant = "dropdown",
  className = "",
}: ThemeSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(THEME_STORAGE_KEY) ||
        document.documentElement.getAttribute("data-theme") ||
        DEFAULT_THEME
      );
    }
    return DEFAULT_THEME;
  });

  const isControlled = controlledOpen !== undefined && controlledSetOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledSetOpen : setInternalOpen;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    document.documentElement.setAttribute("data-theme", savedTheme);
    setCurrentTheme(savedTheme);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (variant === "inline" || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen, variant]);

  const changeTheme = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    setCurrentTheme(theme);
    if (variant === "dropdown") {
      setIsOpen(false);
    }
  };

  const filteredThemes = useMemo(() => {
    if (!searchQuery.trim()) return themes;
    const query = searchQuery.toLowerCase().trim();
    return themes.filter((t) => t.toLowerCase().includes(query));
  }, [searchQuery]);

  // Render inline version (e.g. for settings / profile modal)
  if (variant === "inline") {
    return (
      <div className={`w-full flex flex-col gap-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-base-content">Interface Theme</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold capitalize border border-primary/20">
            {currentTheme}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-base-content/40" />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-base-300 bg-base-200/60 focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base-content transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-base-content/40 hover:text-base-content"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <ScrollArea className="h-48 w-full rounded-xl border border-base-300 bg-base-200/40 p-2">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {filteredThemes.map((theme) => {
              const isSelected = currentTheme === theme;
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => changeTheme(theme)}
                  className={`group flex items-center justify-between rounded-lg p-2 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-content shadow-sm ring-2 ring-primary ring-offset-1"
                      : "bg-base-100 text-base-content hover:bg-base-200 border border-base-300"
                  }`}
                >
                  <span className="truncate capitalize">{theme}</span>
                  <div
                    data-theme={theme}
                    className="flex shrink-0 items-center gap-0.5 rounded-md p-1 bg-base-100 border border-base-content/10"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="h-2 w-2 rounded-full bg-secondary" />
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                </button>
              );
            })}
            {filteredThemes.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-base-content/40">
                No themes match &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Render popover dropdown version
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-2 rounded-xl border-base-300 transition-all ${
          isOpen
            ? "bg-base-200 ring-2 ring-primary/20 border-primary text-primary"
            : "hover:bg-base-200 text-base-content"
        }`}
        title={`Change Theme (Current: ${currentTheme})`}
        aria-label="Change Theme"
      >
        <Palette className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline-block text-xs font-semibold capitalize max-w-[80px] truncate text-base-content">
          {currentTheme}
        </span>
        <div
          data-theme={currentTheme}
          className="hidden md:flex items-center gap-0.5 rounded-full p-0.5 bg-base-100 border border-base-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </div>
      </Button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-base-300 bg-base-100/95 backdrop-blur-md p-3 shadow-2xl shadow-black/20 ring-1 ring-black/5 z-50 animate-fade-in-down text-base-content">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-base-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-base-content">
                Themes ({themes.length})
              </h4>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
              {currentTheme}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative my-2.5">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-base-content/40" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search 35+ themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-base-300 bg-base-200/70 focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base-content placeholder:text-base-content/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-base-content/40 hover:text-base-content"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Themes List */}
          <ScrollArea className="h-64 w-full pr-1">
            <div className="grid grid-cols-1 gap-1">
              {filteredThemes.map((theme) => {
                const isSelected = currentTheme === theme;
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => changeTheme(theme)}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? "bg-primary/15 text-primary font-bold border border-primary/30"
                        : "hover:bg-base-200/80 text-base-content font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-base-300 group-hover:border-primary/50 shrink-0" />
                      )}
                      <span className="capitalize">{theme}</span>
                    </div>

                    {/* DaisyUI theme swatch preview */}
                    <div
                      data-theme={theme}
                      className="flex shrink-0 items-center gap-1 rounded-lg p-1 bg-base-100 border border-base-content/10 shadow-xs"
                      title={`${theme} color preview`}
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      <span className="h-2 w-2 rounded-full bg-neutral" />
                    </div>
                  </button>
                );
              })}

              {filteredThemes.length === 0 && (
                <div className="py-8 text-center text-xs text-base-content/40">
                  No themes found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;