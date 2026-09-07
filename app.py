from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from ultralytics import YOLO
import cv2
import numpy as np

app = FastAPI(
    title="Cloud Visual AI Agent",
    version="1.0"
)

# Static files
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

# HTML templates
templates = Jinja2Templates(directory="templates")

# Load YOLO model
model = YOLO("yolo11n.pt")


# =========================
# HOME PAGE
# =========================

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"request": request}
    )


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
async def health():
    return {
        "status": "running",
        "message": "Cloud Visual AI Agent is online",
        "model": "YOLO11n"
    }


# =========================
# YOLO OBJECT DETECTION
# =========================

@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    # Read uploaded image
    image_bytes = await file.read()

    # Convert bytes to numpy array
    image_array = np.frombuffer(image_bytes, np.uint8)

    # Decode image
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        return {
            "success": False,
            "error": "Invalid image"
        }

    # Run YOLO detection
    results = model(
        frame,
        conf=0.40,
        verbose=False
    )

    detections = []

    # Process results
    for result in results:

        boxes = result.boxes

        if boxes is None:
            continue

        for box in boxes:

            # Class ID
            class_id = int(box.cls[0])

            # Confidence
            confidence = float(box.conf[0])

            # Bounding box
            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            # Object name
            class_name = model.names[class_id]

            detections.append({
                "name": class_name,
                "confidence": round(confidence * 100, 1),
                "box": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                }
            })

    # Count people
    person_count = sum(
        1 for detection in detections
        if detection["name"].lower() == "person"
    )

    return {
        "success": True,
        "object_count": len(detections),
        "person_count": person_count,
        "detections": detections
    }