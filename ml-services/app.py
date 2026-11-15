from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from feed_recommender import recommend_feed
from vision_estimation import estimate_plate_volume
from leftover_classifier import match_leftovers

app = FastAPI(title="MacroReel ML Microservices API", version="1.0.0")

# --- Schemas ---

class RecommendationRequest(BaseModel):
    watch_history: List[Dict[str, Any]] # e.g. [{"videoId": "rec_001", "completionRate": 0.9}]
    user_deficits: Dict[str, float]    # e.g. {"protein_deficit": 45.0, "calorie_deficit": 500.0}
    user_dietary_modes: List[str]      # e.g. ["hindu_no_beef", "vegetarian"]
    recipes_dataset: List[Dict[str, Any]]

class LeftoversRequest(BaseModel):
    leftovers_text: str
    user_dietary_modes: List[str]
    recipes_dataset: List[Dict[str, Any]]

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "MacroReel Machine Learning microservices running via FastAPI"}

@app.post("/api/v1/ml/recommend")
def recommend(payload: RecommendationRequest):
    try:
        prioritized_ids = recommend_feed(
            watch_history=payload.watch_history,
            user_deficits=payload.user_deficits,
            user_dietary_modes=payload.user_dietary_modes,
            recipes_dataset=payload.recipes_dataset
        )
        return {"success": True, "video_ids": prioritized_ids}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/ml/portion-estimate")
async def portion_estimate(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        prediction = estimate_plate_volume(contents)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/ml/leftovers")
def leftovers(payload: LeftoversRequest):
    try:
        ranked_recipes = match_leftovers(
            leftovers_text=payload.leftovers_text,
            user_dietary_modes=payload.user_dietary_modes,
            recipes_dataset=payload.recipes_dataset
        )
        return {"success": True, "matches": ranked_recipes}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
