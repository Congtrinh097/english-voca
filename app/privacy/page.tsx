import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Chính sách bảo mật (Privacy Policy) của English Voca.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-3xl font-extrabold">Chính sách bảo mật</h1>
      <p className="mb-8 text-sm text-slate-500">
        Privacy Policy — Cập nhật lần cuối: 13/06/2026
      </p>

      <section className="space-y-6 leading-relaxed text-slate-700">
        <div>
          <h2 className="mb-2 text-xl font-bold">1. Giới thiệu</h2>
          <p>
            English Voca là ứng dụng học từ vựng tiếng Anh theo chủ đề. Chúng
            tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ thông tin cá
            nhân mà bạn cung cấp khi sử dụng ứng dụng.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">2. Thông tin chúng tôi thu thập</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Thông tin tài khoản:</strong> tên hiển thị, địa chỉ email
              và mật khẩu (được mã hóa) khi bạn đăng ký trực tiếp.
            </li>
            <li>
              <strong>Đăng nhập bằng Google:</strong> khi bạn chọn đăng nhập
              bằng Google, chúng tôi nhận tên, địa chỉ email và ảnh đại diện từ
              tài khoản Google của bạn. Chúng tôi không truy cập bất kỳ dữ liệu
              nào khác trong tài khoản Google.
            </li>
            <li>
              <strong>Dữ liệu học tập:</strong> tiến độ học, kết quả quiz, điểm
              Glory Points và lịch sử hoạt động trong ứng dụng.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">3. Cách chúng tôi sử dụng thông tin</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Tạo và quản lý tài khoản của bạn.</li>
            <li>Lưu tiến độ học tập và hiển thị bảng xếp hạng.</li>
            <li>Gửi email liên quan đến tài khoản (xác minh, đặt lại mật khẩu).</li>
            <li>Cải thiện chất lượng ứng dụng.</li>
          </ul>
          <p className="mt-2">
            Chúng tôi <strong>không bán, trao đổi hay chia sẻ</strong> thông tin
            cá nhân của bạn cho bên thứ ba vì mục đích thương mại.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">4. Lưu trữ và bảo mật</h2>
          <p>
            Dữ liệu được lưu trữ an toàn trên hạ tầng Google Cloud. Mật khẩu
            được băm (hash) trước khi lưu. Chúng tôi áp dụng các biện pháp kỹ
            thuật hợp lý để bảo vệ dữ liệu khỏi truy cập trái phép.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">5. Quyền của bạn</h2>
          <p>
            Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân của
            mình bất kỳ lúc nào bằng cách liên hệ với chúng tôi qua email bên
            dưới. Khi tài khoản bị xóa, toàn bộ dữ liệu cá nhân liên quan sẽ
            được xóa khỏi hệ thống.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">6. Liên hệ</h2>
          <p>
            Mọi câu hỏi về chính sách bảo mật, vui lòng liên hệ:{" "}
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
        <Link href="/terms" className="text-blue-600 underline">
          Điều khoản sử dụng
        </Link>
      </div>
    </main>
  );
}
