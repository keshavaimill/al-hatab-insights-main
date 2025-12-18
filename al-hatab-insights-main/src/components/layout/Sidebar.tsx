import { NavLink } from "@/components/NavLink";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Factory,
  Warehouse,
  Store,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, key: "commandCenter" },
  { to: "/factory", icon: Factory, key: "factory" },
  { to: "/dc", icon: Warehouse, key: "distributionCenter" },
  { to: "/store", icon: Store, key: "storeOperations" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col">
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        <div className="mb-4 sm:mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 sm:px-4 mb-2 sm:mb-3">
            {t("sidebar.operations")}
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="nav-item"
              activeClassName="active"
              onClick={onNavigate}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate text-sm sm:text-base">{t(`sidebar.${item.key}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* System Status */}
      <div className="p-3 sm:p-4 border-t border-sidebar-border shrink-0">
        <div className="bg-secondary/50 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <div className="status-dot good shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{t("sidebar.systemHealthy")}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
            {t("sidebar.allServicesOperational")}
          </p>
        </div>
      </div>
    </div>
  );
};
