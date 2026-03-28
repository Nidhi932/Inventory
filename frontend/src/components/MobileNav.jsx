import { NavLink } from "react-router-dom";
import "./MobileNav.css";

const ITEMS = [
  {
    to: "/dashboard",
    label: "Home",
    icon: (
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_1_5039)">
          <path
            d="M2 23.5H9V15H16V23.5H23V9L12.5 2.5L2 9V23.5ZM0 25V8.33333L12.5 0L25 8.33333V25H14.0625V16.6667H10.9375V25H0Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_1_5039">
            <rect width="25" height="25" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Products",
    icon: (
      <svg
        width="29"
        height="27"
        viewBox="0 0 29 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27.3889 13.5H19.4722L16.8333 18.1875H11.5556L8.91667 13.5H1"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M5.55208 2.73438L1 13.5V22.875C1 23.7038 1.27802 24.4987 1.77291 25.0847C2.2678 25.6708 2.93901 26 3.63889 26H24.75C25.4499 26 26.1211 25.6708 26.616 25.0847C27.1109 24.4987 27.3889 23.7038 27.3889 22.875V13.5L22.8368 2.73438C22.6183 2.21373 22.2816 1.77558 21.8643 1.46919C21.4471 1.16279 20.9659 1.00031 20.475 1H7.91389C7.42294 1.00031 6.94181 1.16279 6.52457 1.46919C6.10734 1.77558 5.77055 2.21373 5.55208 2.73438Z"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/invoices",
    label: "Invoices",
    icon: (
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16.875 6.066H8.12499M16.875 11.2131H8.12499M16.875 16.3601H11.0417M2.29166 0.918945H22.7083V24.0807L21.2033 22.9432C20.6747 22.5435 20.0015 22.3237 19.3053 22.3237C18.6091 22.3237 17.9359 22.5435 17.4073 22.9432L15.9023 24.0807L14.3987 22.9432C13.87 22.5431 13.1965 22.3232 12.5 22.3232C11.8035 22.3232 11.13 22.5431 10.6012 22.9432L9.0977 24.0807L7.5927 22.9432C7.06409 22.5435 6.39086 22.3237 5.69468 22.3237C4.99849 22.3237 4.32527 22.5435 3.79666 22.9432L2.29166 24.0807V0.918945Z"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/statistics",
    label: "Statistics",
    icon: (
      <svg
        width="27"
        height="27"
        viewBox="0 0 27 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.15191 20.6163H7.80121V13.1944H6.15191V20.6163ZM18.5877 20.6163H20.237V4.94792H18.5877V20.6163ZM12.3698 20.6163H14.0191V16.4931H12.3698V20.6163ZM12.3698 13.1944H14.0191V9.89583H12.3698V13.1944ZM2.66528 26.3889C1.9055 26.3889 1.27161 26.1349 0.763628 25.6269C0.255642 25.1189 0.00109954 24.4845 0 23.7236V2.66528C0 1.9055 0.254542 1.27161 0.763628 0.763628C1.27271 0.255642 1.9066 0.00109954 2.66528 0H23.7253C24.4839 0 25.1178 0.254542 25.6269 0.763628C26.136 1.27271 26.39 1.9066 26.3889 2.66528V23.7253C26.3889 24.4839 26.1349 25.1178 25.6269 25.6269C25.1189 26.136 24.4845 26.39 23.7236 26.3889H2.66528ZM2.66528 24.7396H23.7253C23.9782 24.7396 24.2107 24.634 24.4229 24.4229C24.6351 24.2118 24.7407 23.9787 24.7396 23.7236V2.66528C24.7396 2.41128 24.634 2.17818 24.4229 1.96597C24.2118 1.75376 23.9787 1.64821 23.7236 1.64931H2.66528C2.41128 1.64931 2.17818 1.75486 1.96597 1.96597C1.75376 2.17708 1.64821 2.41019 1.64931 2.66528V23.7253C1.64931 23.9782 1.75486 24.2107 1.96597 24.4229C2.17708 24.6351 2.41128 24.7407 2.66528 24.7396Z"
          fill="white"
        />
      </svg>
    ),
  },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Main">
      {ITEMS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `mobile-nav__link ${isActive ? "mobile-nav__link--active" : ""}`
          }
          end={to === "/dashboard"}
        >
          <span className="mobile-nav__ico">{icon}</span>
          <span className="visually-hidden">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
