import { useState, useRef, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./Invoices.css";
import "./Products.css";

const PAGE_SIZE = 8;

function useInvoiceSummary(invoices) {
  return useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - weekMs;
    const inLast7 = (inv) => {
      const raw = inv.createdAt || inv.dueDate;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.getTime() >= sevenDaysAgo;
    };

    const recent = invoices.filter(inLast7);
    const paid = invoices.filter((i) => i.status === "Paid");
    const unpaid = invoices.filter((i) => i.status === "Unpaid");
    const paidAmount = paid.reduce((s, i) => s + i.amount, 0);
    const unpaidAmount = unpaid.reduce((s, i) => s + i.amount, 0);
    const paidCustomers = new Set(paid.map((i) => i.customer)).size;
    const unpaidCustomers = new Set(unpaid.map((i) => i.customer)).size;

    return {
      recentCount: recent.length,
      last7Count: recent.length,
      totalPaidInvoices: paid.length,
      totalCount: invoices.length,
      paidAmount,
      unpaidAmount,
      paidCustomers,
      unpaidCustomers,
    };
  }, [invoices]);
}

function getInvoiceProductName(invoice, products) {
  if (!invoice?.product) return "Purchase";
  const pid =
    typeof invoice.product === "object"
      ? invoice.product?._id
      : invoice.product;
  const p = products.find((x) => String(x._id) === String(pid));
  return p?.name || "Purchase";
}

function formatInvoiceDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function InvoiceViewModal({ invoice, products, onClose }) {
  const productName = useMemo(
    () => getInvoiceProductName(invoice, products),
    [invoice, products],
  );
  const taxRate = 0.1;
  const total = Number(invoice.amount) || 0;
  const subtotal = Math.round((total / (1 + taxRate)) * 100) / 100;
  const tax = Math.round((total - subtotal) * 100) / 100;
  const invDate = formatInvoiceDate(invoice.createdAt);
  const due = invoice.dueDate || "—";

  const downloadHtml = () => {
    const el = document.getElementById("invoice-print-root");
    if (!el) return;
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${invoice.id}</title></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${String(invoice.id).replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printInvoice = () => {
    const el = document.getElementById("invoice-print-root");
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${invoice.id}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111} table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left} .inv-total-due{color:#0d9488;font-weight:800}</style></head><body>${el.innerHTML}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div className="inv-detail-overlay" onClick={onClose}>
      <div
        className="inv-detail-modal scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inv-detail-title"
      >
        <div className="inv-detail-fabs" aria-label="Invoice actions">
          <button
            type="button"
            className="inv-fab inv-fab--close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="inv-fab inv-fab--download"
            onClick={downloadHtml}
            aria-label="Download"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="inv-fab inv-fab--print"
            onClick={printInvoice}
            aria-label="Print"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="inv-detail-sheet" id="invoice-print-root">
          <header className="inv-detail-head">
            <div>
              <h1 id="inv-detail-title" className="inv-detail-kicker">
                INVOICE
              </h1>
              <p className="inv-detail-muted-label">Billed to</p>
              <p className="inv-detail-strong">
                {invoice.customer || "Customer"}
              </p>
              <p className="inv-detail-faint">Company address</p>
              <p className="inv-detail-faint">City, Country — 00000</p>
            </div>
            <div className="inv-detail-from">
              <p className="inv-detail-faint">Business address</p>
              <p className="inv-detail-faint">City, State, IN — 000 000</p>
              <p className="inv-detail-faint">TAX ID 00XXXXX1234X0XX</p>
            </div>
          </header>

          <div className="inv-detail-body">
            <div className="inv-detail-meta">
              <div className="inv-detail-meta-row">
                <span className="inv-detail-muted-label">Invoice #</span>
                <span className="inv-detail-meta-val">{invoice.id}</span>
              </div>
              <div className="inv-detail-meta-row">
                <span className="inv-detail-muted-label">Invoice date</span>
                <span className="inv-detail-meta-val">{invDate}</span>
              </div>
              <div className="inv-detail-meta-row">
                <span className="inv-detail-muted-label">Reference</span>
                <span className="inv-detail-meta-val">{invoice.ref}</span>
              </div>
              <div className="inv-detail-meta-row">
                <span className="inv-detail-muted-label">Due date</span>
                <span className="inv-detail-meta-val">{due}</span>
              </div>
            </div>

            <div className="inv-detail-table-wrap">
              <table className="inv-detail-table">
                <thead>
                  <tr>
                    <th>Products</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{productName}</td>
                    <td>1</td>
                    <td>₹{subtotal.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
              <div className="inv-detail-totals">
                <div className="inv-detail-total-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="inv-detail-total-row">
                  <span>Tax (10%)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="inv-detail-total-row inv-detail-total-row--due">
                  <span>Total due</span>
                  <span className="inv-total-due">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <footer className="inv-detail-foot">
            <p className="inv-detail-pay-note">
              <span className="inv-detail-pay-ico" aria-hidden>
                ◆
              </span>
              Please pay within 7 days of receiving this invoice.
            </p>
            <div className="inv-detail-contacts">
              <span>www.stockwise.inc</span>
              <span>+91 00000 00000</span>
              <span>hello@email.com</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmToast({ onCancel, onConfirm }) {
  return (
    <div
      className="inv-delete-toast"
      role="dialog"
      aria-labelledby="inv-del-msg"
    >
      <p id="inv-del-msg" className="inv-delete-toast__text">
        this invoice will be deleted.
      </p>
      <div className="inv-delete-toast__actions">
        <button
          type="button"
          className="inv-delete-toast__cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inv-delete-toast__confirm"
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function ThreeDotMenu({ invoice, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  return (
    <div className="dots" ref={ref}>
      <button
        className="dots-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        ⋯
      </button>
      {open && (
        <div className="dots-menu" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              onAction("toggle", invoice);
              setOpen(false);
            }}
            style={{
              background: invoice.status === "Paid" ? "#F12C2C" : "#1A963D",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.1733 10.6316L11.3114 11.4936L11.116 11.2983C10.8556 11.0378 10.4338 11.0378 10.1733 11.2983C9.91292 11.5587 9.91292 11.9806 10.1733 12.241L10.84 12.9076C10.9702 13.0378 11.1408 13.1029 11.3114 13.1029C11.4819 13.1029 11.6525 13.0378 11.7827 12.9076L13.116 11.5743C13.3765 11.3139 13.3765 10.892 13.116 10.6316C12.8556 10.3712 12.4338 10.3712 12.1733 10.6316Z"
                fill="black"
              />
              <path
                d="M13.3077 8.39217C13.3181 8.13716 13.3333 7.88203 13.3333 7.62699C13.3333 6.25069 13.194 4.87764 12.9209 3.55147C12.833 3.10355 12.6647 2.68428 12.4205 2.30537C12.2265 2.00459 11.8297 1.91084 11.5205 2.09313L10.6487 2.60876L9.64546 2.07751C9.45015 1.97464 9.21643 1.97464 9.02112 2.07751L7.99996 2.61852L6.9788 2.07751C6.78348 1.97464 6.54976 1.97464 6.35445 2.07751L5.3512 2.60876L4.47945 2.09313C4.17118 1.91019 3.77404 2.00394 3.57938 2.30537C3.33524 2.68428 3.16695 3.10355 3.08036 3.54561C2.53121 6.21553 2.53121 9.03779 3.08004 11.7071C3.3206 12.8835 4.08785 13.8275 5.08232 14.17C6.03576 14.4994 7.01721 14.6667 7.99996 14.6667C8.47017 14.6667 8.94454 14.6179 9.41585 14.5408C10.0546 15.0448 10.8354 15.3334 11.6666 15.3334C13.6884 15.3334 15.3333 13.6882 15.3333 11.6667C15.3333 10.2549 14.5311 8.99613 13.3077 8.39217ZM5.51721 12.9095C4.9661 12.7194 4.53284 12.1569 4.38635 11.4395C3.87333 8.94535 3.87333 6.30797 4.38765 3.80797C4.40034 3.74287 4.41597 3.67841 4.43388 3.61527L4.99377 3.94665C5.19332 4.06513 5.43974 4.07035 5.64546 3.96227L6.66662 3.42126L7.68778 3.96227C7.8831 4.06514 8.11682 4.06514 8.31213 3.96227L9.33329 3.42126L10.3544 3.96227C10.5599 4.07035 10.8066 4.06514 11.0061 3.94665L11.5657 3.61592C11.5843 3.68037 11.6002 3.74678 11.6136 3.81449C11.8701 5.05797 12 6.34118 12 7.62699C12 7.75589 11.9987 7.88545 11.9957 8.01435C11.8873 8.00459 11.7776 8.00003 11.6666 8.00003C10.7601 8.00003 9.93094 8.33255 9.29028 8.87963C9.31343 8.81192 9.33329 8.74226 9.33329 8.6667C9.33329 8.29821 9.03479 8.00003 8.66662 8.00003H5.99996C5.63179 8.00003 5.33329 8.29821 5.33329 8.6667C5.33329 9.03519 5.63179 9.33337 5.99996 9.33337H8.66662C8.74218 9.33337 8.81193 9.31355 8.87964 9.2904C8.33252 9.93111 7.99996 10.7602 7.99996 11.6667C7.99996 11.8029 8.00903 11.9381 8.02404 12.0723C8.02892 12.116 8.03776 12.1589 8.04418 12.2024C8.05761 12.2929 8.07242 12.383 8.09248 12.4719C8.10351 12.5207 8.11722 12.5685 8.1302 12.6167C8.15254 12.6999 8.17684 12.7821 8.20483 12.8633C8.22115 12.9105 8.23856 12.9569 8.25675 13.0033C8.2889 13.0855 8.32422 13.166 8.36214 13.2456C8.37414 13.2708 8.38289 13.2974 8.39546 13.3223C7.42509 13.3744 6.45926 13.2351 5.51721 12.9095ZM11.6666 14C11.0608 14 10.4912 13.7728 10.0569 13.3549C9.59045 12.9147 9.33329 12.3151 9.33329 11.6667C9.33329 10.3802 10.3802 9.33337 11.6666 9.33337C11.9287 9.33337 12.1764 9.37438 12.417 9.45967C13.3639 9.77347 14 10.6602 14 11.6667C14 12.9532 12.9531 14 11.6666 14Z"
                fill="black"
              />
              <path
                d="M6.00016 7.33333H7.3081C7.67627 7.33333 7.97477 7.03515 7.97477 6.66667C7.97477 6.29818 7.67627 6 7.3081 6H6.00016C5.632 6 5.3335 6.29818 5.3335 6.66667C5.3335 7.03515 5.632 7.33333 6.00016 7.33333Z"
                fill="black"
              />
            </svg>

            {invoice.status === "Paid" ? "Mark as Unpaid" : "Mark as Paid"}
          </button>
          {invoice.status === "Paid" && (
            <button
              onClick={() => {
                onAction("view", invoice);
                setOpen(false);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="18" height="18" rx="3" fill="#0BB2F4" />
                <path
                  d="M16.158 8.28375C16.386 8.60325 16.5 8.76375 16.5 9C16.5 9.237 16.386 9.39675 16.158 9.71625C15.1335 11.1533 12.5167 14.25 9 14.25C5.4825 14.25 2.8665 11.1525 1.842 9.71625C1.614 9.39675 1.5 9.23625 1.5 9C1.5 8.763 1.614 8.60325 1.842 8.28375C2.8665 6.84675 5.48325 3.75 9 3.75C12.5175 3.75 15.1335 6.8475 16.158 8.28375Z"
                  stroke="#00252A"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.25 9C11.25 8.40326 11.0129 7.83097 10.591 7.40901C10.169 6.98705 9.59674 6.75 9 6.75C8.40326 6.75 7.83097 6.98705 7.40901 7.40901C6.98705 7.83097 6.75 8.40326 6.75 9C6.75 9.59674 6.98705 10.169 7.40901 10.591C7.83097 11.0129 8.40326 11.25 9 11.25C9.59674 11.25 10.169 11.0129 10.591 10.591C11.0129 10.169 11.25 9.59674 11.25 9Z"
                  stroke="#00252A"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              View Invoice
            </button>
          )}
          <button
            className="dots-del"
            onClick={() => {
              onAction("delete", invoice);
              setOpen(false);
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="3" fill="#F4510B" />
              <path
                d="M5.25 15.75C4.8375 15.75 4.4845 15.6033 4.191 15.3097C3.8975 15.0162 3.7505 14.663 3.75 14.25V4.5C3.5375 4.5 3.3595 4.428 3.216 4.284C3.0725 4.14 3.0005 3.962 3 3.75C2.9995 3.538 3.0715 3.36 3.216 3.216C3.3605 3.072 3.5385 3 3.75 3H6.75C6.75 2.7875 6.822 2.6095 6.966 2.466C7.11 2.3225 7.288 2.2505 7.5 2.25H10.5C10.7125 2.25 10.8908 2.322 11.0348 2.466C11.1788 2.61 11.2505 2.788 11.25 3H14.25C14.4625 3 14.6408 3.072 14.7848 3.216C14.9288 3.36 15.0005 3.538 15 3.75C14.9995 3.962 14.9275 4.14025 14.784 4.28475C14.6405 4.42925 14.4625 4.501 14.25 4.5V14.25C14.25 14.6625 14.1033 15.0157 13.8098 15.3097C13.5163 15.6038 13.163 15.7505 12.75 15.75H5.25ZM12.75 4.5H5.25V14.25H12.75V4.5ZM7.5 12.75C7.7125 12.75 7.89075 12.678 8.03475 12.534C8.17875 12.39 8.2505 12.212 8.25 12V6.75C8.25 6.5375 8.178 6.3595 8.034 6.216C7.89 6.0725 7.712 6.0005 7.5 6C7.288 5.9995 7.11 6.0715 6.966 6.216C6.822 6.3605 6.75 6.5385 6.75 6.75V12C6.75 12.2125 6.822 12.3907 6.966 12.5347C7.11 12.6787 7.288 12.7505 7.5 12.75ZM10.5 12.75C10.7125 12.75 10.8908 12.678 11.0348 12.534C11.1788 12.39 11.2505 12.212 11.25 12V6.75C11.25 6.5375 11.178 6.3595 11.034 6.216C10.89 6.0725 10.712 6.0005 10.5 6C10.288 5.9995 10.11 6.0715 9.966 6.216C9.822 6.3605 9.75 6.5385 9.75 6.75V12C9.75 12.2125 9.822 12.3907 9.966 12.5347C10.11 12.6787 10.288 12.7505 10.5 12.75Z"
                fill="#00252A"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Invoices() {
  const { invoices, products, updateInvoiceStatus, deleteInvoice } = useApp();
  const summary = useInvoiceSummary(invoices);
  const [page, setPage] = useState(1);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paginated = invoices.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const handleAction = (type, invoice) => {
    const key = invoice._id || invoice.id;
    if (type === "toggle") {
      updateInvoiceStatus(key, invoice.status === "Paid" ? "Unpaid" : "Paid");
    } else if (type === "delete") {
      setPendingDelete(invoice);
    } else if (type === "view") {
      setViewInvoice(invoice);
    }
  };

  return (
    <div className="inv-page fade-in">
      <section className="inv" aria-labelledby="inv-heading">
        <h2 id="inv-heading" className="inv-title">
          Overall Invoice
        </h2>
        <div className="inv-grid">
          <div className="inv-cell">
            <p className="inv-label">Recent Transactions</p>
            <p className="inv-val">{summary.recentCount}</p>
            <p className="inv-sub">Recently generated</p>
          </div>
          <div className="inv-div" />
          <div className="inv-cell">
            <p className="inv-label">Total Invoices</p>
            <div className="inv-split">
              <div>
                <p className="inv-val">{summary.last7Count}</p>
                <p className="inv-sub">Last 7 days</p>
              </div>
              <div>
                <p className="inv-val">{summary.totalPaidInvoices}</p>
                <p className="inv-tiny">Total paid</p>
              </div>
            </div>
          </div>
          <div className="inv-div" />
          <div className="inv-cell">
            <p className="inv-label">Paid Amount</p>
            <div className="inv-split">
              <div>
                <p className="inv-val">
                  ₹{Math.round(summary.paidAmount).toLocaleString("en-IN")}
                </p>
                <p className="inv-sub">Total paid</p>
              </div>
              <div>
                <p className="inv-val">{summary.paidCustomers}</p>
                <p className="inv-tiny">Customers</p>
              </div>
            </div>
          </div>
          <div className="inv-div" />
          <div className="inv-cell">
            <p className="inv-label">Unpaid Amount</p>
            <div className="inv-split">
              <div>
                <p className="inv-val">
                  ₹{Math.round(summary.unpaidAmount).toLocaleString("en-IN")}
                </p>
                <p className="inv-tiny">Total pending</p>
              </div>
              <div>
                <p className="inv-val">{summary.unpaidCustomers}</p>
                <p className="inv-tiny">Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tbl-card" aria-labelledby="invoice-table-heading">
        <div className="tbl-card-head">
          <h2 id="invoice-table-heading" className="tbl-card-title">
            Invoices
          </h2>
        </div>

        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th className="tbl-col tbl-col--mobile-hide">Reference</th>
                <th className="tbl-col tbl-col--mobile-hide">Customer</th>
                <th className="tbl-col tbl-col--mobile-hide">Amount</th>
                <th className="tbl-col tbl-col--mobile-hide">Status</th>
                <th className="tbl-col tbl-col--mobile-hide">Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="tbl-empty">
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                paginated.map((inv) => (
                  <tr key={inv._id || inv.id} className="tbl-row">
                    <td>{inv.id}</td>
                    <td className="tbl-name tbl-col tbl-col--mobile-hide">
                      {inv.ref}
                    </td>
                    <td className="tbl-col tbl-col--mobile-hide">
                      {inv.customer}
                    </td>
                    <td className="tbl-col tbl-col--mobile-hide">
                      ₹{inv.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="tbl-col tbl-col--mobile-hide">
                      <span
                        className={
                          inv.status === "Paid"
                            ? "avail avail-in"
                            : "avail avail-low"
                        }
                      >
                        {inv.status === "Paid" ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="tbl-col tbl-col--mobile-hide">
                      {inv.dueDate}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ThreeDotMenu invoice={inv} onAction={handleAction} />
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
              · {invoices.length} invoices
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

      {viewInvoice && (
        <InvoiceViewModal
          invoice={viewInvoice}
          products={products}
          onClose={() => setViewInvoice(null)}
        />
      )}

      {pendingDelete && (
        <>
          <div
            className="inv-delete-backdrop"
            role="presentation"
            aria-hidden
            onClick={() => setPendingDelete(null)}
          />
          <DeleteConfirmToast
            onCancel={() => setPendingDelete(null)}
            onConfirm={async () => {
              const key = pendingDelete._id || pendingDelete.id;
              setPendingDelete(null);
              try {
                await deleteInvoice(key);
              } catch {}
            }}
          />
        </>
      )}
    </div>
  );
}
