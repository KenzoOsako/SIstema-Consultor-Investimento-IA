from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse


def mount_frontend(app: FastAPI, directory: str | Path) -> bool:
    """Serve a SPA sem permitir que caminhos ou symlinks escapem do build."""
    root = Path(directory).resolve()
    if not root.is_dir():
        return False

    def contained(path: Path) -> Path:
        try:
            resolved = path.resolve()
            if not resolved.is_relative_to(root):
                raise HTTPException(status_code=404, detail="Not Found")
            return resolved
        except (OSError, RuntimeError, ValueError):
            raise HTTPException(status_code=404, detail="Not Found") from None

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        # Não reinterpretar separadores do Windows nem aceitar travessia explícita.
        if "\\" in full_path or "\x00" in full_path or ".." in full_path.split("/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = contained(root / full_path)
        if candidate.is_file():
            return FileResponse(candidate)
        if full_path == "assets" or full_path.startswith("assets/"):
            raise HTTPException(status_code=404, detail="Not Found")
        index = contained(root / "index.html")
        if not index.is_file():
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(index)

    return True
