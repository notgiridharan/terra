from paddleocr import PaddleOCR

print("Starting OCR...")

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)

print("OCR initialized.")

image_path = "test_land.JPG"

print(f"Reading: {image_path}")

results = ocr.predict(image_path)

for result in results:
    print("\n===== OCR RESULT =====")
    print(result)

print("\n===== DONE =====")
