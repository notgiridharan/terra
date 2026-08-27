import os
import re
import json
from paddleocr import PaddleOCR


# ============================================================
# 1. LOAD TAMIL OCR
# ============================================================

print("Loading PaddleOCR...")

ocr = PaddleOCR(
    lang="ta",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)

print("PaddleOCR loaded successfully!")


# ============================================================
# 2. OCR + EXTRACTION
# ============================================================

def extract_land_document_data(image_path: str):

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            f"File not found: {image_path}"
        )

    print(f"Processing: {os.path.abspath(image_path)}")

    results = ocr.predict(image_path)

    extracted_lines = []

    for result in results:

        texts = result.get("rec_texts", [])

        for text in texts:

            if text and text.strip():

                extracted_lines.append(
                    text.strip()
                )

    full_text = "\n".join(extracted_lines)

    print("\n===== EXTRACTED TEXT =====")
    print(full_text)
    print("===========================\n")

    parsed_fields = parse_land_text(
        extracted_lines,
        full_text
    )

    return {
        "raw_text": full_text,
        "parsed_fields": parsed_fields
    }


# ============================================================
# 3. PARSE LAND RECORD
# ============================================================

def parse_land_text(lines, full_text):

    # --------------------------------------------------------
    # Default values
    # --------------------------------------------------------

    document_type = "Land Record"

    survey_no = None

    owner_name = None

    owner_father_or_son_name = None

    land_amount_or_value = None

    patta_no = None

    district = None

    taluk = None

    village = None

    land_type = None

    land_area_hectare = None

    land_area_acres = None


    # --------------------------------------------------------
    # Normalize lines
    # --------------------------------------------------------

    cleaned_lines = []

    for line in lines:

        line = line.strip()

        if line:
            cleaned_lines.append(line)


    # --------------------------------------------------------
    # DOCUMENT TYPE
    # --------------------------------------------------------

    lower_text = full_text.lower()

    if (
        "patta" in lower_text
        or "பட்டா" in full_text
    ):
        document_type = "Patta"

    elif "sale deed" in lower_text:
        document_type = "Sale Deed"

    elif "registry" in lower_text:
        document_type = "Registry"


    # --------------------------------------------------------
    # PATTA NUMBER
    #
    # Tamil:
    # பட்டா எண்
    #
    # Example:
    # பட்டா எண்
    # 4821
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if "பட்டா" in line and "எண்" in line:

            value = extract_value_from_following_lines(
                cleaned_lines,
                i
            )

            if value:
                patta_no = value
                break


    # --------------------------------------------------------
    # OWNER NAME
    #
    # Tamil:
    # உரிமையாளர் பெயர்
    #
    # Example:
    # உரிமையாளர் பெயர்
    # R. அருண்கஞுமார்
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if "உரிமையாளர்" in line:

            value = extract_value_from_following_lines(
                cleaned_lines,
                i
            )

            if value:

                owner_name = clean_owner_name(
                    value
                )

                break


    # --------------------------------------------------------
    # FATHER NAME
    #
    # Tamil:
    # தந்தை பெயர்
    #
    # Example:
    # தந்தை பெயர்
    # ராமசாமி
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if "தந்தை" in line and "பெயர்" in line:

            value = extract_value_from_following_lines(
                cleaned_lines,
                i
            )

            if value:

                owner_father_or_son_name = value

                break


    # --------------------------------------------------------
    # DISTRICT
    #
    # Tamil:
    # மாவட்டம்
    #
    # Example:
    # மாவட்டம்
    # மதுரை
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if "மாவட்டம்" in line:

            value = extract_value_from_following_lines(
                cleaned_lines,
                i
            )

            if value:
                district = value
                break


    # --------------------------------------------------------
    # TALUK
    #
    # Tamil:
    # வட்டம்
    #
    # Example:
    # வட்டம்
    # மேலூர்
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if line == "வட்டம்":

            value = extract_value_from_following_lines(
                cleaned_lines,
                i
            )

            if value:
                taluk = value
                break


    # --------------------------------------------------------
    # REVENUE VILLAGE
    #
    # Tamil:
    # வருவாய் கிராமம்
    #
    # Example:
    # வருவாய் கிராமம்
    # தேம்மங்கலம்
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if "வருவாய் கிராமம்" in line:

            value = extract_value_from_following_lines(
                cleaned_lines,
                i
            )

            if value:
                village = value
                break


    # --------------------------------------------------------
    # SURVEY NUMBER
    #
    # Tamil OCR may produce:
    #
    # புல எண்
    # புல எண்:
    # புல எண்ன
    #
    # Your document:
    #
    # புல எண்ன
    # உப பிரிவு
    # வகை
    # பரப்பு
    # அளவு
    # 125
    # 3A
    # நஞ்சை
    # ஹெக்டேஞர்
    # 0.9700
    #
    # Therefore:
    # 125 = Survey No
    # 3A  = Sub Division
    # --------------------------------------------------------

    for i, line in enumerate(cleaned_lines):

        if (
            "புல" in line
            and "எண்" in line
        ):

            # Look ahead for numeric value.
            for j in range(
                i + 1,
                min(i + 8, len(cleaned_lines))
            ):

                candidate = cleaned_lines[j]

                # Ignore column headings
                if candidate in [
                    "உப பிரிவு",
                    "வகை",
                    "பரப்பு",
                    "அளவு"
                ]:
                    continue

                # Survey number
                match = re.fullmatch(
                    r"\d{1,6}(?:/\d{1,6})?",
                    candidate
                )

                if match:

                    survey_no = candidate

                    break

            break


    # --------------------------------------------------------
    # LAND TYPE
    #
    # நஞ்சை / புஞ்சை
    # --------------------------------------------------------

    for line in cleaned_lines:

        if "நஞ்சை" in line:

            land_type = "நஞ்சை"
            break

        if "புஞ்சை" in line:

            land_type = "புஞ்சை"
            break


    # --------------------------------------------------------
    # LAND AREA
    #
    # Example:
    #
    # 0.9700
    #
    # மொத்த பரப்பு : 0.9700 ஹெக்டேர்
    # (2.40 ஏக்கர்)
    # --------------------------------------------------------

    area_pattern = re.compile(
        r"\b\d+\.\d+\b"
    )

    # First try "மொத்த பரப்பு"
    for line in cleaned_lines:

        if "மொத்த பரப்பு" in line:

            matches = area_pattern.findall(line)

            if matches:

                land_area_hectare = matches[0]

                if len(matches) > 1:
                    land_area_acres = matches[1]

                break


    # If not found, look for 0.9700-style value
    if land_area_hectare is None:

        for line in cleaned_lines:

            if re.fullmatch(
                r"\d+\.\d{2,4}",
                line
            ):

                number = float(line)

                # Land area is usually a reasonable
                # decimal number.
                if 0 < number < 10000:

                    land_area_hectare = line

                    break


    # --------------------------------------------------------
    # LAND AMOUNT / VALUE
    #
    # This is NOT actually present in your sample.
    #
    # So don't incorrectly use the area as money.
    #
    # We only detect ₹ / Rs / INR values.
    # --------------------------------------------------------

    amount_patterns = [

        r"(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)",

        r"(?:தொகை|மதிப்பு|விலை)"
        r"\s*[:\-]?\s*"
        r"(?:₹|Rs\.?|INR)?\s*"
        r"([0-9,]+(?:\.[0-9]+)?)"
    ]

    for pattern in amount_patterns:

        match = re.search(
            pattern,
            full_text,
            re.IGNORECASE
        )

        if match:

            land_amount_or_value = (
                match.group(1)
                .replace(",", "")
            )

            break


    # --------------------------------------------------------
    # RETURN EVERYTHING
    # --------------------------------------------------------

    return {

        "document_type": document_type,

        "patta_no": patta_no,

        "survey_no": survey_no,

        "owner_name": owner_name,

        "owner_father_or_son_name":
            owner_father_or_son_name,

        "district": district,

        "taluk": taluk,

        "village": village,

        "land_type": land_type,

        "land_area_hectare":
            land_area_hectare,

        "land_area_acres":
            land_area_acres,

        "land_amount_or_value":
            land_amount_or_value
    }


# ============================================================
# 4. GET VALUE AFTER A LABEL
# ============================================================

def extract_value_from_following_lines(
    lines,
    label_index
):

    # Sometimes OCR gives:
    #
    # Label
    # :
    # Value
    #
    # or:
    #
    # Label
    # ..
    # Value
    #
    # Therefore skip punctuation-only lines.

    for j in range(
        label_index + 1,
        min(label_index + 5, len(lines))
    ):

        value = lines[j].strip()

        if not value:
            continue

        # Ignore punctuation
        if re.fullmatch(
            r"[:.\-…]+",
            value
        ):
            continue

        # Ignore Tamil/English separator
        if value in [
            ":",
            "..",
            "...",
            "-"
        ]:
            continue

        return value

    return None


# ============================================================
# 5. CLEAN OWNER NAME
# ============================================================

def clean_owner_name(name):

    name = name.strip()

    # Remove accidental punctuation
    name = re.sub(
        r"^[.:,\-]+\s*",
        "",
        name
    )

    return name


# ============================================================
# 6. MAIN PROGRAM
# ============================================================

if __name__ == "__main__":

    image_path = "test_land.JPG"

    try:

        result = extract_land_document_data(
            image_path
        )

        print("\n===== PARSED RESULT =====")

        print(
            json.dumps(
                result,
                ensure_ascii=False,
                indent=2
            )
        )

        print("=========================\n")

    except Exception as e:

        print("\nERROR:")
        print(str(e))
