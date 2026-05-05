from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import logging
import cv2
import numpy as np
import mediapipe as mp
import tempfile
import base64

load_dotenv()

app = FastAPI(title="Vision Service - Age Estimation & Liveness Detection")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection


class AgeEstimationRequest(BaseModel):
    session_id: str
    video_url: Optional[str] = None
    frame_data: Optional[str] = None  # base64 encoded image
    frame_rate: int = 30


class AgeEstimationResponse(BaseModel):
    estimated_age: int
    confidence: float
    face_count: int
    liveness_score: float


class LivenessRequest(BaseModel):
    session_id: str
    video_url: Optional[str] = None
    frame_data: Optional[str] = None


class LivenessResponse(BaseModel):
    is_live: bool
    liveness_score: float
    confidence: float
    face_detected: bool


def decode_frame(frame_data: str) -> np.ndarray:
    """Decode base64 frame data to numpy array"""
    img_data = base64.b64decode(frame_data.split(",")[-1] if "," in frame_data else frame_data)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def download_video_frame(video_url: str) -> np.ndarray:
    """Download and extract a frame from video URL"""
    try:
        import urllib.request
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            urllib.request.urlretrieve(video_url, tmp_file.name)
            cap = cv2.VideoCapture(tmp_file.name)
            ret, frame = cap.read()
            cap.release()
            os.unlink(tmp_file.name)
            if ret:
                return frame
            raise Exception("Failed to read video frame")
    except Exception as e:
        logger.error(f"Error downloading video: {e}")
        raise


def detect_faces(image: np.ndarray) -> tuple:
    """Detect faces in image using MediaPipe"""
    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_image)

        face_count = 0
        face_locations = []

        if results.detections:
            for detection in results.detections:
                face_count += 1
                bbox = detection.location_data.bounding_box
                face_locations.append({
                    "x": bbox.xmin,
                    "y": bbox.ymin,
                    "width": bbox.width,
                    "height": bbox.height,
                    "confidence": detection.score[0] if detection.score else 0.0,
                })

        return face_count, face_locations


def estimate_age_from_face(face_image: np.ndarray) -> tuple:
    """Estimate age from face image using texture analysis heuristics"""
    try:
        face_resized = cv2.resize(face_image, (200, 200))
        gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)

        # Texture analysis via Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Wrinkle detection via edge density
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        # Skin smoothness
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        smoothness = np.mean(np.abs(gray.astype(float) - blur.astype(float)))

        # Combined age estimation
        if smoothness < 5 and edge_density < 0.05:
            estimated_age = int(np.clip(20 + smoothness * 2, 18, 28))
            confidence = 0.80
        elif edge_density < 0.1:
            estimated_age = int(np.clip(28 + edge_density * 200, 28, 40))
            confidence = 0.78
        elif edge_density < 0.15:
            estimated_age = int(np.clip(35 + edge_density * 150, 35, 50))
            confidence = 0.75
        else:
            estimated_age = int(np.clip(45 + edge_density * 100, 45, 65))
            confidence = 0.72

        return estimated_age, confidence
    except Exception as e:
        logger.error(f"Age estimation error: {e}")
        return 30, 0.65


def check_liveness(image: np.ndarray) -> tuple:
    """Liveness detection using face quality analysis"""
    try:
        with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_detection.process(rgb_image)

            if not results.detections:
                return False, 0.0, 0.5

            detection_scores = [d.score[0] for d in results.detections if d.score]
            avg_confidence = float(np.mean(detection_scores)) if detection_scores else 0.0

            # Texture analysis for anti-spoofing
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Real faces have more texture variation than printed photos
            texture_live = laplacian_var > 100
            is_live = avg_confidence > 0.5 and texture_live
            liveness_score = min(avg_confidence * (1.1 if texture_live else 0.6), 1.0)

            return is_live, liveness_score, avg_confidence
    except Exception as e:
        logger.error(f"Liveness detection error: {e}")
        return False, 0.0, 0.0


@app.post("/estimate-age", response_model=AgeEstimationResponse)
async def estimate_age(request: AgeEstimationRequest):
    """Estimate customer age from video frame or URL"""
    try:
        logger.info(f"Estimating age for session {request.session_id}")

        # Get frame from either base64 data or video URL
        if request.frame_data:
            frame = decode_frame(request.frame_data)
        elif request.video_url:
            frame = download_video_frame(request.video_url)
        else:
            raise HTTPException(status_code=400, detail="Provide either frame_data or video_url")

        face_count, face_locations = detect_faces(frame)

        if face_count == 0:
            raise HTTPException(status_code=400, detail="No face detected in image")

        primary_face = face_locations[0]
        h, w = frame.shape[:2]
        x = int(primary_face["x"] * w)
        y = int(primary_face["y"] * h)
        fw = int(primary_face["width"] * w)
        fh = int(primary_face["height"] * h)

        face_image = frame[max(0, y):min(h, y + fh), max(0, x):min(w, x + fw)]

        if face_image.size == 0:
            raise HTTPException(status_code=400, detail="Invalid face crop")

        estimated_age, age_confidence = estimate_age_from_face(face_image)
        is_live, liveness_score, _ = check_liveness(frame)

        return AgeEstimationResponse(
            estimated_age=int(estimated_age),
            confidence=float(age_confidence),
            face_count=face_count,
            liveness_score=float(liveness_score),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Age estimation error: {e}")
        raise HTTPException(status_code=500, detail=f"Age estimation failed: {str(e)}")


@app.post("/estimate-age-upload")
async def estimate_age_upload(file: UploadFile = File(...)):
    """Estimate age from uploaded image file"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        face_count, face_locations = detect_faces(frame)
        if face_count == 0:
            raise HTTPException(status_code=400, detail="No face detected")

        primary_face = face_locations[0]
        h, w = frame.shape[:2]
        x, y = int(primary_face["x"] * w), int(primary_face["y"] * h)
        fw, fh = int(primary_face["width"] * w), int(primary_face["height"] * h)
        face_image = frame[max(0, y):min(h, y + fh), max(0, x):min(w, x + fw)]

        estimated_age, confidence = estimate_age_from_face(face_image)
        _, liveness_score, _ = check_liveness(frame)

        return {
            "estimated_age": int(estimated_age),
            "confidence": float(confidence),
            "face_count": face_count,
            "liveness_score": float(liveness_score),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/liveness-detection", response_model=LivenessResponse)
async def liveness_detection(request: LivenessRequest):
    """Detect liveness to prevent spoofing"""
    try:
        logger.info(f"Checking liveness for session {request.session_id}")

        if request.frame_data:
            frame = decode_frame(request.frame_data)
        elif request.video_url:
            frame = download_video_frame(request.video_url)
        else:
            raise HTTPException(status_code=400, detail="Provide either frame_data or video_url")

        face_count, _ = detect_faces(frame)

        if face_count == 0:
            return LivenessResponse(is_live=False, liveness_score=0.0, confidence=0.9, face_detected=False)

        is_live, liveness_score, confidence = check_liveness(frame)

        return LivenessResponse(
            is_live=is_live,
            liveness_score=float(liveness_score),
            confidence=float(confidence),
            face_detected=face_count > 0,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Liveness detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Liveness detection failed: {str(e)}")


@app.get("/health")
async def health():
    return {
        "status": "Vision Service is running",
        "vision_provider": "mediapipe",
        "features": ["face_detection", "age_estimation", "liveness_detection", "image_upload"],
        "models": ["MediaPipe Face Detection"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("VISION_SERVICE_PORT", 3006)))
