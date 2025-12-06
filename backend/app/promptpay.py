import qrcode
from io import BytesIO

def generate_payload(id_value: str, amount: float = 0.0) -> str:
    payload = "000201"
    payload += "010212" if amount > 0 else "010211"
    target = id_value.replace("-", "")
    if len(target) == 10 and target.startswith("0"): target = "0066" + target[1:]
    merchant_data = f"0016A00000067701011101{len(target):02}{target}"
    payload += f"29{len(merchant_data):02}{merchant_data}"
    payload += "5802TH" + "5303764"
    if amount > 0:
        amt_str = f"{amount:.2f}"
        payload += f"54{len(amt_str):02}{amt_str}"
    payload += "6304"
    crc = crc16_ccitt(payload.encode('ascii'))
    payload += f"{crc:04X}"
    return payload

def crc16_ccitt(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if (crc & 0x8000): crc = (crc << 1) ^ 0x1021
            else: crc = crc << 1
            crc &= 0xFFFF
    return crc

def make_qr_image(promptpay_id: str, amount: float):
    payload = generate_payload(promptpay_id, amount)
    img = qrcode.make(payload)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf