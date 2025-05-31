import { NavItem } from "@/lib/types";

export const navItems: NavItem[] = [
    { title: "HOME", href: "/" },
    {
        title: "SHOP",
        href: "#",
        submenu: [
            { title: "PRODUCT", href: "/product" },
            { title: "CATEGORY", href: "/category" },
            // { title: "GOVERNING BOARD", href: "/governing-board" },
            // { title: "COMMITTEES", href: "/committees" },
            // { title: "ORGANIZATIONAL CHART", href: "/organizational-chart" },
            // { title: "MESSAGE FROM CHAIRMAN", href: "/message-chairman" },
            // { title: "MESSAGE FROM REGISTRAR", href: "/message-registrar" },
        ],
    },
    {
        title: "ABOUT",
        href: "#",
        submenu: [{ title: "ABOUT SECTION", href: "/about-section" }],
    },
    {
        title: "BLOG",
        href: "#",
        submenu: [
            { title: "LATEST BLOG", href: "/latest-blog" },
            // { title: "ONLINE REGISTERED (AFTER 2020)", href: "/online-registered" },
        ],
    },
    {
        title: "MORE",
        href: "#",
        submenu: [
            // { title: "CONTACT", href: "/contaact" },
            // { title: "PROFESSIONAL ENG", href: "/professional-eng" },
            // { title: "DOWNLOADS", href: "/downloads" },
            { title: "CONTACT US", href: "/contact" },
        ],
    },
];
