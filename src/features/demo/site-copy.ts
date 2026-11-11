import type { ByLocale, Locale } from "@/domain/locale";

/**
 * SITE CHROME COPY: header, menu, hero, carousel controls, footer and contact placeholders, in Vietnamese (approved UI) and
 * English (build-team DRAFT for owner review, bilingual preview 6/11/2026; collected in docs/i18n/EN-TRANSLATION-SET.md).
 * Brand names, "Hospitality Management" and "BOOKING" / "BOOK NOW" are English in both languages.
 */
const vi = {
  homeLabel: "VNest, về trang chủ",
  mainNav: "Điều hướng chính",
  menu: "Menu",
  openMenu: "Mở menu",
  menuDialog: "Menu VNest",
  close: "Đóng",
  // Menu labels: the owner's wording after the client review (Phase A corrections, 7/11/2026).
  menuDiscover: "Khám phá nơi ở",
  menuPartner: "Hợp tác cùng VNest",
  menuFaq: "QA",
  menuContact: "Liên hệ",
  contactKicker: "Liên hệ",
  contactChannels: "Kênh liên hệ (đang cập nhật)",
  phone: "Điện thoại",
  channelPending: (name: string) => `${name} VNest, đang cập nhật`,
  pending: "Đang cập nhật",
  heroTitle: "Sáu nơi ở, hai thành phố",
  heroLead: "Bare Boutique Stays · The Nắng Suites · Pepper House, tại TP. Hồ Chí Minh và Đà Nẵng.",
  carouselPause: "Tạm dừng trình chiếu ảnh",
  carouselPlay: "Tiếp tục trình chiếu ảnh",
  footerLabel: "Chân trang VNest",
  footerDescriptor: "Ba thương hiệu lưu trú, sáu nơi ở tại TP. Hồ Chí Minh và Đà Nẵng.",
  footerContactKicker: "Liên hệ VNest",
  footerContactTitle: "Bắt đầu một cuộc trò chuyện.",
  footerAddress: "Địa chỉ",
  footerCta: "Gửi yêu cầu tư vấn",
  footerFacebook: "của VNest (mở trong tab mới)",
  footerLinks: "Liên kết VNest",
  footerNavAbout: "Về VNest",
  footerNavBrands: "Thương hiệu",
  footerNavServices: "Dịch vụ",
  footerNavFaq: "Hỏi đáp",
  backToTop: "Về đầu trang ↑",
  // Footer social icons (owner, 10/11/2026): a network with an official URL links out; the others are labelled placeholders.
  socialLabel: "Mạng xã hội VNest",
  socialOpen: (name: string) => `${name} VNest (mở trong tab mới)`,
  socialPending: (name: string) => `${name} – sắp cập nhật`,
  socialTip: "Sắp cập nhật",
};

export type SiteCopy = typeof vi;

const en: SiteCopy = {
  homeLabel: "VNest, home",
  mainNav: "Main navigation",
  menu: "Menu",
  openMenu: "Open menu",
  menuDialog: "VNest menu",
  close: "Close",
  menuDiscover: "Explore stays",
  menuPartner: "Partner with VNest",
  menuFaq: "Q&A",
  menuContact: "Contact",
  contactKicker: "Contact",
  contactChannels: "Contact channels (coming soon)",
  phone: "Phone",
  channelPending: (name: string) => `VNest ${name}, coming soon`,
  pending: "Coming soon",
  heroTitle: "Six stays, two cities",
  heroLead: "Bare Boutique Stays · The Nắng Suites · Pepper House, in Ho Chi Minh City and Da Nang.",
  carouselPause: "Pause the slideshow",
  carouselPlay: "Play the slideshow",
  footerLabel: "VNest footer",
  footerDescriptor: "Three hospitality brands, six stays in Ho Chi Minh City and Da Nang.",
  footerContactKicker: "Contact VNest",
  footerContactTitle: "Start a conversation.",
  footerAddress: "Address",
  footerCta: "Request a consultation",
  footerFacebook: "page for VNest (opens in a new tab)",
  footerLinks: "VNest links",
  footerNavAbout: "About VNest",
  footerNavBrands: "Brands",
  footerNavServices: "Services",
  footerNavFaq: "FAQ",
  backToTop: "Back to top ↑",
  socialLabel: "VNest social media",
  socialOpen: (name: string) => `VNest on ${name} (opens in a new tab)`,
  socialPending: (name: string) => `${name} – coming soon`,
  socialTip: "Coming soon",
};

export const SITE_COPY: ByLocale<SiteCopy> = { vi, en };

export function siteCopyFor(locale: Locale): SiteCopy {
  return SITE_COPY[locale];
}
