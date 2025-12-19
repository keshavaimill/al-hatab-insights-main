import { useState, useEffect, useCallback } from "react";
import { Calendar, RefreshCw, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageToggle } from "./LanguageToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Riyadh",
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Riyadh",
    });

  return (
    <header className="h-14 sm:h-16 top-bar sticky top-0 z-50">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2">
        {/* Logo & Menu */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {isMobile && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="h-9 w-9 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm sm:text-lg">AH</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-foreground tracking-tight truncate">{t("topBar.title")}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate hidden sm:block">{t("topBar.subtitle")}</p>
          </div>
        </div>

        {/* Center - Date/Time (Hidden on mobile, shown on tablet+) */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4 text-xs lg:text-sm shrink-0">
          <div className="flex items-center gap-1 lg:gap-2 text-muted-foreground">
            <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="whitespace-nowrap">{formatDate(currentTime)}</span>
          </div>
          <div className="font-mono text-primary text-sm lg:text-lg font-medium whitespace-nowrap">
            {formatTime(currentTime)}
          </div>
          <span className="text-[10px] lg:text-xs text-muted-foreground bg-secondary px-1.5 lg:px-2 py-0.5 rounded whitespace-nowrap">{t("common.ksa")}</span>
        </div>

        {/* Mobile: Time only */}
        {isMobile && (
          <div className="flex items-center gap-1 text-xs shrink-0">
            <div className="font-mono text-primary font-medium whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>
        )}

        {/* Right - Actions & Filters */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
          {/* Refresh Button - Hidden on mobile */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-muted-foreground hover:text-foreground hidden lg:flex"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="ml-2 text-xs">{t("common.lastRefresh")}: 2 {t("common.minAgo")}</span>
            </Button>
          )}

          {/* Filters - Dropdown on mobile, inline on desktop */}
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Calendar className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="p-2 space-y-2">
                  <div className="text-xs font-medium px-2">{t("common.dateRange")}</div>
                  <Select defaultValue="7d">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">{t("common.last24h")}</SelectItem>
                      <SelectItem value="7d">{t("common.last7days")} ({t("common.recommended")})</SelectItem>
                      <SelectItem value="30d">{t("common.last30days")}</SelectItem>
                      <SelectItem value="90d">{t("common.last90days")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs font-medium px-2 pt-2">{t("common.channel")}</div>
                  <Select defaultValue="both">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">{t("common.retail")}</SelectItem>
                      <SelectItem value="wholesale">{t("common.wholesale")}</SelectItem>
                      <SelectItem value="both">{t("common.both")} ({t("common.recommended")})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Select defaultValue="7d">
                <SelectTrigger className="w-28 lg:w-32 bg-secondary border-border text-xs lg:text-sm">
                  <SelectValue placeholder={t("common.dateRange")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">{t("common.last24h")}</SelectItem>
                  <SelectItem value="7d">{t("common.last7days")} ({t("common.recommended")})</SelectItem>
                  <SelectItem value="30d">{t("common.last30days")}</SelectItem>
                  <SelectItem value="90d">{t("common.last90days")}</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="both">
                <SelectTrigger className="w-28 lg:w-32 bg-secondary border-border text-xs lg:text-sm">
                  <SelectValue placeholder={t("common.channel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">{t("common.retail")}</SelectItem>
                  <SelectItem value="wholesale">{t("common.wholesale")}</SelectItem>
                  <SelectItem value="both">{t("common.both")} ({t("common.recommended")})</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden lg:flex items-center bg-secondary rounded-lg p-1">
                <button className="filter-button active text-xs">{t("common.hourly")}</button>
                <button className="filter-button text-xs">{t("common.daily")}</button>
              </div>
            </>
          )}

          <LanguageToggle />
        </div>
      </div>
    </header>
  );
};
