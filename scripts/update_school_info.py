#!/usr/bin/env python3
"""Update schools.json with campuses, programs, and provinces info."""
import json
from pathlib import Path

JSON_PATH = Path(r"e:\PROJECT 2026\AIYOUNGGURU-main\assets\data\schools.json")

# ============================================================
# THÔNG TIN CƠ SỞ, CHƯƠNG TRÌNH VÀ TỈNH ĐIỂM
# ============================================================
SCHOOL_INFO = {
    # TP.HCM & Nam Bộ
    "hcmut": {
        "campuses": ["Q.7, TP.HCM (Cơ sở chính)"],
        "programs": ["Chuẩn", "OISP/Tiên tiến", "Việt-Anh 2+2"],
        "provinces": "Toàn quốc (Điểm chuẩn Q.7)"
    },
    "hcmut-oisp": {
        "campuses": ["Q.7, TP.HCM"],
        "programs": ["OISP/Tiên tiến", "Việt-Anh 2+2"],
        "provinces": "Toàn quốc"
    },
    "hcmut-ai": {
        "campuses": ["Q.7, TP.HCM"],
        "programs": ["Chuẩn", "AI/Robotics"],
        "provinces": "Toàn quốc"
    },
    "uit": {
        "campuses": ["Q.9, TP.HCM (Khu Công nghệ cao)"],
        "programs": ["Chuẩn", "Việt-Anh", "CLIP"],
        "provinces": "Toàn quốc"
    },
    "uit-ai": {
        "campuses": ["Q.9, TP.HCM"],
        "programs": ["AI & Data", " Khoa học Dữ liệu"],
        "provinces": "Toàn quốc"
    },
    "fpt": {
        "campuses": ["Hà Nội (Khu CNC), TP.HCM, Đà Nẵng, Cần Thơ, Quy Nhơn"],
        "programs": ["FPT", "Aptech quốc tế"],
        "provinces": "Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Bình Dương, Quy Nhơn"
    },
    "fpt-ai": {
        "campuses": ["Hà Nội, TP.HCM, Đà Nẵng"],
        "programs": ["AI", "Khoa học Máy tính"],
        "provinces": "Hà Nội, TP.HCM, Đà Nẵng"
    },
    "ueh": {
        "campuses": ["Q.3, TP.HCM (Chính), Q.Bình Thạnh, Vĩnh Long (KSV)"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Mỹ (KSV)"],
        "provinces": "TP.HCM, Vĩnh Long, các tỉnh ĐBSCL"
    },
    "ftu": {
        "campuses": ["Q.1, TP.HCM (Chính), TP.HCM (Phân hiệu)"],
        "programs": ["Chuẩn", "Chất lượng cao", "Quốc tế"],
        "provinces": "TP.HCM, Hà Nội, Đà Nẵng (vùng phụ cận)"
    },
    "vlu": {
        "campuses": ["Q.5, TP.HCM (Văn Lang 1), Q.Bình Thạnh (Văn Lang 2)"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Anh", "Việt-Nhật"],
        "provinces": "TP.HCM, các tỉnh Nam Bộ"
    },
    "pnt": {
        "campuses": ["Q.5, TP.HCM"],
        "programs": ["Y khoa", "Răng Hàm Mặt", "Y đa khoa"],
        "provinces": "TP.HCM, các tỉnh Nam Bộ"
    },
    "ctump": {
        "campuses": ["Q.Ninh Kiều, Cần Thơ"],
        "programs": ["Y khoa", "Dược", "Y học Cổ truyền"],
        "provinces": "Cần Thơ, các tỉnh ĐBSCL"
    },
    "ump": {
        "campuses": ["Q.5, TP.HCM"],
        "programs": ["Y khoa", "Dược", "YTCC", "Y học Cổ truyền"],
        "provinces": "TP.HCM, Nam Bộ"
    },
    "ussh": {
        "campuses": ["Q.Hai Bà Trưng, Hà Nội"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Pháp"],
        "provinces": "Hà Nội, các tỉnh miền Bắc"
    },
    "rmit": {
        "campuses": ["Q.7, TP.HCM (TP.HCM Campus)"],
        "programs": ["Bachelor (Úc)", "Master (Úc)"],
        "provinces": "TP.HCM, Hà Nội (khóa online)"
    },
    "hub": {
        "campuses": ["Q.1, TP.HCM (Chính), Q.Tân Bình"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Anh"],
        "provinces": "TP.HCM, Hà Nội, Đà Nẵng"
    },
    "hcmue": {
        "campuses": ["Q.5, TP.HCM (Chính), Q.Phú Nhuận"],
        "programs": ["Sư phạm", "Giáo dục Mầm non", "Tâm lý học"],
        "provinces": "TP.HCM, các tỉnh Nam Bộ"
    },
    "ctu": {
        "campuses": ["Q.Ninh Kiều, Cần Thơ (Chính), Kiên Giang, Sóc Trăng"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Anh"],
        "provinces": "Cần Thơ, Kiên Giang, Sóc Trăng, ĐBSCL"
    },
    "dthu": {
        "campuses": ["TP.Cao Lãnh, Đồng Tháp"],
        "programs": ["Chuẩn", "Sư phạm"],
        "provinces": "Đồng Tháp, các tỉnh ĐBSCL"
    },
    "hcmus": {
        "campuses": ["Q.4, TP.HCM (Chính), Q.Thủ Đức"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Pháp", "Việt-Anh"],
        "provinces": "TP.HCM, Nam Bộ"
    },
    "tdtu": {
        "campuses": ["Q.7, TP.HCM"],
        "programs": ["Chuẩn", "Chất lượng cao", "Việt-Anh"],
        "provinces": "TP.HCM, Nam Bộ"
    },
    "nttu": {
        "campuses": ["Q.12, TP.HCM (NTC), TP.Cần Thơ, Nha Trang"],
        "programs": ["Chuẩn", "Chất lượng cao"],
        "provinces": "TP.HCM, Cần Thơ, Khánh Hòa"
    },
    "hcmiu": {
        "campuses": ["Q.7, TP.HCM (Phú Mỹ Hưng)"],
        "programs": ["Việt-Mỹ", "Chuẩn"],
        "provinces": "TP.HCM, các tỉnh Nam Bộ"
    },
    "nlu": {
        "campuses": ["Q.2, TP.HCM (Nông Lâm)"],
        "programs": ["Nông-Lâm-Ngư", "Chuẩn", "Việt-Anh"],
        "provinces": "TP.HCM, các tỉnh Nam Bộ"
    },
    "hufi": {
        "campuses": ["Q.12, TP.HCM (UIT), TP.HCM (HK), Q.8, Cần Thơ"],
        "programs": ["CNTT", "Kinh tế", "Luật"],
        "provinces": "TP.HCM, Cần Thơ, Nam Bộ"
    },
    "huemed": {
        "campuses": ["Q.5, TP.HCM"],
        "programs": ["Y khoa", "Dược"],
        "provinces": "TP.HCM, Nam Bộ"
    },
    "smp-udn": {
        "campuses": ["Q.Hải Châu, Đà Nẵng"],
        "programs": ["Y khoa", "Dược", "Y tế Công cộng"],
        "provinces": "Đà Nẵng, Quảng Nam, Thừa Thiên Huế"
    },
    "duytan": {
        "campuses": ["Q.Hải Châu, Đà Nẵng"],
        "programs": ["Chuẩn", "Việt-Anh", "Việt-Nhật", "Việt-Đức"],
        "provinces": "Đà Nẵng, Quảng Nam, các tỉnh Duyên hải Miền Trung"
    },
    "due": {
        "campuses": ["Q.Hải Châu, Đà Nẵng"],
        "programs": ["Kinh tế", "Tài chính", "Marketing"],
        "provinces": "Đà Nẵng, Quảng Nam, Thừa Thiên Huế"
    },
    "ntu": {
        "campuses": ["TX.Nha Trang, Khánh Hòa"],
        "programs": ["Nông-Lâm-Ngư", "Du lịch", "Nuôi trồng thủy sản"],
        "provinces": "Khánh Hòa, Phú Yên, Bình Định"
    },
    "donga": {
        "campuses": ["TP.Đà Nẵng"],
        "programs": ["Chuẩn", "Kỹ thuật", "Kinh tế"],
        "provinces": "Đà Nẵng, Quảng Nam"
    },
    "dut": {
        "campuses": ["Q.Liên Chiểu, Đà Nẵng"],
        "programs": ["Kỹ thuật", "CNTT", "Cơ khí", "Điện-Điện tử"],
        "provinces": "Đà Nẵng, Quảng Trị, Thừa Thiên Huế"
    },
    "qnu": {
        "campuses": ["Q.Lê Chân, Hải Phòng"],
        "programs": ["Sư phạm", "Khoa học Xã hội", "Luật"],
        "provinces": "Hải Phòng, Quảng Ninh, Thái Bình"
    },
    "husc": {
        "campuses": ["Q.Thuỷ Biều, Huế"],
        "programs": ["Khoa học", "Sư phạm", "Kỹ thuật"],
        "provinces": "Thừa Thiên Huế, Quảng Trị, Quảng Nam"
    },
    "huaf": {
        "campuses": ["Q.Hương Trà, Huế"],
        "programs": ["Nông nghiệp", "Chăn nuôi", "Thú y"],
        "provinces": "Thừa Thiên Huế, Quảng Nam, Quảng Trị"
    },
    "hucfl": {
        "campuses": ["Q.Hương Trà, Huế"],
        "programs": ["KHXH&NV", "Luật", "Ngôn ngữ"],
        "provinces": "Thừa Thiên Huế, Quảng Trị, Quảng Nam"
    },
    "phuxuan": {
        "campuses": ["Q.Hương Trà, Huế"],
        "programs": ["Kỹ thuật", "Kinh tế", "Sư phạm"],
        "provinces": "Thừa Thiên Huế"
    },
    "vku": {
        "campuses": ["Q.Liên Chiểu, Đà Nẵng (Khu CNC)"],
        "programs": ["CNTT", "Truyền thông", "An toàn không gian số"],
        "provinces": "Đà Nẵng, Quảng Nam, Bình Định"
    },
    "dnu": {
        "campuses": ["Q.Liên Chiểu, Đà Nẵng"],
        "programs": ["Luật", "Quản trị", "Kinh tế", "NN&HTNN"],
        "provinces": "Đà Nẵng, Quảng Nam, Quảng Ngãi"
    },
    "khtn-hcm": {
        "campuses": ["Q.4, TP.HCM"],
        "programs": ["Khoa học Tự nhiên", "Môi trường", "Sinh học"],
        "provinces": "TP.HCM, Nam Bộ"
    },
    "hue-uni": {
        "campuses": ["Q.Hương Trà, Huế (Chính), Q.Thuỷ Biều"],
        "programs": ["Đa ngành", "Luật", "Kinh tế", "Sư phạm"],
        "provinces": "Thừa Thiên Huế, Quảng Trị, Quảng Nam"
    },
    "sgu": {
        "campuses": ["Q.3, TP.HCM (Chính), Q.Bình Thạnh"],
        "programs": ["Kinh tế", "Luật", "CNTT", "Kiến trúc"],
        "provinces": "TP.HCM, Bình Dương, Đồng Nai"
    },
    "uel": {
        "campuses": ["Q.Bình Thạnh, TP.HCM"],
        "programs": ["Luật", "Kinh tế", "Quản trị", "CNTT"],
        "provinces": "TP.HCM, Bình Dương, Đồng Nai"
    },
}


def main():
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    updated = 0

    for school in data:
        sid = school["id"]
        info = SCHOOL_INFO.get(sid)
        if not info:
            continue

        school["campuses"] = info["campuses"]
        school["programs"] = info["programs"]
        school["provinces"] = info["provinces"]
        updated += 1

    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {updated} schools with campuses, programs, provinces.")


if __name__ == "__main__":
    main()
