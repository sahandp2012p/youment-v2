from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yt_dlp
import whisper
import os
import tempfile
import json
import time
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


@app.get("/analyze_stream")
def analyze_stream(url: str):
    """
    SSE endpoint for real-time progress updates.
    Frontend connects via EventSource("/analyze_stream?url=...")
    """

    def event_generator():
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                # Step 1: Download audio
                yield f"data: {json.dumps({'step': 'Downloading audio from YouTube...'})}\n\n"
                ydl_opts = {
                    "format": "bestaudio/best",
                    "outtmpl": os.path.join(tmpdir, "audio"),
                    "postprocessors": [
                        {
                            "key": "FFmpegExtractAudio",
                            "preferredcodec": "mp3",
                            "preferredquality": "192",
                        }
                    ],
                    "quiet": True,
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])

                audio_path = os.path.join(tmpdir, "audio.mp3")
                if not os.path.exists(audio_path):
                    yield f"data: {json.dumps({'error': 'Audio file was not created'})}\n\n"
                    return

                # Step 2: Transcribe with Whisper
                yield f"data: {json.dumps({'step': 'Transcribing audio with Whisper...'})}\n\n"
                result = whisper_model.transcribe(audio_path)
                transcript = result["text"]

                # Step 3: Analyze with GPT
                yield f"data: {json.dumps({'step': 'Analyzing transcript with GPT...'})}\n\n"
                prompt = f"""
                You are an expert video content analyst.
                Rate the following transcript from 1 to 10 based on its content quality, engagement, and informativeness.
                Respond in JSON with the fields: content_score, explanation.

                Transcript:
                {transcript}
                """

                gpt_resp = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                )
                rating = gpt_resp.choices[0].message.content

                # Step 4: Done
                yield f"data: {json.dumps({'done': True, 'result': {'transcript': transcript, 'rating': rating}})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
