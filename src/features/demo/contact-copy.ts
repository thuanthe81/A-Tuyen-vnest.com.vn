import type { LocalizedText } from "@/domain/locale";

/**
 * HOMEPAGE CONSULTATION FORM COPY (client review 6/11/2026). Vietnamese is the build team's wording, reviewed with the owner;
 * English is a build-team DRAFT translation (docs/i18n/). The section heading and the contact details above the form come
 * from site-copy.ts (`footerContactKicker`, `footerContactTitle`), so the large headline is written once.
 *
 * Delivery (10/11/2026): the recipient is confirmed (hello@vnest.com.vn), but sending stays OFF until a provider and a
 * verified sender are configured (CONSULTATION_DELIVERY, docs/handoff/BACKEND-HANDOFF.md §11). While it is off, `notice` and
 * `unsent` say so and nothing leaves the browser. Once it is on, `intro` replaces `notice`, and `sent` appears only after
 * the server confirms that the provider accepted the request. No copy promises a reply or a response time.
 * `{email}` in `failed` and `limited` is replaced by VNest's email address as a mailto link.
 */
export const CONTACT_FORM_COPY = {
  formTitle: { vi: "Yêu cầu tư vấn", en: "Request a consultation" },
  notice: {
    vi: "Biểu mẫu trực tuyến chưa hoạt động. Trong lúc chờ, vui lòng gọi hotline hoặc gửi email cho VNest.",
    en: "The online form is not active yet. Until it is, please call the hotline or email VNest.",
  },
  intro: {
    vi: "Chia sẻ đôi nét về tài sản và nhu cầu của bạn. Yêu cầu sẽ được gửi trực tiếp đến đội ngũ VNest.",
    en: "Tell us a little about your property and what you are looking for. Your request goes straight to the VNest team.",
  },
  serviceLegend: { vi: "Dịch vụ quan tâm", en: "Service of interest" },
  serviceUnsure: { vi: "Chưa rõ, cần tư vấn", en: "Not sure yet, I need advice" },
  name: { vi: "Họ tên", en: "Full name" },
  reach: { vi: "Số điện thoại hoặc email", en: "Phone or email" },
  reachHint: { vi: "Ví dụ: 0901 234 567 hoặc ten@email.com", en: "For example: 0901 234 567 or name@email.com" },
  asset: { vi: "Loại tài sản", en: "Property type" },
  message: { vi: "Nội dung trao đổi", en: "Message" },
  optional: { vi: "(không bắt buộc)", en: "(optional)" },
  submit: { vi: "Gửi yêu cầu", en: "Send request" },
  invalid: { vi: "Vui lòng kiểm tra các ô được đánh dấu.", en: "Please check the highlighted fields." },
  unsent: {
    vi: "Chưa gửi. Thông tin hợp lệ, nhưng biểu mẫu chưa được kết nối nên không có thông tin nào được gửi đi. Vui lòng gọi hotline hoặc gửi email cho VNest.",
    en: "Not sent. Your details are valid, but the form is not connected yet, so nothing was sent. Please call the hotline or email VNest.",
  },
  submitting: { vi: "Đang gửi...", en: "Sending..." },
  sent: { vi: "Yêu cầu của bạn đã được gửi đến VNest.", en: "Your request has been sent to VNest." },
  sentThanks: { vi: "Cảm ơn bạn đã quan tâm đến VNest.", en: "Thank you for your interest in VNest." },
  sentSimulated: {
    vi: "Môi trường thử nghiệm: việc gửi được mô phỏng, không có email nào được gửi đi.",
    en: "Test environment: sending is simulated, no email was sent.",
  },
  failed: {
    vi: "Chưa thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp qua {email}.",
    en: "Your request could not be sent. Please try again or contact us directly at {email}.",
  },
  limited: {
    vi: "Bạn vừa gửi nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút hoặc liên hệ trực tiếp qua {email}.",
    en: "Several requests were sent in a short time. Please try again in a few minutes or contact us directly at {email}.",
  },
  trap: { vi: "Vui lòng để trống ô này", en: "Please leave this field empty" },
  serviceRequired: { vi: "Vui lòng chọn dịch vụ quan tâm.", en: "Please choose a service." },
  nameRequired: { vi: "Vui lòng nhập họ tên.", en: "Please enter your name." },
  reachRequired: { vi: "Vui lòng nhập số điện thoại hoặc email.", en: "Please enter a phone number or email address." },
  reachInvalid: { vi: "Số điện thoại hoặc email chưa đúng định dạng.", en: "That phone number or email address does not look right." },
  nameTooLong: { vi: "Họ tên quá dài (tối đa 100 ký tự).", en: "That name is too long (100 characters at most)." },
  reachTooLong: { vi: "Số điện thoại hoặc email quá dài.", en: "That phone number or email address is too long." },
  assetTooLong: { vi: "Loại tài sản quá dài (tối đa 120 ký tự).", en: "Property type is too long (120 characters at most)." },
  messageTooLong: { vi: "Nội dung quá dài (tối đa 2.000 ký tự).", en: "Message is too long (2,000 characters at most)." },
} as const satisfies Record<string, LocalizedText>;
