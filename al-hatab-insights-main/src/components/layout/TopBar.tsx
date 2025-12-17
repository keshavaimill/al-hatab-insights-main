import { useState, useEffect, useCallback } from "react";
import { Calendar, RefreshCw } from "lucide-react";
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


export const TopBar = () => {
  const { t, i18n } = useTranslation();
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
    <header className="h-16 top-bar sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">AH</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">{t("topBar.title")}</h1>
            <p className="text-xs text-muted-foreground font-medium">{t("topBar.subtitle")}</p>
          </div>
        </div>

        {/* Center - Date/Time */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(currentTime)}</span>
          </div>
          <div className="font-mono text-primary text-lg font-medium">
            {formatTime(currentTime)}
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{t("common.ksa")}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="ml-2 text-xs">{t("common.lastRefresh")}: 2 {t("common.minAgo")}</span>
          </Button>
          <LanguageToggle />
        </div>

        {/* Right - Filters */}
        <div className="flex items-center gap-3">
          <Select defaultValue="7d">
            <SelectTrigger className="w-32 bg-secondary border-border">
              <SelectValue placeholder={t("common.dateRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">{t("common.last24h")}</SelectItem>
              <SelectItem value="7d">{t("common.last7days")}</SelectItem>
              <SelectItem value="30d">{t("common.last30days")}</SelectItem>
              <SelectItem value="90d">{t("common.last90days")}</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="both">
            <SelectTrigger className="w-32 bg-secondary border-border">
              <SelectValue placeholder={t("common.channel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">{t("common.retail")}</SelectItem>
              <SelectItem value="wholesale">{t("common.wholesale")}</SelectItem>
              <SelectItem value="both">{t("common.both")}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button className="filter-button active">{t("common.hourly")}</button>
            <button className="filter-button">{t("common.daily")}</button>
          </div>
        </div>
      </div>
    </header>
  );
};
