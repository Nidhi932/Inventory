import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { SalesPurchaseChartPanel } from "../components/GraphSection";
import "../components/GraphSection.css";
import "./Statistics.css";

const PILL_COUNT = 5;

function pillFill(rating, pillIndex) {
  return Math.min(1, Math.max(0, rating - pillIndex));
}

function formatRatingLabel(rating) {
  const r = Math.round(rating * 10) / 10;
  return Number.isInteger(r) ? `${r}` : `${r}`;
}

function TopProductsPillsPanel({ items }) {
  return (
    <section
      className="panel panel-list stats-top-products-panel"
      aria-labelledby="stats-top-products-title"
    >
      <h2
        id="stats-top-products-title"
        className="panel-title stats-top-products-heading"
      >
        Top Products
      </h2>
      {items.length === 0 ? (
        <p className="graph-section__empty">No products to show yet.</p>
      ) : (
        <ul className="stats-top-products-list">
          {items.map((row, i) => (
            <li key={`${i}-${row.name}`} className="stats-top-products-item">
              <div className="stats-top-products-name">{row.name}</div>
              <div
                className="stats-rating-pills"
                role="img"
                aria-label={`${formatRatingLabel(row.rating)} out of ${PILL_COUNT}`}
              >
                {Array.from({ length: PILL_COUNT }, (_, j) => {
                  const fill = pillFill(row.rating, j);
                  return (
                    <span key={j} className="stats-rating-pill" aria-hidden>
                      <span
                        className="stats-rating-pill__fill"
                        style={{ width: `${fill * 100}%` }}
                      />
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const CARD_DEFS = {
  revenue: {
    label: "Total Revenue",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.5">
          <path
            d="M10.9209 5.2642L10.5728 6.49219H4.05509L4.4031 5.2642H10.9209ZM7.74898 13L4.18932 8.67969L4.17938 7.71023H5.94429C6.38511 7.71023 6.75798 7.64228 7.0629 7.50639C7.36782 7.3705 7.59983 7.1733 7.75892 6.91477C7.91801 6.65294 7.99756 6.33475 7.99756 5.96023C7.99756 5.40341 7.83184 4.96094 7.5004 4.63281C7.16896 4.30469 6.65026 4.14062 5.94429 4.14062H4.05509L4.41801 2.81818H5.94429C6.76626 2.81818 7.44405 2.9491 7.97767 3.21094C8.51129 3.47277 8.90902 3.8357 9.17085 4.29972C9.43269 4.76373 9.56361 5.29901 9.56361 5.90554C9.56361 6.44579 9.45589 6.93466 9.24046 7.37216C9.02502 7.80966 8.68198 8.16596 8.21134 8.44105C7.74069 8.71615 7.12256 8.87689 6.35693 8.9233L6.31219 8.93324L9.56361 12.9155V13H7.74898ZM10.9258 2.81818L10.5728 4.05611L5.36262 4.02628L5.7156 2.81818H10.9258Z"
            fill="black"
          />
        </g>
      </svg>
    ),
    color: "#FAD85D",
  },
  sold: {
    label: "Products Sold",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.5">
          <path
            d="M13.3335 3.33325H2.66683C1.93045 3.33325 1.3335 3.93021 1.3335 4.66659V11.3333C1.3335 12.0696 1.93045 12.6666 2.66683 12.6666H13.3335C14.0699 12.6666 14.6668 12.0696 14.6668 11.3333V4.66659C14.6668 3.93021 14.0699 3.33325 13.3335 3.33325Z"
            stroke="#020617"
            stroke-width="1.33"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M1.3335 6.66675H14.6668"
            stroke="#020617"
            stroke-width="1.33"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </svg>
    ),
    color: "#0BF4C8",
  },
  stock: {
    label: "Products In Stock",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.5">
          <path
            d="M14.6668 8H12.0002L10.0002 14L6.00016 2L4.00016 8H1.3335"
            stroke="#020617"
            stroke-width="1.33"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </svg>
    ),
    color: "#F2A0FF",
  },
};

export default function Statistics() {
  const { stats, invoices, products, cardOrder, setCardOrder } = useApp();
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const topProductsForStats = useMemo(() => {
    const sorted = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6);
    if (sorted.length === 0) return [];
    const topSold = sorted[0].sold;
    return sorted.map((p) => {
      let rating = 0;
      if (topSold > 0) {
        rating = (p.sold / topSold) * PILL_COUNT;
      }
      return { name: p.name, rating };
    });
  }, [products]);

  const cardValues = {
    revenue: `₹${(stats.totalSales / 1000).toFixed(1)}k`,
    sold: stats.purchaseCount,
    stock: stats.totalItems,
  };

  const cardSubs = {
    revenue: `From ${invoices.filter((i) => i.status === "Paid").length} paid invoices`,
    sold: `Across ${stats.categories} categories`,
    stock: `${stats.lowStock} low stock alerts`,
  };

  const handleDragStart = (e, id) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOver(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragging || dragging === targetId) return;
    const newOrder = [...cardOrder];
    const fromIdx = newOrder.indexOf(dragging);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragging);
    setCardOrder(newOrder);
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="stats fade-in">
      <p className="stats-hint">Drag cards to rearrange them</p>

      <div className="stats-cards">
        {cardOrder.map((id) => (
          <div
            key={id}
            style={{ background: CARD_DEFS[id].color }}
            className={`kpi kpi--${CARD_DEFS[id].color} ${dragging === id ? "is-drag" : ""} ${dragOver === id ? "is-over" : ""}`}
            draggable
            onDragStart={(e) => handleDragStart(e, id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
          >
            <div className="stat-top">
              <p className="kpi-label">{CARD_DEFS[id].label}</p>
              <div className="kpi-ico">{CARD_DEFS[id].icon}</div>
            </div>
            <p className="kpi-val">{cardValues[id]}</p>
            <p className="kpi-sub">{cardSubs[id]}</p>
          </div>
        ))}
      </div>

      <div className="graph-section stats-graph-row">
        <SalesPurchaseChartPanel salesData={stats.salesData} />
        <TopProductsPillsPanel items={topProductsForStats} />
      </div>
    </div>
  );
}
