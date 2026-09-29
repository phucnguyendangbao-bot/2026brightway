# Hướng dẫn chạy Migration Supabase

## ❌ Lỗi gặp phải
```
ERROR: 42703: column "role" does not exist
```
→ Nguyên nhân: trigger `handle_new_user()` cũ trong project tham chiếu cột `role` không tồn tại.

## ✅ Cách fix

### Bước 1: Mở SQL Editor
```
https://supabase.com/dashboard/project/nybtwbkkbiqedqqqxqcc/sql/new
```

### Bước 2: Chạy từng phần (QUAN TRỌNG!)

Không chạy toàn bộ file `001_init.sql` 1 lần. Chạy theo 3 phases:

---

#### PHASE 1: DROP + CREATE tables
Copy nội dung từ đầu file đến dòng `-- ========== ROW LEVEL SECURITY (RLS)`, paste vào SQL Editor → Run.

#### PHASE 2: RLS
Copy phần ROW LEVEL SECURITY → Run.

#### PHASE 3: Functions + Triggers + Sample data
Copy phần còn lại → Run.

---

### Bước 3: Verify

Vào Table Editor:
```
https://supabase.com/dashboard/project/nybtwbkkbiqedqqqxqcc/editor
```

Kiểm tra có 5 bảng:
- ✅ profiles
- ✅ posts
- ✅ majors (có 10 sample rows)
- ✅ tags
- ✅ post_tags

---

## 🔧 Nếu vẫn lỗi

Chạy SQL này TRƯỚC để drop trigger cũ:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

Sau đó chạy lại Phase 1 → 2 → 3.