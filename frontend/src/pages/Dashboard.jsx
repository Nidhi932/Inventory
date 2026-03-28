import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import "./Dashboard.css";
import "../components/GraphSection.css";
import {
  SalesIcon,
  RevenueIcon,
  PurchaseIcon,
  GrowthIcon,
  CostIcon,
  CancelIcon,
  CategoryIcon,
  InStockIcon,
  OrdersIcon,
  SupplierIcon,
} from "../../public/assets/Icons";

function formatMoney(n) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function StatMetric({ icon, label, children }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <p className="stat-value">{children}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

function SalesPurchaseChart({ data }) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      name: d.month,
      purchase: d.purchase,
      sales: d.sales,
    }));
  }, [data]);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          barGap={8}
          barCategoryGap="40%"
          margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(v) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
            }
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              `₹${Number(value).toLocaleString("en-IN")}`,
              name,
            ]}
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Legend wrapperStyle={{ paddingTop: 12 }} iconType="circle" />
          <Bar
            dataKey="purchase"
            name="Purchase"
            fill="#60a5fa"
            radius={[5, 5, 0, 0]}
            barSize={10}
          />
          <Bar
            dataKey="sales"
            name="Sales"
            fill="#34d399"
            radius={[5, 5, 0, 0]}
            barSize={10}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { stats, products, invoices } = useApp();

  const metrics = useMemo(() => {
    const totalSalesAmt = stats.totalSales;
    const totalCost = stats.totalPurchase;
    const profit = Math.max(0, Math.round(totalSalesAmt - totalCost * 0.85));
    const unitsSold = stats.purchaseCount;
    const supplierCount = new Set(invoices.map((i) => i.customer)).size;
    const toReceive = Math.min(500, stats.lowStock * 45 + 120);
    const unpaid = invoices.filter((i) => i.status === "Unpaid").length;
    const returnAmt = Math.round(totalCost * 0.12);

    return {
      salesCount: unitsSold,
      revenue: totalSalesAmt,
      profit,
      cost: totalCost,
      inStock: stats.totalItems,
      toReceive,
      purchaseOrders: invoices.length,
      purchaseCost: Math.round(totalCost * 0.78),
      cancelCount: unpaid,
      returnAmt,
      suppliers: Math.max(supplierCount, 1),
      categories: stats.categories,
    };
  }, [stats, invoices]);

  const topProductNames = useMemo(() => {
    return [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6)
      .map((p) => p.name);
  }, [products]);

  return (
    <div className="dashboard fade-in">
      <div className="summary-grid">
        <section className="panel" aria-labelledby="sales-overview">
          <h2 id="sales-overview" className="panel-title">
            Sales Overview
          </h2>
          <div className="metrics cols-4">
            <StatMetric icon={<SalesIcon />} label="Sales">
              {metrics.salesCount.toLocaleString("en-IN")}
            </StatMetric>
            <StatMetric icon={<RevenueIcon />} label="Revenue">
              {formatMoney(metrics.revenue)}
            </StatMetric>
            <StatMetric icon={<GrowthIcon />} label="Profit">
              {formatMoney(metrics.profit)}
            </StatMetric>
            <StatMetric icon={<CostIcon />} label="Cost">
              {formatMoney(metrics.cost)}
            </StatMetric>
          </div>
        </section>

        <section className="panel" aria-labelledby="inv-summary">
          <h2 id="inv-summary" className="panel-title">
            Inventory Summary
          </h2>
          <div className="metrics cols-2">
            <StatMetric icon={<InStockIcon />} label="In Stock">
              {metrics.inStock.toLocaleString("en-IN")}
            </StatMetric>
            <StatMetric icon={<OrdersIcon />} label="To be received">
              {metrics.toReceive.toLocaleString("en-IN")}
            </StatMetric>
          </div>
        </section>

        <section className="panel" aria-labelledby="purchase-overview">
          <h2 id="purchase-overview" className="panel-title">
            Purchase Overview
          </h2>
          <div className="metrics cols-4">
            <StatMetric icon={<PurchaseIcon />} label="Purchase">
              {metrics.purchaseOrders.toLocaleString("en-IN")}
            </StatMetric>
            <StatMetric icon={<CostIcon color="#FAD85D" />} label="Cost">
              {formatMoney(metrics.purchaseCost)}
            </StatMetric>
            <StatMetric icon={<CancelIcon />} label="Cancel">
              {metrics.cancelCount}
            </StatMetric>
            <StatMetric icon={<GrowthIcon color="#F2A0FF" />} label="Return">
              {formatMoney(metrics.returnAmt)}
            </StatMetric>
          </div>
        </section>

        <section className="panel" aria-labelledby="product-summary">
          <h2 id="product-summary" className="panel-title">
            Product Summary
          </h2>
          <div className="metrics cols-2">
            <StatMetric icon={<SupplierIcon />} label="Number of Suppliers">
              {metrics.suppliers}
            </StatMetric>
            <StatMetric icon={<CategoryIcon />} label="Number of Categories">
              {metrics.categories}
            </StatMetric>
          </div>
        </section>
      </div>

      <div className="graph-section">
        <section
          className="panel panel-chart chart-shadow"
          aria-labelledby="chart-title"
        >
          <div className="chart-head">
            <h2 id="chart-title" className="panel-title tight">
              Sales &amp; Purchase
            </h2>
            <div className="chart-toolbar">
              <button type="button" className="chart-btn">
                Weekly
              </button>
            </div>
          </div>
          <div className="chart-body">
            <SalesPurchaseChart data={stats.salesData} />
          </div>
        </section>

        <section
          className="panel panel-list"
          aria-labelledby="top-products-title"
        >
          <h2 id="top-products-title" className="panel-title">
            Top Products
          </h2>
          <ul className="rank-list">
            {topProductNames.map((name) => (
              <li key={name} className="rank-item">
                {name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
