import { Link } from "react-router-dom";
import "../pages/Products.css";
import "./Layout.css";
import { SettingsIcon, SearchIcon } from "../../public/assets/Icons";
export default function Header({ title, showSearch, search, onSearchChange }) {
  return (
    <header className="store-top">
      <h1 className="store-title">{title}</h1>
      <div className="store-top-actions">
        {showSearch ? (
          <div className="store-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search here..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search"
            />
          </div>
        ) : null}
        <Link
          to="/settings"
          className="header-settings-btn"
          aria-label="Settings"
        >
          <SettingsIcon />
        </Link>
      </div>
    </header>
  );
}
