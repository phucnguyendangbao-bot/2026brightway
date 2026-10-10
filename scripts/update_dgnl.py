#!/usr/bin/env python3
"""Update admission methods in schools.json with accurate 2026 data."""
import json
import sys
from pathlib import Path

JSON_PATH = Path(r"e:\PROJECT 2026\AIYOUNGGURU-main\assets\data\schools.json")

# Định nghĩa phương thức ĐGNL chính xác cho từng trường
# Format: school_id -> list of method names (V-ACT, HSA, TSA, V-SAT, H-SCA, ĐGNL-chuyên-biệt)
SCHOOL_DGNL = {
    # HCMUT: dùng V-ACT (ĐGNL ĐHQG-HCM) kết hợp - hệ thống ĐHQG-HCM
    "hcmut": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    "hcmut-oisp": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    "hcmut-ai": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    "uit": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    "uit-ai": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    "fpt": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    "fpt-ai": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # UEH: V-ACT (KSA - cơ sở chính), V-SAT (KSV - phân hiệu Vĩnh Long)
    "ueh": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": True, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # FTU: V-ACT (ĐGNL ĐHQG-HCM) + HSA (ĐGNL ĐHQG-HN)
    "ftu": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # VLU: V-ACT + HSA + TSA + V-SAT (rất nhiều kỳ thi)
    "vlu": {"V-ACT": True, "HSA": True, "TSA": True, "V-SAT": True, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # PNT: Y khoa Phạm Ngọc Thạch - THPT là chính, có thể dùng V-ACT
    "pnt": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # CTUMP: Y Dược Cần Thơ - chủ yếu THPT
    "ctump": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # UMP: Y Dược TP.HCM
    "ump": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # USSH: chỉ dùng HSA (ĐHQG-HN) - không V-ACT
    "ussh": {"V-ACT": False, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # RMIT: chỉ chứng chỉ quốc tế
    "rmit": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # HUB: V-SAT (chính) - ĐH Ngân hàng TP.HCM tổ chức
    "hub": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": True, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # HCMUE: H-SCA (ĐGNL chuyên biệt - Sư phạm TPHCM) - kết hợp học bạ
    "hcmue": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": True, "ĐGNL-chuyên-biệt": True},
    # CTU: V-SAT (ĐH Cần Thơ tổ chức - chính)
    "ctu": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": True, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # DTHU: Đồng Tháp
    "dthu": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # HCMUS: V-ACT (ĐGNL ĐHQG-HCM) - tổng hợp
    "hcmus": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # TDTU: V-ACT (PT2 riêng)
    "tdtu": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # NTTU: nhận V-ACT, HSA, V-SAT, H-SCA
    "nttu": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": True, "H-SCA": True, "ĐGNL-chuyên-biệt": False},
    # HCMIU: V-ACT (tổng hợp)
    "hcmiu": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # NLU: V-ACT (ĐGNL ĐHQG-HCM)
    "nlu": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # HUFI: V-ACT (ĐGNL ĐHQG-HCM) + H-SCA (ĐHSP TPHCM)
    "hufi": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": True, "ĐGNL-chuyên-biệt": False},
    # HUEMED: V-ACT + HSA (chỉ một số ngành)
    "huemed": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # SMP-UDN: Y Dược Đà Nẵng - theo ĐH Đà Nẵng
    "smp-udn": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # DUYTAN: V-ACT + V-SAT
    "duytan": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": True, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # DUE: Kinh tế Đà Nẵng - V-ACT + HSA
    "due": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # NTU: V-ACT + HSA
    "ntu": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # DONGA: Đông Á
    "donga": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # DUT: Bách khoa ĐN - TSA (ĐHBK HN)
    "dut": {"V-ACT": False, "HSA": False, "TSA": True, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # QNU: V-ACT + ĐGNL Sư phạm HN
    "qnu": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": True},
    # HUSC: Khoa học Huế - V-ACT + HSA + ĐGNL Sư phạm
    "husc": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": True},
    # HUAF: Nông Lâm Huế - V-ACT + HSA + SPT
    "huaf": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": True},
    # HUCFL: KHXH&NV Huế - V-ACT + HSA + SPT
    "hucfl": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": True},
    # PHUXUAN: Phú Xuân
    "phuxuan": {"V-ACT": False, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # VKU: Công nghệ TT&TT Việt-Hàn (ĐH ĐN) - V-ACT + HSA
    "vku": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # DNU: ĐH Đà Nẵng - V-ACT + HSA
    "dnu": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # KHTN-HCM: trùng với hcmus - V-ACT
    "khtn-hcm": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # HUE-UNI: ĐH Huế - V-ACT + HSA + SPT
    "hue-uni": {"V-ACT": True, "HSA": True, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": True},
    # SGU: Sài Gòn - V-ACT + V-SAT
    "sgu": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": True, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
    # UEL: V-ACT (tổng hợp)
    "uel": {"V-ACT": True, "HSA": False, "TSA": False, "V-SAT": False, "H-SCA": False, "ĐGNL-chuyên-biệt": False},
}


def build_dgnl_subjects(d):
    """Build subject string from dict."""
    parts = []
    if d.get("V-ACT"):
        parts.append("V-ACT (ĐGNL ĐHQG-HCM)")
    if d.get("HSA"):
        parts.append("HSA (ĐGNL ĐHQG-HN)")
    if d.get("TSA"):
        parts.append("TSA (ĐGNL tư duy ĐHBK-HN)")
    if d.get("V-SAT"):
        parts.append("V-SAT (ĐH Cần Thơ tổ chức)")
    if d.get("H-SCA"):
        parts.append("H-SCA (ĐH Sư phạm TP.HCM)")
    if d.get("ĐGNL-chuyên-biệt"):
        parts.append("ĐGNL chuyên biệt (ĐHSP HN/HCM)")
    return " + ".join(parts) if parts else ""


def build_dgnl_note(d):
    parts = []
    if d.get("V-ACT"):
        parts.append("V-ACT: đăng ký tại thinangluc.vnuhcm.edu.vn (ĐHQG-HCM)")
    if d.get("HSA"):
        parts.append("HSA: đăng ký tại ĐHQG Hà Nội")
    if d.get("TSA"):
        parts.append("TSA: kỳ thi đánh giá tư duy của ĐH Bách khoa Hà Nội")
    if d.get("V-SAT"):
        parts.append("V-SAT: đăng ký tại vsat.ctu.edu.vn")
    if d.get("H-SCA"):
        parts.append("H-SCA: thi trên máy tính tại HCMUE")
    if d.get("ĐGNL-chuyên-biệt"):
        parts.append("ĐGNL chuyên biệt: ĐHSP HN hoặc HCM tổ chức")
    return "; ".join(parts) if parts else ""


def build_timeline(d):
    parts = []
    if d.get("V-ACT"):
        parts.append("V-ACT đợt 1 (5/4) hoặc đợt 2 (24/5)")
    if d.get("HSA"):
        parts.append("HSA tháng 3-5")
    if d.get("TSA"):
        parts.append("TSA tháng 3-5")
    if d.get("V-SAT"):
        parts.append("V-SAT: 7 đợt từ tháng 1-7")
    if d.get("H-SCA"):
        parts.append("H-SCA: 3 đợt (3, 5, 6)")
    if d.get("ĐGNL-chuyên-biệt"):
        parts.append("SPT: 2 đợt (5-6)")
    return " | ".join(parts) if parts else "Không áp dụng"


def main():
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    updated = 0

    for school in data:
        sid = school["id"]
        d = SCHOOL_DGNL.get(sid)
        if not d:
            continue

        dgnl_subjects = build_dgnl_subjects(d)
        dgnl_note = build_dgnl_note(d)
        dgnl_timeline = build_timeline(d)
        has_dgnl = any(d.values())

        # Tìm và cập nhật admissionMethods
        methods = school.get("admissionMethods", [])

        # Cập nhật hoặc thêm mới method "Xét điểm Đánh giá năng lực (ĐGNL)"
        found = False
        for m in methods:
            if "ĐGNL" in m.get("name", "") or "Đánh giá năng lực" in m.get("name", ""):
                if has_dgnl:
                    m["name"] = "Xét điểm Đánh giá năng lực (ĐGNL/TSA/V-SAT/H-SCA)"
                    m["subjects"] = dgnl_subjects
                    m["timeline"] = dgnl_timeline
                    m["note"] = dgnl_note
                    # Tỉ trọng tùy trường
                    m["quota"] = "20-40%" if d.get("V-ACT") or d.get("HSA") else "5-15%"
                else:
                    # Trường không dùng ĐGNL → bỏ method này
                    m["name"] = "(Không áp dụng) Phương thức ĐGNL"
                    m["note"] = "Trường không sử dụng V-ACT, HSA, TSA, V-SAT, H-SCA"
                found = True
                break

        if not found and has_dgnl:
            # Thêm mới
            methods.append({
                "name": "Xét điểm Đánh giá năng lực (ĐGNL/TSA/V-SAT/H-SCA)",
                "subjects": dgnl_subjects,
                "quota": "20-40%",
                "timeline": dgnl_timeline,
                "note": dgnl_note
            })

        school["admissionMethods"] = methods
        updated += 1

    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {updated} schools.")


if __name__ == "__main__":
    main()
