import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import "./Layout.css";

const PAGE_TITLES = {
  "/dashboard": "Home",
  "/products": "Product",
  "/products/new": "Product",
  "/invoices": "Invoices",
  "/statistics": "Statistics",
  "/settings": "Settings",
};

export default function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Stockwise";
  const isProductShell =
    location.pathname === "/products" || location.pathname === "/products/new";

  const [productSearch, setProductSearch] = useState("");

  return (
    <div className="shell">
      <Sidebar />
      <div className="shell-main">
        <Header
          title={title}
          showSearch={
            location.pathname === "/products" ||
            location.pathname === "/invoices"
          }
          search={productSearch}
          onSearchChange={(value) => {
            setProductSearch(value);
          }}
        />
        <main className={isProductShell ? "page fill" : "page"}>
          <Outlet context={{ productSearch, setProductSearch }} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
