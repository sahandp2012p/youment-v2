from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import whisper
import os
import tempfile
from openai import OpenAI
from dotenv import load_dotenv

# Load .env file for OPENAI_API_KEY
load_dotenv()

app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model once at startup
whisper_model = whisper.load_model("small")


class VideoRequest(BaseModel):
    url: str


@app.post("/analyze_video")
def analyze_video(req: VideoRequest):
    with tempfile.TemporaryDirectory() as tmpdir:
        # yt-dlp options
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": os.path.join(tmpdir, "audio"),  # no extension!
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
            "quiet": True,
        }

        # Download audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([req.url])

        # Whisper path (FFmpegExtractAudio added .mp3)
        audio_path = os.path.join(tmpdir, "audio.mp3")

        if not os.path.exists(audio_path):
            return {"error": "Audio file was not created. Check yt-dlp & FFmpeg setup."}

        # Transcribe audio
        result = whisper_model.transcribe(audio_path)
        transcript = result["text"]

    # Ask GPT to rate video content
    prompt = f"""
    You are an expert video content analyst.
    Rate the following transcript from 1 to 10 based on its content quality, engagement, and informativeness.
    Respond in JSON with the fields: content_score, explanation.

    Transcript:
    {transcript}
    """

    gpt_resp = client.chat.completions.create(
        model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
    )

    return {"transcript": transcript, "rating": gpt_resp.choices[0].message.content}
