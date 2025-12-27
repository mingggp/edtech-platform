import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from io import BytesIO
from PIL import Image # เพิ่มบรรทัดนี้เพื่อใช้ Type Hint

# ✅ ฟังก์ชันคำนวณ CRC16 (XMODEM)
def crc16(data: bytes):
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if (crc & 0x8000):
                crc = (crc << 1) ^ 0x1021
            else:
                crc = crc << 1
    return crc & 0xFFFF

# ✅ แก้ Type Hint ตรง return เป็น Image.Image หรือ object ทั่วไป
def make_qr_image(promptpay_id: str, amount: float = 0.0):
    """
    Generate PromptPay QR Code
    """
    pp_id = promptpay_id.strip()
    is_phone = len(pp_id) == 10 and pp_id.startswith('0')
    
    if is_phone:
        target = f"0066{pp_id[1:]}"
    else:
        target = pp_id # ID Card or Tax ID (13 digits)

    # TLV 29: Merchant Information
    tag29 = f"0016A00000067701011101130066{target[4:]}" if is_phone else f"0016A0000006770101110113{target}"
    
    # Payload Construction
    payload = [
        "000201",
        "010211",
        f"29{len(tag29):02}{tag29}",
        "5802TH",
        "5303764",
    ]

    if amount > 0:
        amt_str = f"{amount:.2f}"
        payload.append(f"54{len(amt_str):02}{amt_str}")

    # Checksum calculation
    raw_data = "".join(payload) + "6304" 
    crc_val = crc16(raw_data.encode("ascii"))
    full_payload = raw_data + f"{crc_val:04X}"

    # Generate QR Image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(full_payload)
    qr.make(fit=True)

    # ✅ ใช้ StyledPilImage ซึ่งเป็นมาตรฐานของ qrcode library
    img = qr.make_image(image_factory=StyledPilImage, module_drawer=RoundedModuleDrawer())
    return img