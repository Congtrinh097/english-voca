# Admin WebMCP — kế hoạch triển khai đề xuất

Ngày: 2026-09-22. Trạng thái: bản kế hoạch để review, chưa triển khai.

## Mục tiêu và giả định

AI agent có thể khám phá công cụ, tìm/tạo/sửa/xóa chủ đề và từ vựng, import và đặt trạng thái xuất bản bằng quyền admin hiện có. Kết quả phải hiển thị đồng bộ trên UI và kiểm tra được trong database.

Giả định lập kế hoạch: giai đoạn đầu dùng WebMCP trong tab admin đã đăng nhập. Lựa chọn browser-only, remote MCP hoặc cả hai đang chờ người dùng xác định. Đây là nhánh thiết kế có điều kiện, không phải quyết định đã được duyệt.

WebMCP trong trình duyệt không tự tạo một MCP server URL cho agent từ xa. Nếu cần client MCP kết nối độc lập với tab trình duyệt, phải bổ sung transport và xác thực riêng.

## Bằng chứng từ dự án

- Next.js 14 App Router, React 18, NextAuth JWT, Prisma/PostgreSQL; deploy Cloud Run tối đa 3 instance.
- app/admin/layout.tsx là điểm gắn provider cho toàn bộ trang admin.
- app/admin/topics/page.tsx và app/admin/topics/[id]/words/page.tsx tự fetch và giữ state bằng useState; router.refresh đơn lẻ không đảm bảo tải lại các danh sách này.
- GET /api/topics có all=1 cho admin, phân trang cố định 12 bản ghi; UI hiện chỉ tải page=1.
- requireAdmin trong lib/api-helpers.ts kiểm tra user tồn tại trong DB nhưng đọc role từ JWT. Cần kiểm tra role hiện tại trong DB để thu hồi quyền có hiệu lực ngay.
- PATCH publish hiện đảo trạng thái; gọi lại không an toàn về ý nghĩa nghiệp vụ.
- PUT chủ đề/từ yêu cầu payload đầy đủ theo lib/validations.ts.
- Import CSV hiện ghi các dòng hợp lệ dù có dòng lỗi; gửi lại có thể tạo thêm từ trùng.
- Xóa chủ đề cascade từ vựng, tiến độ học và kết quả quiz; phải thể hiện đúng phạm vi ảnh hưởng.
- Chưa thấy test runner trong package.json; workflow deploy build nhưng chưa có cổng test riêng.

## Các phương án

1. WebMCP Imperative API tại admin: tận dụng session và API, ít thay đổi hạ tầng; cần browser/agent hỗ trợ và mở tab. Đề xuất cho MVP nếu yêu cầu là WebMCP đúng nghĩa.
2. Remote MCP server: agent kết nối bằng URL, chạy không cần tab; cần xác thực token/OAuth, scopes, transport và kiểm thử tương thích client riêng.
3. Cả hai: dùng chung schema và service nghiệp vụ, hai adapter độc lập. Chia thành hai giai đoạn để xác minh từng đường kết nối.

## Kiến trúc MVP

Browser agent → document.modelContext → AdminWebMCPProvider → API cùng origin bằng session cookie → kiểm tra quyền + validation → service nghiệp vụ → Prisma → PostgreSQL.

- Dùng document.modelContext.registerTool theo tài liệu hiện tại; feature detection trước khi sử dụng. Không thiết kế mới quanh navigator.modelContext hoặc unregisterTool cũ.
- Đăng ký tại admin layout sau khi xác định admin; cleanup bằng AbortController khi rời admin/logout. Xử lý đăng ký bất đồng bộ và React StrictMode để không còn tool trùng hoặc tool mồ côi.
- Không đưa Prisma, khóa database hoặc session token vào schema/output của tool.
- Chỉ expose cùng origin; không mở cross-origin mặc định.
- Browser không hỗ trợ vẫn dùng admin bình thường và hiển thị trạng thái tích hợp không khả dụng.
- WebMCP annotations mô tả tool; không thay thế kiểm tra quyền ở server.
- Sau mutation phát sự kiện dữ liệu thay đổi theo topicId; các trang liên quan gọi lại load().

## Danh mục tool và mapping

| Tool | Input chính | REST / hành vi |
|---|---|---|
| admin_list_topics | level?, search?, page? | GET /api/topics?all=1; trả total, page, hasMore |
| admin_get_topic | topicId | GET /api/topics/:id; trả metadata quản trị |
| admin_suggest_topics | không | GET /api/topics/suggested; gợi ý học theo tài khoản admin, không phải gợi ý biên tập |
| admin_create_topic | title, titleVi, level, description?, thumbnailUrl?, requestId | POST /api/topics; mặc định draft |
| admin_update_topic | topicId, payload đầy đủ, expectedVersion | PUT /api/topics/:id |
| admin_delete_topic | topicId, expectedVersion | DELETE /api/topics/:id; hiển thị ảnh hưởng cascade |
| admin_set_topic_published | topicId, isPublished, expectedVersion | PATCH /api/topics/:id/publish; đặt trạng thái đích |
| admin_list_words | topicId, page?, pageSize? | GET /api/topics/:id/words; bổ sung phân trang tùy chọn |
| admin_create_word | topicId, word, definition, example, meaningVi, trường tùy chọn, requestId | POST /api/topics/:id/words |
| admin_update_word | topicId, wordId, payload đầy đủ, expectedVersion | PUT /api/topics/:id/words/:wid |
| admin_delete_word | topicId, wordId, expectedVersion | DELETE /api/topics/:id/words/:wid |
| admin_import_words | topicId, csv hoặc words[], dryRun, requestId khi ghi | POST /api/topics/:id/words/bulk; preview trước, import atomic ở chế độ mới |

Giữ admin_suggest_topics để bao phủ endpoint đã yêu cầu, nhưng mô tả đúng ý nghĩa và không dùng nó thay công cụ tìm chủ đề cần biên tập.

Schema tool dùng JSON Schema, không cho thuộc tính thừa. Validation server là nguồn quyết định. Level chỉ beginner/middle/master; UUID hợp lệ; các giới hạn trường lấy từ lib/validations.ts. words[] dùng schema từ vựng tương tự CSV, không bắt agent tự ghép chuỗi CSV.

Output thống nhất: thành công {ok:true,data,requestId?}; lỗi {ok:false,error:{code,message,fieldErrors?,retryable},requestId?}. Mã lỗi gồm UNAUTHENTICATED, FORBIDDEN, VALIDATION_ERROR, NOT_FOUND, CONFLICT, RATE_LIMITED, OUTCOME_UNKNOWN và INTERNAL_ERROR. Không trả stack trace hoặc nội dung bí mật.

## Thay đổi backend trước khi mở tool ghi

1. Đọc role hiện tại từ DB trong requireAdmin; admin bị hạ quyền không được ghi dù JWT còn hạn. Các tool đọc quản trị chỉ đăng ký cho admin; API đọc dành cho learner vẫn giữ hợp đồng hiện có.
2. PATCH publish chấp nhận {isPublished:boolean,expectedVersion}; UI chuyển sang gửi trạng thái đích. Giữ nhánh legacy không body trong thời gian chuyển tiếp, tool luôn dùng trạng thái đích; kiểm thử và ghi rõ thời điểm bỏ legacy.
3. Thêm version số nguyên cho Topic và Word. Mọi đường ghi, kể cả UI và import, cập nhật version; expectedVersion không khớp trả 409. Thay đổi từ tăng version chủ đề trong cùng transaction để preview xóa chủ đề không dùng dữ liệu cũ.
4. Idempotency cho create và import: bảng AdminOperation unique theo actorId + operation + requestId, lưu inputHash và kết quả trong cùng transaction với mutation. Cùng khóa/cùng input trả kết quả cũ; khác input trả 409. Áp dụng tại PostgreSQL để hoạt động qua nhiều instance Cloud Run; giữ bản ghi tối thiểu 7 ngày và nêu rõ cửa sổ retry.
5. Import mới có dryRun không ghi; mặc định atomic, tối đa 200 từ hoặc 256 KiB/request, trả lỗi theo dòng/chỉ số. Nếu có dòng không hợp lệ thì không ghi dòng nào. Cảnh báo từ trùng trong batch và DB; không tự ý upsert theo word vì schema hiện chưa coi word là duy nhất trong một chủ đề. Chế độ legacy CSV giữ nguyên tới khi UI chuyển sang chế độ mới.
6. Audit AdminAuditLog cho các mutation admin: actorId, action, entityId, requestId, thời gian, tóm tắt trước/sau và số bản ghi ảnh hưởng. Ghi cùng transaction; không ghi cookie/token. Header nguồn webmcp chỉ là nhãn tự khai, không là chứng cứ xác thực.
7. Mutation cùng origin kiểm tra Origin/CSRF theo cơ chế thống nhất; tool không được nhận URL tùy ý. Rate limit ghi dùng bộ đếm dùng chung trong PostgreSQL cho MVP, không dùng Map riêng mỗi container; cấu hình đề xuất 60 mutation/phút/admin, import 5/phút/admin.

Hủy fetch hoặc timeout không chứng minh server đã rollback. Trả OUTCOME_UNKNOWN khi không xác định; retry create/import bằng cùng requestId, thao tác khác đọc lại state/version trước khi quyết định gọi tiếp.

## Trải nghiệm admin

- Hiển thị trạng thái WebMCP và hoạt động gần nhất, không yêu cầu thêm khóa AI ở frontend.
- Đọc/tạo/sửa theo lệnh đã được giao không bật hộp thoại cho từng bản ghi.
- Đề xuất preview + một xác nhận theo batch cho xóa cascade; đây là lựa chọn sản phẩm cần chốt, không phải giả định rằng WebMCP tự bảo đảm xác nhận. Không coi confirmed:true từ model là sự đồng ý của người dùng.
- MVP tool xóa dùng cùng luồng xác nhận hiện có của UI, mở rộng thông tin ảnh hưởng; không tuyên bố đây là ranh giới bảo mật chống extension đã có toàn quyền trên tab.
- Hiển thị kết quả import rõ imported/errors; lỗi không đóng form hoặc báo thành công giả.
- Danh sách admin hỗ trợ các trang tiếp theo để người dùng nhìn thấy dữ liệu agent tìm được.

## Các gói triển khai theo thứ tự

- [ ] 1. Kiểm chứng kết nối: chọn browser và agent thực tế; bật WebMCP local hoặc origin trial phù hợp; đăng ký một tool read-only trên môi trường thử và chứng minh agent discovery/call được. Ghi lại phiên bản, điều kiện bật API, kết quả thử. Không coi chỉ có feature detection là đủ để nghiệm thu kết nối agent.
- [ ] 2. Hợp đồng và backend: sửa auth, publish, thêm version/idempotency/audit, chuẩn hóa lỗi; migration chỉ thêm cột/bảng. Test quyền bị thu hồi, request trùng qua hai kết nối DB, version conflict, rollback audit cùng mutation.
- [ ] 3. Tool đọc: schema + registry + provider; list/get/suggest/words, pagination và lỗi session. Test learner không thấy tool, browser không hỗ trợ vẫn hoạt động, chuyển route/StrictMode không đăng ký trùng.
- [ ] 4. Tool ghi đơn: create/update/set-published, delete với phạm vi ảnh hưởng; đồng bộ UI. Test retry không tạo bản ghi thứ hai, publish lặp giữ trạng thái, sai cặp topicId/wordId bị từ chối, xóa đúng cascade, cancel/timeout không báo rollback giả.
- [ ] 5. Import: tách parser/validator dùng chung, nhận words[] hoặc csv, dryRun và atomic commit; test dấu phẩy/ngoặc kép/newline trong CSV, Unicode tiếng Việt, dòng lỗi, vượt giới hạn, trùng dữ liệu và retry cùng requestId. Không dùng parser tách từng dòng hiện tại cho CSV có newline trong ô.
- [ ] 6. Kiểm thử tích hợp và phát hành: chạy typecheck, build, test backend với PostgreSQL riêng và browser smoke với WebMCP thực. CI chặn deploy nếu test lỗi. Rollout read-only → create/update/import → publish/delete, có feature flag tắt tool mà UI còn hoạt động.

Mỗi gói: viết test đặc tả hành vi, chạy để xác nhận fail đúng lý do, triển khai, chạy lại test và review diff. Dự kiến bổ sung Vitest cho unit/integration; browser automation chỉ chọn sau gói 1 vì phải xác nhận hỗ trợ WebMCP thực tế.

## File dự kiến

- components/admin/AdminWebMCPProvider.tsx: lifecycle đăng ký, trạng thái hỗ trợ.
- lib/webmcp/admin-tools.ts: catalog tên, schema, annotations, mapping.
- lib/webmcp/client.ts: fetch cùng origin, chuẩn hóa kết quả, cancellation.
- lib/webmcp/events.ts: thông báo invalidation theo chủ đề.
- types/webmcp.d.ts: typing tối thiểu theo browser target đã kiểm chứng, hoặc dùng webmcp-types được pin version.
- lib/admin/topics.ts, lib/admin/words.ts: nghiệp vụ server dùng chung với REST, sẵn sàng cho remote adapter.
- lib/admin/operations.ts, lib/admin/audit.ts: idempotency và audit dùng transaction.
- lib/admin/import-words.ts: parse/validate/preview/import.
- lib/api-helpers.ts, lib/validations.ts và các route topics hiện có: auth và contract mới.
- app/admin/layout.tsx và hai trang topics/words: gắn provider, đồng bộ state, phân trang, payload trạng thái đích.
- prisma/schema.prisma + migration mới: version, AdminOperation, AdminAuditLog, bộ đếm rate limit.
- tests/admin-api/, tests/webmcp/: kiểm thử các gói tương ứng; package.json và .github/workflows/deploy.yml: lệnh test/cổng CI.
- deploy/README.md: điều kiện browser/agent, feature flags, rollout, rollback và cách điều tra requestId.

## Nghiệm thu end-to-end

Agent được giao: tạo chủ đề Travel ở beginner, thêm 12 từ với nghĩa tiếng Việt và ví dụ, sửa một từ, liệt kê kiểm tra, xuất bản rồi ẩn lại. Thực hiện qua tool, UI cập nhật ngay; database và audit khớp. Import có một dòng lỗi không ghi gì ở chế độ atomic. Gửi lại request sau timeout không nhân đôi dữ liệu. Người không phải admin hoặc vừa bị thu hồi quyền không ghi được. Xóa chủ đề thử nghiệm hiển thị đúng ảnh hưởng trước khi thực hiện.

Production tiếp tục dùng Cloud Run + Supabase. Migration chạy trước deploy như pipeline hiện tại; migration phải tương thích revision cũ. Rollback bằng tắt feature flag và quay revision, không drop bảng audit/operation và không hoàn tác dữ liệu người dùng tự động. Flag client NEXT_PUBLIC_* là build-time; cần server runtime flag nếu muốn tắt ngay không rebuild.

## Nhánh remote MCP nếu được chọn

Thêm /api/mcp với Streamable HTTP, dùng chung service/schema; xác thực agent bằng cơ chế token/OAuth phù hợp client, ánh xạ về actor admin hiện tại và scopes đọc/ghi/xóa. Không tái sử dụng cookie trình duyệt như credential dài hạn cho agent. Kiểm thử discovery/call bằng từng client được chọn; không hứa Codex/Claude tự kết nối được chỉ vì trang có WebMCP. State bắt buộc dùng DB hoặc transport stateless phù hợp Cloud Run nhiều instance. Nhánh này cần kế hoạch xác thực/client compatibility riêng sau khi xác định agent mục tiêu.

## Nguồn đối chiếu ngày 2026-09-22

- https://developer.chrome.com/docs/ai/webmcp — trạng thái thử nghiệm, feature flag, origin trial, browser workflow.
- https://developer.chrome.com/docs/ai/webmcp/imperative-api — document.modelContext, lifecycle bằng AbortSignal, annotations.
- https://developer.chrome.com/docs/ai/webmcp/secure-tools — giới hạn của annotations và cross-origin exposure.
- https://modelcontextprotocol.io/specification/2026-07-28/basic/transports — phân biệt remote MCP Streamable HTTP.

## Kết quả tự review

Đã mapping đủ 12 thao tác người dùng liệt kê. Đã tách trạng thái hiện có khỏi thay đổi đề xuất, giữ API learner và luồng admin hiện tại trong chuyển tiếp, chỉ rõ các test cho retry/concurrency/thu hồi quyền/cancel/import/UI lifecycle. Browser/agent mục tiêu và chế độ kết nối là quyết định còn mở; tài liệu chưa được xem là spec đã phê duyệt hoặc lệnh triển khai.
