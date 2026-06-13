import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng (Terms of Service) của English Voca.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-3xl font-extrabold">Điều khoản sử dụng</h1>
      <p className="mb-8 text-sm text-slate-500">
        Terms of Service — Cập nhật lần cuối: 13/06/2026
      </p>

      <section className="space-y-6 leading-relaxed text-slate-700">
        <div>
          <h2 className="mb-2 text-xl font-bold">1. Chấp nhận điều khoản</h2>
          <p>
            Khi tạo tài khoản và sử dụng English Voca, bạn đồng ý với các điều
            khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng ứng dụng.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">2. Dịch vụ</h2>
          <p>
            English Voca cung cấp công cụ học từ vựng tiếng Anh theo chủ đề:
            flashcard, quiz trắc nghiệm, điểm Glory Points và bảng xếp hạng.
            Dịch vụ được cung cấp miễn phí và &quot;nguyên trạng&quot; (as is);
            chúng tôi có thể thay đổi, tạm ngừng hoặc chấm dứt dịch vụ vào bất
            kỳ lúc nào.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">3. Tài khoản</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
            <li>Mỗi người chỉ nên sử dụng một tài khoản.</li>
            <li>
              Chúng tôi có quyền khóa tài khoản vi phạm (gian lận điểm, phá
              hoại hệ thống, nội dung không phù hợp).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">4. Quy tắc sử dụng</h2>
          <p>
            Bạn không được: can thiệp kỹ thuật vào hệ thống, khai thác lỗ hổng,
            gửi yêu cầu tự động quá mức, hoặc sử dụng ứng dụng cho mục đích vi
            phạm pháp luật.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">5. Sở hữu trí tuệ</h2>
          <p>
            Nội dung học liệu, giao diện và mã nguồn của ứng dụng thuộc về
            English Voca. Bạn được sử dụng cho mục đích học tập cá nhân, không
            sao chép để phân phối lại vì mục đích thương mại.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">6. Giới hạn trách nhiệm</h2>
          <p>
            Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh
            từ việc sử dụng hoặc không thể sử dụng dịch vụ, trong phạm vi pháp
            luật cho phép.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">7. Liên hệ</h2>
          <p>
            Mọi câu hỏi về điều khoản sử dụng, vui lòng liên hệ:{" "}
            <a
              href="mailto:congtrinh097@gmail.com"
              className="font-medium text-blue-600 underline"
            >
              congtrinh097@gmail.com
            </a>
          </p>
        </div>
      </section>

      <div className="mt-10 flex gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline">
          ← Về trang chủ
        </Link>
        <Link href="/privacy" className="text-blue-600 underline">
          Chính sách bảo mật
        </Link>
      </div>
    </main>
  );
}
