export interface NavItem {
    title: string;
    href: string;
    submenu?: {
        title: string;
        href: string;
    }[];
    className?: string;
}

export interface ServiceItem {
    icon: string | React.ReactElement;
    title: string;
    description: string;
    link: string;
}

export interface MessageItem {
    image: string;
    title: string;
    message: string;
    name: string;
    regNo: string;
    position: string;
    link: string;
}

export interface NoticeItem {
    id: number;
    type: string;
    date: string;
    title: string;
    link: string;
}

export interface DocumentItem {
    id: number;
    title: string;
    date: string;
    link: string;
}

export interface ContactOfficerItem {
    image: string;
    title: string;
    name: string;
    regNo: string;
    phone: string;
    officePhone: string;
    email: string;
    position: string;
}
