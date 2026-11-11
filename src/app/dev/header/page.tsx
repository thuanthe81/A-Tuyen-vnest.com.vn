import { BookingBar } from "@/features/booking-search/BookingBar";
import { HeroBookingBar } from "@/features/booking-search/HeroBookingBar";
import { MobileBookingSearch } from "@/features/booking-search/MobileBookingSearch";
import { StaySearchProvider } from "@/features/booking-search/StaySearchProvider";
import { buildMetadata } from "@/seo/metadata";
import { BACKDROPS, readBackdrop } from "../booking-search/preview-options";
import { loadPropertyOptions } from "../booking-search/properties";

/**
 * DESIGN COMPOSITION for section 03.1, site header and navigation. NOT the production header.
 *
 * It lays out the proposed states as still frames so the direction can be judged next to the
 * booking bar: nothing here navigates, opens or responds to scrolling, and none of it is
 * reused by the site. The booking bar and pill are the real section 02.1 components, placed
 * unchanged. See docs/sections/03.1-header-navigation-spec.md. Never indexed.
 */
export const metadata = buildMetadata({ title: "Bố cục đề xuất: header và điều hướng", path: () => "/dev/header", noindex: true });

/** Proposal content. In production this comes from configuration, not from the component. */
const NAV = ["Stay", "Partner", "Về VNest", "Liên hệ"] as const;

/**
 * Stand-in for the logo. The official asset has not been supplied, so this is plain text in
 * the box the logo will occupy. No mark is drawn or invented.
 */
function LogoSlot({ tone, compact = false }: { tone: "light" | "dark"; compact?: boolean }) {
  return (
    <span
      className={`flex items-center font-semibold tracking-tight ${compact ? "h-6 text-lg" : "h-7 text-xl"} ${tone === "light" ? "text-white" : "text-ink"}`}
    >
      VNest
    </span>
  );
}

function Language({ tone }: { tone: "light" | "dark" }) {
  const base = tone === "light" ? "text-white" : "text-ink";
  return (
    <span className={`flex items-center gap-2 text-[0.8125rem] font-medium tracking-[0.08em] ${base}`}>
      <span className="underline underline-offset-[6px]">VI</span>
      <span aria-hidden="true" className="opacity-40">
        /
      </span>
      {/* English is shown as not yet available: no link, no hover, lower contrast. */}
      <span className="opacity-45">EN</span>
    </span>
  );
}

function MenuButton({ tone }: { tone: "light" | "dark" }) {
  return (
    <span className={`flex size-11 flex-col items-center justify-center gap-[5px] ${tone === "light" ? "text-white" : "text-ink"}`}>
      <span className="h-px w-5 bg-current" />
      <span className="h-px w-5 bg-current" />
    </span>
  );
}

function FrameTitle({ number, title, note }: { number: string; title: string; note: string }) {
  return (
    <header className="mx-auto max-w-site px-(--vn-gutter) pt-(--vn-space-12) pb-(--vn-space-4)">
      <p className="text-xs font-medium tracking-[0.12em] text-ink-muted uppercase">Khung {number}</p>
      <h2 className="mt-1 text-(length:--vn-text-xl) font-semibold">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">{note}</p>
    </header>
  );
}

/** A 390px-wide still of a phone screen. Fixed width so it reads the same at any window size. */
function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="w-[390px] shrink-0">
      <div className="relative h-[620px] overflow-hidden rounded-[1.25rem] border border-line bg-surface">{children}</div>
      <figcaption className="mt-2 text-sm text-ink-muted">{label}</figcaption>
    </figure>
  );
}

export default async function HeaderComposition({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [query, properties] = await Promise.all([searchParams, loadPropertyOptions()]);
  const backdrop = BACKDROPS[readBackdrop(query.bg)];
  const tone = backdrop.dark ? "light" : "dark";
  // A soft scrim keeps the header legible over any image without a bar of its own.
  const scrim = backdrop.dark ? "linear-gradient(180deg, rgb(0 0 0 / 0.32), transparent)" : "linear-gradient(180deg, rgb(255 255 255 / 0.5), transparent)";
  const filler = (count: number) => (
    <div className="mx-auto grid max-w-site gap-4 px-(--vn-gutter) py-6 md:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="h-28 rounded-(--vn-radius-md) bg-surface-muted" />
      ))}
    </div>
  );

  return (
    <StaySearchProvider properties={properties} target={{ kind: "dev-preview" }}>
      <main className="pb-(--vn-space-16)">
        <div className="mx-auto max-w-site px-(--vn-gutter) pt-(--vn-space-8)">
          <p className="inline-block rounded-full bg-surface-muted px-3 py-1 text-xs font-medium">Bố cục đề xuất · Mục 03.1 · chưa phải header chính thức</p>
          <h1 className="mt-(--vn-space-3) text-(length:--vn-text-2xl) leading-(--vn-leading-tight) font-semibold">Header và điều hướng</h1>
          <p className="mt-(--vn-space-2) max-w-2xl text-ink-muted">
            Các khung dưới đây là ảnh tĩnh của từng trạng thái đề xuất. Liên kết không hoạt động và trang không phản ứng khi cuộn. Chữ “VNest” là chỗ
            giữ cho logo chính thức, chưa được cung cấp. Thanh tìm kiếm là thành phần thật của Mục 02.1, đặt nguyên trạng.
          </p>
        </div>

        <FrameTitle
          number="1"
          title="Desktop · đầu trang"
          note="Header trong suốt nằm trên ảnh hero, cao 72px. Logo bên trái, bốn mục ở giữa, VI / EN bên phải. Không có nền hay đường kẻ: chỉ một lớp phủ mờ phía trên ảnh."
        />
        <section className="relative flex min-h-[520px] flex-col" style={{ background: backdrop.background }}>
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32" style={{ background: scrim }} />
          <div className="relative mx-auto hidden h-[72px] w-full max-w-site grid-cols-[1fr_auto_1fr] items-center px-(--vn-gutter) lg:grid">
            <LogoSlot tone={tone} />
            <ul className={`flex items-center gap-10 text-[0.9375rem] font-medium ${tone === "light" ? "text-white" : "text-ink"}`}>
              {NAV.map((item, index) => (
                <li key={item} className={index === 0 ? "underline decoration-1 underline-offset-[8px]" : ""}>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Language tone={tone} />
            </div>
          </div>
          <p className="relative px-(--vn-gutter) py-4 text-sm text-ink-muted lg:hidden">Khung này dành cho màn hình từ 1024px.</p>
          <div className="relative mt-auto px-(--vn-gutter) pb-12">
            <HeroBookingBar />
          </div>
        </section>

        <FrameTitle
          number="2"
          title="Desktop · sau khi cuộn"
          note="Một hàng duy nhất cao 64px. Thanh tìm kiếm thu gọn thay vào vị trí của bốn mục điều hướng; các mục đó chuyển vào nút menu bên phải. Header và thanh tìm kiếm không xếp chồng thành hai hàng."
        />
        <section className="border-y border-line bg-surface">
          <div className="border-b border-line">
            <div className="mx-auto hidden h-16 max-w-site grid-cols-[1fr_minmax(0,40rem)_1fr] items-center gap-6 px-(--vn-gutter) lg:grid">
              <LogoSlot tone="dark" compact />
              <BookingBar variant="compact" className="flex" />
              <div className="flex items-center justify-end gap-4">
                <Language tone="dark" />
                <MenuButton tone="dark" />
              </div>
            </div>
            <p className="px-(--vn-gutter) py-4 text-sm text-ink-muted lg:hidden">Khung này dành cho màn hình từ 1024px.</p>
          </div>
          {filler(4)}
        </section>

        <FrameTitle
          number="3"
          title="Mobile · 390px"
          note="Đầu trang, sau khi cuộn và menu mở. Trên điện thoại, điều hướng luôn nằm trong nút menu; VI / EN nằm trong menu để hàng trên cùng chỉ còn logo, ô tìm kiếm và menu."
        />
        <div className="mx-auto flex max-w-site flex-wrap gap-6 px-(--vn-gutter)">
          <Phone label="3a · Đầu trang: header trong suốt 56px, ô tìm kiếm nổi phía dưới ảnh">
            <div className="flex h-full flex-col" style={{ background: backdrop.background }}>
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24" style={{ background: scrim }} />
              <div className="relative flex h-14 items-center justify-between pr-1 pl-4">
                <LogoSlot tone={tone} compact />
                <MenuButton tone={tone} />
              </div>
              <div className="relative mt-auto px-4 pb-8">
                <MobileBookingSearch variant="hero" className="flex" />
              </div>
            </div>
          </Phone>

          <Phone label="3b · Sau khi cuộn: một hàng 64px gồm logo, ô tìm kiếm thu gọn và menu">
            <div className="flex h-16 items-center gap-3 border-b border-line bg-surface pr-1 pl-4">
              <LogoSlot tone="dark" compact />
              <div className="min-w-0 flex-1">
                <MobileBookingSearch variant="compact" className="flex" />
              </div>
              <MenuButton tone="dark" />
            </div>
            <div className="grid gap-3 p-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} aria-hidden="true" className="h-28 rounded-(--vn-radius-md) bg-surface-muted" />
              ))}
            </div>
          </Phone>

          <Phone label="3c · Menu mở: toàn màn hình, chữ lớn, ngôn ngữ ở cuối">
            <div className="flex h-full flex-col bg-surface">
              <div className="flex h-14 items-center justify-between pr-1 pl-4">
                <LogoSlot tone="dark" compact />
                <span className="flex size-11 items-center justify-center text-2xl leading-none font-light text-ink">×</span>
              </div>
              <ul className="flex flex-col px-4 pt-6">
                {NAV.map((item, index) => (
                  <li key={item} className="flex h-16 items-center border-b border-line text-[1.625rem] font-medium tracking-tight">
                    <span className={index === 0 ? "underline decoration-1 underline-offset-[10px]" : ""}>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between px-4 pb-8">
                <Language tone="dark" />
                <span className="text-xs text-ink-muted">Bản tiếng Anh chưa có</span>
              </div>
            </div>
          </Phone>
        </div>
      </main>
    </StaySearchProvider>
  );
}
