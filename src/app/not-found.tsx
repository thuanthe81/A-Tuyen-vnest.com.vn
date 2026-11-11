import Link from "next/link";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-site px-(--vn-gutter) py-(--vn-space-16)">
      <h1 className="font-display text-(length:--vn-text-2xl) leading-(--vn-leading-tight)">Không tìm thấy trang</h1>
      <p className="mt-(--vn-space-4)">
        <Link href={routes.home()} className="underline">
          Về trang chủ
        </Link>
      </p>
    </main>
  );
}
