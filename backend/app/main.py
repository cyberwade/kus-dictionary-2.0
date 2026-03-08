from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import chapters, keyphrases, sentences, historias, historia_sentences

app = FastAPI(title="Kus Dict", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chapters.router, prefix="/api")
app.include_router(keyphrases.router, prefix="/api")
app.include_router(sentences.router, prefix="/api")
app.include_router(historias.router, prefix="/api")
app.include_router(historia_sentences.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- Serve frontend static files in production ---
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

_static_dir = Path(__file__).resolve().parent.parent / "static"
if _static_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=_static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = _static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_static_dir / "index.html")
