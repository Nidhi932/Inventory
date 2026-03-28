import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./Products.css";

const PAGE_SIZE = 9;

function availabilityClass(status) {
  if (status === "In Stock") return "avail avail-in";
  if (status === "Low Stock") return "avail avail-low";
  return "avail avail-out";
}

function availabilityText(status) {
  if (status === "In Stock") return "In stock";
  if (status === "Low Stock") return "Low stock";
  return "Out of stock";
}

function FolderUploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M12 24h12l4-6h24v36H12V24z"
        stroke="#2b2b36"
        strokeWidth="2"
        fill="#f4f5f7"
      />
      <path d="M28 36h8v-6l10 10-10 10v-6h-8v-8z" fill="#2b2b36" />
    </svg>
  );
}

function ChoiceModal({ onClose, onIndividual, onMultiple }) {
  return (
    <div
      className="modal-bg modal-bg-blur"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-box modal-choice"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="choice-title"
      >
        <h2 id="choice-title" className="visually-hidden">
          Add product type
        </h2>
        <button type="button" className="modal-pick" onClick={onIndividual}>
          individual product
        </button>
        <button type="button" className="modal-pick" onClick={onMultiple}>
          Multiple product
        </button>
      </div>
    </div>
  );
}

function BuyModal({ product, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  if (!product) return null;

  function submit() {
    const n = Number(qty);
    if (!Number.isFinite(n) || n < 1) {
      setError("Enter a quantity of at least 1.");
      return;
    }
    if (n > product.quantity) {
      setError(`Only ${product.quantity} ${product.unit || "units"} in stock.`);
      return;
    }
    setError("");
    onConfirm(product, n);
  }

  return (
    <div
      className="modal-bg modal-bg-blur"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-box modal-csv"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="buy-title"
      >
        <div className="csv-head">
          <div>
            <h2 id="buy-title" className="csv-title">
              Buy / simulate sale
            </h2>
            <p className="csv-sub">{product.name}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ padding: "0 8px 16px" }}>
          <label className="pform-pair" style={{ display: "block" }}>
            <span className="pform-label">Quantity</span>
            <input
              type="number"
              min={1}
              max={product.quantity}
              className="pform-input"
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                setError("");
              }}
            />
          </label>
          {error ? (
            <p className="pform-err" style={{ marginTop: 8 }}>
              {error}
            </p>
          ) : null}
        </div>
        <div className="csv-foot">
          <button type="button" className="csv-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="csv-upload" onClick={submit}>
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function CsvModal({ onClose, onUpload, error }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  function pickFile(f) {
    if (f) setFile(f);
  }

  function removeFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      className="modal-bg modal-bg-blur"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-box modal-csv"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="csv-title"
      >
        <div className="csv-head">
          <div>
            <h2 id="csv-title" className="csv-title">
              CSV Upload
            </h2>
            <p className="csv-sub">Add your documents here</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          className="csv-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickFile(e.dataTransfer.files?.[0]);
          }}
        >
          <FolderUploadIcon />
          <p className="csv-hint">Drag your file(s) to start uploading</p>
          <div className="csv-or">
            <span />
            <span>OR</span>
            <span />
          </div>
          <button
            type="button"
            className="csv-browse"
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>

        {file ? (
          <div className="csv-file">
            <span className="csv-file-icon">CSV</span>
            <div className="csv-file-meta">
              <span className="csv-file-name">{file.name}</span>
              <span className="csv-file-size">
                {(file.size / (1024 * 1024)).toFixed(1)}MB
              </span>
            </div>
            <button
              type="button"
              className="csv-file-remove"
              onClick={removeFile}
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="csv-err" role="alert">
            {error}
          </p>
        ) : null}

        <div className="csv-foot">
          <button type="button" className="csv-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="csv-upload"
            disabled={!file}
            onClick={() => onUpload(file)}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const { products, fetchProducts, addProductsBulk, buyProduct, user } =
    useApp();
  const { productSearch } = useOutletContext();
  const search = productSearch ?? "";
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [buyTarget, setBuyTarget] = useState(null);
  const [csvError, setCsvError] = useState("");

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, user, fetchProducts]);

  const stats = useMemo(() => {
    if (!products.length) {
      return {
        categories: 0,
        total: 0,
        revenue: 0,
        topSellingCount: 0,
        low: 0,
        notInStock: 0,
        topRevenue: 0,
      };
    }
    const categories = new Set(products.map((p) => p.category)).size;
    const total = products.length;
    const revenue = products.reduce((s, p) => s + p.price * p.quantity, 0);
    const topSellingCount = products.filter((p) => p.sold >= 150).length;
    const low = products.filter((p) => p.status === "Low Stock").length;
    const notInStock = products.filter(
      (p) => p.status === "Out of Stock",
    ).length;
    const best = products.reduce((a, b) =>
      a.sold * a.price > b.sold * b.price ? a : b,
    );
    const topRevenue = Math.round((best.sold * best.price) / 1000);
    return {
      categories,
      total,
      revenue,
      topSellingCount,
      low,
      notInStock,
      topRevenue,
    };
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageSafe = Math.min(page, totalPages);
  const paginated = products.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  async function handleCsvUpload(file) {
    if (!file) return;
    setCsvError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          setCsvError("CSV needs a header row and at least one data row.");
          return;
        }
        const header = lines[0]
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, "").toLowerCase());
        const idx = (name) => header.indexOf(name);

        const nameCol = idx("name");
        const catCol = idx("category");
        const priceCol = idx("price");
        const qtyCol = idx("quantity");
        if (nameCol < 0 || catCol < 0 || priceCol < 0 || qtyCol < 0) {
          setCsvError(
            "Header must include columns: name, category, price, quantity (add optional: customid, unit, expirydate, threshold).",
          );
          return;
        }

        const customIdCol = idx("customid");
        const unitCol = idx("unit");
        const expCol = idx("expirydate");
        const thrCol = idx("threshold");

        const batch = [];
        const errors = [];

        for (let row = 1; row < lines.length; row++) {
          const cols = lines[row]
            .split(",")
            .map((c) => c.trim().replace(/^"|"$/g, ""));
          const name = cols[nameCol];
          const category = cols[catCol];
          const price = Number(cols[priceCol]);
          const quantity = Number(cols[qtyCol]);
          if (!name) {
            errors.push(`Row ${row + 1}: missing product name.`);
            continue;
          }
          if (!category) {
            errors.push(`Row ${row + 1}: missing category.`);
            continue;
          }
          if (Number.isNaN(price) || price < 0) {
            errors.push(`Row ${row + 1}: invalid price.`);
            continue;
          }
          if (Number.isNaN(quantity) || quantity < 0) {
            errors.push(`Row ${row + 1}: invalid quantity.`);
            continue;
          }
          batch.push({
            name,
            category,
            price,
            quantity,
            customId: customIdCol >= 0 ? cols[customIdCol] || "" : "",
            unit: unitCol >= 0 ? cols[unitCol] || "pcs" : "pcs",
            expiryDate: expCol >= 0 ? cols[expCol] || "" : "",
            threshold: thrCol >= 0 ? Number(cols[thrCol]) || 5 : 5,
          });
        }

        if (errors.length && !batch.length) {
          setCsvError(
            errors.slice(0, 5).join(" ") + (errors.length > 5 ? " …" : ""),
          );
          return;
        }
        if (errors.length) {
          setCsvError(
            `Some rows skipped: ${errors.slice(0, 3).join(" ")}${errors.length > 3 ? " …" : ""}`,
          );
        }

        if (batch.length) await addProductsBulk(batch);
        setModal(null);
        setPage(1);
      } catch (e) {
        setCsvError(e.message || "Upload failed.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="store">
      <section className="inv" aria-labelledby="inv-heading">
        <h2 id="inv-heading" className="inv-title">
          Overall Inventory
        </h2>
        <div className="inv-grid">
          <div className="inv-cell">
            <p className="inv-label">Categories</p>
            <p className="inv-val">{stats.categories}</p>
            <p className="inv-sub">Last 7 days</p>
          </div>
          <div className="inv-div" />
          <div className="inv-cell">
            <p className="inv-label">Total Products</p>
            <div className="inv-split">
              <div>
                <p className="inv-val">{stats.total}</p>
                <p className="inv-sub">Last 7 days</p>
              </div>
              <div>
                <p className="inv-val">
                  ₹{Math.round(stats.revenue).toLocaleString("en-IN")}
                </p>
                <p className="inv-tiny">Amount</p>
              </div>
            </div>
          </div>
          <div className="inv-div" />
          <div className="inv-cell">
            <p className="inv-label">Top Selling</p>
            <div className="inv-split">
              <div>
                <p className="inv-val">{stats.topSellingCount}</p>
                <p className="inv-sub">Last 7 days</p>
              </div>
              <div>
                <p className="inv-val">
                  ₹{stats.topRevenue.toLocaleString("en-IN")}
                </p>
                <p className="inv-tiny">Revenue</p>
              </div>
            </div>
          </div>
          <div className="inv-div" />
          <div className="inv-cell">
            <p className="inv-label">Low Stocks</p>
            <div className="inv-split">
              <div>
                <p className="inv-val">{stats.low}</p>
                <p className="inv-tiny">Ordered</p>
              </div>
              <div>
                <p className="inv-val">{stats.notInStock}</p>
                <p className="inv-tiny">Not in stock</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tbl-card" aria-labelledby="table-heading">
        <div className="tbl-card-head">
          <h2 id="table-heading" className="tbl-card-title">
            Products
          </h2>
          <button
            type="button"
            className="tbl-add"
            onClick={() => setModal("choice")}
          >
            Add Product
          </button>
        </div>

        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Products</th>
                <th className="tbl-col tbl-col--mobile-hide">Price</th>
                <th className="tbl-col tbl-col--mobile-hide">Quantity</th>
                <th className="tbl-col tbl-col--mobile-hide">Threshold</th>
                <th className="tbl-col tbl-col--mobile-hide">Expiry Date</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p._id || p.id}
                    className="tbl-row tbl-row--click"
                    onClick={() => {
                      if (p.quantity > 0) setBuyTarget(p);
                    }}
                    title={
                      p.quantity > 0
                        ? "Click to simulate a purchase"
                        : "Out of stock"
                    }
                  >
                    <td className="tbl-name">
                      <span className="tbl-name-txt">{p.name}</span>
                    </td>
                    <td className="tbl-col tbl-col--mobile-hide">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                    <td className="tbl-col tbl-col--mobile-hide">{p.quantity}</td>
                    <td className="tbl-col tbl-col--mobile-hide">{p.threshold}</td>
                    <td className="tbl-col tbl-col--mobile-hide">{p.expiryDate}</td>
                    <td>
                      <span className={availabilityClass(p.status)}>
                        {availabilityText(p.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="pager">
          <button
            type="button"
            className="pager-btn"
            disabled={pageSafe <= 1}
            onClick={() => setPage((x) => Math.max(1, x - 1))}
          >
            Previous
          </button>
          <span className="pager-info">
            Page {pageSafe} of {totalPages}
            <span className="tbl-inline-count">
              {" "}
              · {products.length} products
            </span>
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
          >
            Next
          </button>
        </footer>
      </section>

      {modal === "choice" && (
        <ChoiceModal
          onClose={() => setModal(null)}
          onIndividual={() => {
            setModal(null);
            navigate("/products/new");
          }}
          onMultiple={() => setModal("csv")}
        />
      )}

      {modal === "csv" && (
        <CsvModal
          onClose={() => {
            setModal(null);
            setCsvError("");
          }}
          onUpload={handleCsvUpload}
          error={csvError}
        />
      )}

      {buyTarget ? (
        <BuyModal
          product={buyTarget}
          onClose={() => setBuyTarget(null)}
          onConfirm={async (p, qty) => {
            try {
              await buyProduct(p._id, qty);
              setBuyTarget(null);
            } catch (e) {
              window.alert(e.message || "Could not complete purchase.");
            }
          }}
        />
      ) : null}
    </div>
  );
}
