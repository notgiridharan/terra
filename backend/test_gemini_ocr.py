import os, sys, base64, warnings
sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv; load_dotenv()
warnings.filterwarnings("ignore")
import google.generativeai as genai
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

with open("test_patta.jpg", "rb") as f:
    data = f.read()
img_part = {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(data).decode()}}

PROMPT = '''You are an expert at reading Indian government land record documents (Patta, Chitta, A-Register, etc).
Read ALL visible text from this image, including Tamil text.
Return ONLY valid JSON (no markdown fences):
{
  "raw_text": "<all visible text including Tamil>",
  "document_type": null,
  "patta_no": null,
  "survey_no": null,
  "owner_name": null,
  "owner_father_or_son_name": null,
  "district": null,
  "taluk": null,
  "village": null,
  "land_type": null,
  "land_area_hectare": null,
  "land_area_acres": null,
  "land_amount_or_value": null
}'''

model = genai.GenerativeModel("gemini-3.5-flash-lite")
resp = model.generate_content([PROMPT, img_part])
print(resp.text[:3000])
