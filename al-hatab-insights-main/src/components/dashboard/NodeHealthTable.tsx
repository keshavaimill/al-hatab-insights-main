import { memo, useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { nodes as fallbackNodes } from "@/lib/mockData";
import { Factory, Warehouse, Store, AlertTriangle, Loader2 } from "lucide-react";
import { fetchNodeHealth, type NodeHealth } from "@/api/nodeHealth";

interface NodeHealthTableProps {
  onNodeClick?: (nodeId: number) => void;
}

export const NodeHealthTable = memo(function NodeHealthTable({ onNodeClick }: NodeHealthTableProps) {
  const { t } = useTranslation();
  const [nodeHealth, setNodeHealth] = useState<NodeHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadNodeHealth = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNodeHealth();
        if (!cancelled) {
          setNodeHealth(data);
        }
      } catch (error) {
        console.error("Failed to load node health from backend, using fallback mock data.", error);
        if (!cancelled) {
          // Convert mock nodes to NodeHealth format
          const mockHealth: NodeHealth[] = fallbackNodes.map((node) => ({
            node_id: node.id.toString(),
            name: node.name,
            type: node.type as "Factory" | "DC" | "Store",
            service_level: node.serviceLevel,
            waste_pct: node.waste,
            mape: node.mape,
            alerts: node.alerts,
            status: node.status as "good" | "warning" | "danger",
          }));
          setNodeHealth(mockHealth);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadNodeHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Factory":
        return <Factory className="w-4 h-4" />;
      case "DC":
        return <Warehouse className="w-4 h-4" />;
      case "Store":
        return <Store className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      good: "bg-success/20 text-success",
      warning: "bg-warning/20 text-warning",
      danger: "bg-destructive/20 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const getNodeDisplayName = (nodeId: string, nodeName: string) => {
    // Try to get translation by node_id first
    const translationKey = `common.nodeNames.${nodeId}`;
    const translated = t(translationKey, { defaultValue: nodeName });
    // If translation exists (returned value is different from the key), use it
    // Otherwise, use the defaultValue (original nodeName) or fallback to nodeName
    return translated !== translationKey ? translated : nodeName;
  };

  const mappedNodes = useMemo(() => nodeHealth, [nodeHealth]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden w-full">
      <div className="p-3 sm:p-4 border-b border-border">
        <h3 className="font-semibold text-sm sm:text-base">{t("pages.commandCenter.nodeHealthSummary")}</h3>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="data-table w-full min-w-[600px]">
          <thead>
            <tr>
              <th>{t("pages.commandCenter.node")}</th>
              <th>{t("pages.commandCenter.type")}</th>
              <th>{t("pages.commandCenter.serviceLevel")}</th>
              <th>{t("pages.commandCenter.waste")}</th>
              <th>{t("pages.commandCenter.mape")}</th>
              <th>{t("pages.commandCenter.alerts")}</th>
              <th>{t("pages.commandCenter.status")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("common.loading")}</span>
                  </div>
                </td>
              </tr>
            ) : mappedNodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("common.noDataAvailable")}
                </td>
              </tr>
            ) : (
              mappedNodes.map((node) => (
                <tr key={node.node_id} onClick={() => onNodeClick?.(parseInt(node.node_id))}>
                  <td className="font-medium">{getNodeDisplayName(node.node_id, node.name)}</td>
                  <td>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getTypeIcon(node.type)}
                      <span>{t(`common.nodeType.${node.type.toLowerCase()}`)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={node.service_level >= 95 ? "text-success" : node.service_level >= 90 ? "text-warning" : "text-destructive"}>
                      {node.service_level}%
                    </span>
                  </td>
                  <td>
                    <span className={node.waste_pct <= 2 ? "text-success" : node.waste_pct <= 4 ? "text-warning" : "text-destructive"}>
                      {node.waste_pct}%
                    </span>
                  </td>
                  <td>
                    <span className={node.mape <= 5 ? "text-success" : node.mape <= 7 ? "text-warning" : "text-destructive"}>
                      {node.mape}%
                    </span>
                  </td>
                  <td>
                    {node.alerts > 0 ? (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{node.alerts}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(node.status)}`}>
                      {t(`status.${node.status}`)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
