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
import "./GraphSection.css";

function SalesPurchaseChart({ data }) {
  const chartData = useMemo(() => {
    return (data || []).map((d) => ({
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

export function SalesPurchaseChartPanel({ salesData = [] }) {
  return (
    <section
      className="panel panel-chart chart-shadow"
      aria-labelledby="sales-purchase-chart-title"
    >
      <div className="chart-head">
        <h2 id="sales-purchase-chart-title" className="panel-title tight">
          Sales &amp; Purchase
        </h2>
        <div className="chart-toolbar">
          <button type="button" className="chart-btn">
            Weekly
          </button>
        </div>
      </div>
      <div className="chart-body">
        <SalesPurchaseChart data={salesData} />
      </div>
    </section>
  );
}
