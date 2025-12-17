import { NavLink } from "@/components/NavLink";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Factory,
  Warehouse,
  Store,
  Settings,
  BarChart3,
  Bell,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, key: "commandCenter" },
  { to: "/factory", icon: Factory, key: "factory" },
  { to: "/dc", icon: Warehouse, key: "distributionCenter" },
  { to: "/store", icon: Store, key: "storeOperations" },
];

export const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-2">
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 mb-3">
            {t("sidebar.operations")}
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="nav-item"
              activeClassName="active"
            >
              <item.icon className="w-5 h-5" />
              <span>{t(`sidebar.${item.key}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="status-dot good" />
            <span className="text-sm font-medium">{t("sidebar.systemHealthy")}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("sidebar.allServicesOperational")}
          </p>
        </div>
      </div>
    </aside>
  );
};
