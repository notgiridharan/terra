PROJECT CONTEXT — TERRA / TERRALENS

I am building a land-document OCR project called TerraLens.

Environment:
- Windows
- Project folder:
  D:\Terra\terralens\backend
- Python virtual environment:
  D:\Terra\terralens\backend\.venv
- Test image:
  D:\Terra\terralens\backend\test_land.JPG
- I am using PaddleOCR 3.x / PaddleX.
- Current OCR model successfully being used:
  - Detection: PP-OCRv5_server_det
  - Tamil recognition: ta_PP-OCRv5_mobile_rec

Important requirement:
I want the project to be PORTABLE.

The final goal is:
1. I should be able to zip the whole project folder.
2. Send it to another Windows computer.
3. The other person should be able to install/run it with minimal setup.
4. Frontend uploads a land document image.
5. Backend receives the image.
6. Backend runs OCR.
7. Backend extracts structured land-record fields.
8. Backend returns JSON to frontend.
9. Later, OCR should become more accurate and multilingual.
10. Current priority is NOT perfect OCR. Current priority is integrating the working OCR into the backend and making the project portable.

CURRENT OCR STATUS

Initially I used English OCR and got garbage Tamil text.

Then I created a Tamil OCR test using:

    PaddleOCR(
        lang="ta",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )

This successfully reads the Tamil land document.

The current OCR output is:

===== EXTRACTED TEXT =====

1. பட்Lா (PATTA)
தமிழ்நாடு அரக
நில உரிமை விவரம் - பட்டா
மாவட்டம்
:
மதுரை
வட்டம்
..
மேஜூர்
வருவாய் கிராமம்
..
தேம்ங்கலம்
பட்டா எண்
..
4821
உரிமையாளர் பெயர்
..
R. அருண்கஞுமார்
தந்தை பெயர்
:
ராமசாமி
முகவரி
: 12, தெற்கு தெரு. தேம்மங்கலம், மெனுர் வட்டம்,
மதுரை - 625106
புல எண்ன
உப பிரிவு
வகை
பரப்பு
அளவு
125
3A
நஞ்சை
ஹெக்டேஞர்
0.9700
மொத்த பரப்பு : 0.9700 றக்டெடுதர் (2.40 ஏக்கர்)
குறிப்புகள் :
: -
தானுகா அனுவலர்
மேஜூர்

The OCR itself is now working reasonably well.

CURRENT PARSED RESULT

The parser currently successfully produces:

{
  "document_type": "Patta",
  "patta_no": "4821",
  "survey_no": "125",
  "owner_name": "R. அருண்கஞுமார்",
  "owner_father_or_son_name": "ராமசாமி",
  "district": "மதுரை",
  "taluk": "மேஜூர்",
  "village": "தேம்ங்கலம்",
  "land_type": "நஞ்சை",
  "land_area_hectare": "0.9700",
  "land_area_acres": "2.40",
  "land_amount_or_value": null
}

The important point is that this is now working.

PADDLEOCR SIGNATURE

I checked:

    from paddleocr import PaddleOCR
    import inspect
    print(inspect.signature(PaddleOCR))

It returned:

(doc_orientation_classify_model_name=None,
 doc_orientation_classify_model_dir=None,
 doc_unwarping_model_name=None,
 doc_unwarping_model_dir=None,
 text_detection_model_name=None,
 text_detection_model_dir=None,
 textline_orientation_model_name=None,
 textline_orientation_model_dir=None,
 textline_orientation_batch_size=None,
 text_recognition_model_name=None,
 text_recognition_model_dir=None,
 text_recognition_model_dir=None,
 textline_orientation_batch_size=None,
 use_doc_orientation_classify=None,
 use_doc_unwarping=None,
 use_textline_orientation=None,
 text_det_limit_side_len=None,
 text_det_limit_type=None,
 text_det_thresh=None,
 text_det_box_thresh=None,
 text_det_unclip_ratio=None,
 text_det_input_shape=None,
 text_rec_score_thresh=None,
 return_word_box=None,
 text_rec_input_shape=None,
 lang=None,
 ocr_version=None,
 **kwargs)

(Actual output had text_recognition_model_dir only once; this is just context.)

The current PaddleOCR version uses the newer API and:

    results = ocr.predict(image_path)

Then each result is an OCRResult object.

Important fields available in the result include:

    result.get("rec_texts", [])
    result.get("rec_scores", [])
    result.get("rec_boxes", [])
    result.get("rec_polys", [])

The OCRResult is dictionary-like.

CURRENT OCR TEST BEHAVIOR

The Tamil OCR test initially printed no text because the script was probably accessing the result incorrectly.

After debugging, this worked:

    texts = result.get("rec_texts", [])

and then:

    for text in texts:
        if text and text.strip():
            extracted_lines.append(text.strip())

This produces the correct Tamil OCR output.

CURRENT WORKING OCR INITIALIZATION

The working configuration is approximately:

    from paddleocr import PaddleOCR

    ocr = PaddleOCR(
        lang="ta",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )

This automatically downloaded/cached:

    PP-OCRv5_server_det

and:

    ta_PP-OCRv5_mobile_rec

under:

    C:\Users\Giri\.paddlex\official_models\

The current machine has the models cached there.

IMPORTANT PORTABILITY PROBLEM

PaddleOCR automatically downloads models to the user's home directory, e.g.:

    C:\Users\Giri\.paddlex\official_models\

This is NOT portable.

If I zip the project and send it to another person, their username/home directory will be different.

Therefore the final architecture should NOT depend on:

    C:\Users\Giri\.paddlex\...

Instead, I want project-local model directories, something like:

    terralens/
        backend/
            app/
            models/
                paddleocr/
                    PP-OCRv5_server_det/
                    ta_PP-OCRv5_mobile_rec/
            uploads/
            ...
        frontend/
        requirements.txt
        README.md
        start_backend.bat
        start_frontend.bat

or another clean portable structure.

The goal is for all required OCR models/dependencies/configuration to be contained in or reproducibly installed from the project.

PORTABILITY REQUIREMENT

I want to be able to:

    zip terralens/

send the zip to another Windows PC

extract it

create/activate a venv or run setup

install dependencies

start backend

start frontend

upload image

get OCR JSON

without manually modifying hardcoded paths.

Absolute paths like:

    D:\Terra\terralens\backend\test_land.JPG

must NOT be hardcoded in the final backend.

Use pathlib / relative paths based on the project root.

For example:

    BASE_DIR = Path(__file__).resolve().parent

or an appropriate project-root calculation.

BACKEND INTEGRATION GOAL

The OCR should become a backend API endpoint.

Example conceptual API:

    POST /api/ocr

Frontend sends:

    multipart/form-data
    image=<uploaded image>

Backend:
1. validates file
2. saves temporarily or permanently in uploads/
3. calls PaddleOCR
4. gets rec_texts
5. builds full_text
6. parses fields
7. returns JSON

Example desired response:

{
    "success": true,
    "document_type": "Patta",
    "raw_text": "...",
    "parsed_fields": {
        "patta_no": "4821",
        "survey_no": "125",
        "owner_name": "R. அருண்கஞுமார்",
        "owner_father_or_son_name": "ராமசாமி",
        "district": "மதுரை",
        "taluk": "மேஜூர்",
        "village": "தேம்ங்கலம்",
        "land_type": "நஞ்சை",
        "land_area_hectare": "0.9700",
        "land_area_acres": "2.40",
        "land_amount_or_value": null
    }
}

The frontend should be able to upload the image and directly receive/display these values.

CURRENT PARSER

The current parser uses regex/heuristics.

It detects:
- document_type
- patta_no
- survey_no
- owner_name
- owner_father_or_son_name
- district
- taluk
- village
- land_type
- land_area_hectare
- land_area_acres
- land_amount_or_value

The parser was improved to work with the Tamil OCR output above.

IMPORTANT:
Do NOT throw away the current working Tamil OCR/parser and start from scratch.

Instead:
1. integrate the current working OCR into the backend first
2. make paths portable
3. make model loading portable
4. make upload endpoint work
5. test end-to-end
6. only then improve OCR accuracy/multilingual support.

MULTILINGUAL REQUIREMENT

Eventually I want OCR to support:
- Tamil
- English
- potentially other Indian languages

But current priority is getting Tamil + English working in the actual backend.

We should design the OCR layer so the language can be configured.

For example conceptually:

    OCR_LANGUAGE = "ta"

or:

    lang = request parameter / config

But don't overcomplicate the first integration.

We need to determine the best PaddleOCR multilingual strategy for the installed PaddleOCR version.

ACCURACY REQUIREMENT

Later we want better accuracy for:
- Tamil land documents
- survey numbers
- sub-division numbers such as 3A
- owner names
- father names
- village/taluk/district
- area
- hectares
- acres
- Patta number

The current OCR has some character errors, for example:

    பட்Lா

instead of a perfectly recognized Tamil "பட்டா"

    தமிழ்நாடு அரக

which may be intended as "தமிழ்நாடு அரசு"

    புல எண்ன

which may be intended as "புல எண்"

    றக்டெடுதர்

which is an OCR error around "ஹெக்டேர்"

But the important numeric values are being detected correctly:

    4821
    125
    3A
    0.9700
    2.40

Therefore numeric/field extraction is already promising.

DO NOT optimize OCR before backend integration.

PROJECT TECHNOLOGY

Backend technology is currently being developed in Python.

If the existing project already uses FastAPI/Flask, integrate with that rather than replacing it.

If no backend framework is currently established, FastAPI is a reasonable choice.

Frontend already exists or will exist separately. The goal is an upload form that sends an image to the backend API.

PORTABLE DEPENDENCIES

Need a clean requirements.txt.

Potential dependencies include:

    paddleocr
    paddlepaddle
    fastapi
    uvicorn
    python-multipart
    opencv-python
    Pillow

But verify versions compatible with the current environment rather than blindly using latest versions.

Need to consider that Paddle/PaddleOCR can be large.

For true offline portability:
- bundle model files into the project, OR
- provide a setup script that downloads the exact required models on first setup.

Ideal behavior:
- first-time setup downloads models into project-local `models/`
- subsequent runs use local models
- no dependency on Giri's Windows user directory
- no hardcoded machine-specific paths

Need to decide whether bundling the model directories inside the ZIP is practical because the model files are large.

PADDLEOCR MODEL DOWNLOADS SEEN

The logs showed approximately:
- PP-OCRv5_server_det around 81.2 MB
- ta_PP-OCRv5_mobile_rec around 88.4 MB
- another file around 7–8 MB was also downloaded/reconstructed

Therefore the final ZIP may become fairly large.

A setup script that downloads models once may be better for portability if internet is available.

However, if the goal is truly offline deployment, models should be bundled.

CURRENT COMMANDS USED

The environment was:

    cd D:\Terra\terralens\backend

Then:

    .venv\Scripts\activate

The OCR test was run with:

    python test_ocr_tamil.py

There is also an existing OCR test script using:

    lang="en"

which gave poor Tamil recognition.

The Tamil script now works.

IMPORTANT USER PREFERENCE

I need step-by-step instructions.

Do NOT give vague architectural explanations.

When changing code:
- tell me exactly which file to open
- tell me exactly what to delete
- give the COMPLETE code to paste
- tell me the exact command to run
- tell me what output I should expect
- only move to the next step after confirming the previous step works

I specifically asked for "whole code to be pasted" because I cannot easily work with partial snippets.

NEXT TASK

Continue from this exact state.

The immediate task is:

INTEGRATE THE WORKING TAMIL PADDLEOCR INTO THE EXISTING BACKEND API.

Then make it portable.

Suggested sequence:

STEP 1:
Inspect the existing backend structure/files and identify the backend entry point.

STEP 2:
Create an OCR service/module, e.g.:

    backend/app/services/ocr_service.py

containing:
- PaddleOCR initialization
- image OCR
- extraction of rec_texts
- parsing function

STEP 3:
Create an API endpoint such as:

    POST /api/ocr

that accepts an uploaded image.

STEP 4:
Test with:

    test_land.JPG

using curl/Postman/browser frontend.

STEP 5:
Return JSON containing raw_text + parsed_fields.

STEP 6:
Remove hardcoded absolute paths.

STEP 7:
Make model paths project-local.

STEP 8:
Create setup/start scripts and requirements.txt for portability.

STEP 9:
Test the entire folder after copying/extracting it to another location/machine.

STEP 10:
Only after this works, improve multilingual OCR and extraction accuracy.

DO NOT START WITH OCR MODEL OPTIMIZATION.
FIRST MAKE THE CURRENT WORKING OCR FLOW:
FRONTEND IMAGE → BACKEND UPLOAD → PADDLEOCR → PARSER → JSON RESPONSE

Then make that flow portable.
