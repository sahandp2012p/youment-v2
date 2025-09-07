from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Cors setup

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VideoRequest(BaseModel):  # Model for parameters
    url: str


@app.post("/analyze_video")
def analyze_video(req: VideoRequest):
    # Placeholder for video analysis logic
    return {"score": 7, "message": f"Analyzed {req.url}"}
