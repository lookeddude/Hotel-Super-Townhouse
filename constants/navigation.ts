import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const PUBLIC_NAV: NavItem[] = [
  { label: 'Home', href: ROUTES.home },
  { label: 'Rooms & Suites', href: ROUTES.rooms },
  {
    label: 'Explore',
    href: '#',
    children: [
      { label: 'Gallery', href: ROUTES.gallery },
      { label: 'Facilities', href: ROUTES.facilities },
      { label: 'About Us', href: ROUTES.about },
    ],
  },
  { label: 'Contact', href: ROUTES.contact },
];

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Overview', href: ROUTES.dashboard },
  { label: 'My Bookings', href: ROUTES.dashboardBookings },
  { label: 'Profile', href: ROUTES.dashboardProfile },
  { label: 'Notifications', href: ROUTES.dashboardNotifications },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.adminDashboard },
  { label: 'Bookings', href: ROUTES.adminBookings },
  { label: 'Calendar', href: ROUTES.adminCalendar },
  { label: 'Rooms', href: ROUTES.adminRooms },
  { label: 'Gallery', href: ROUTES.adminGallery },
  { label: 'Reviews', href: ROUTES.adminReviews },
  { label: 'Offers', href: ROUTES.adminOffers },
  { label: 'Payments', href: ROUTES.adminPayments },
  { label: 'Reports', href: ROUTES.adminReports },
  { label: 'CMS', href: ROUTES.adminCms },
  { label: 'Settings', href: ROUTES.adminSettings },
];

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', href: ROUTES.about },
    { label: 'Gallery', href: ROUTES.gallery },
    { label: 'Facilities', href: ROUTES.facilities },
    { label: 'Contact', href: ROUTES.contact },
  ],
  rooms: [
    { label: 'All Rooms', href: ROUTES.rooms },
    { label: 'Standard Room', href: '/rooms/standard' },
    { label: 'Deluxe Room', href: '/rooms/deluxe' },
    { label: 'Suite', href: '/rooms/suite' },
  ],
  policies: [
    { label: 'Booking Policy', href: ROUTES.policies },
    { label: 'Cancellation', href: `${ROUTES.policies}#cancellation` },
    { label: 'FAQ', href: ROUTES.faq },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};
