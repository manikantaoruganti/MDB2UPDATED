from fastapi import FastAPI, APIRouter, Query, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Flight Analytics API")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class Stats(BaseModel):
    total_airports: int
    total_airlines: int
    total_routes: int
    total_countries: int

class Airport(BaseModel):
    id: int
    name: str
    city: str
    country: str
    iata: Optional[str] = None
    icao: Optional[str] = None

class Route(BaseModel):
    source: str
    dest: str
    airline: Optional[str] = None

# Analytics Endpoints
@api_router.get("/analytics/stats", response_model=Stats)
async def get_stats():
    """Get overall statistics"""
    total_airports = await db.airports.count_documents({})
    total_airlines = await db.airlines.count_documents({})
    total_routes = await db.routes.count_documents({})
    
    # Count distinct countries
    countries = await db.airports.distinct('country')
    total_countries = len([c for c in countries if c])
    
    return Stats(
        total_airports=total_airports,
        total_airlines=total_airlines,
        total_routes=total_routes,
        total_countries=total_countries
    )

@api_router.get("/analytics/busiest-airports")
async def get_busiest_airports(limit: int = Query(10, ge=1, le=50)):
    """Get busiest airports by route count"""
    pipeline = [
        {"$group": {"_id": "$dest_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "airports",
            "localField": "_id",
            "foreignField": "id",
            "as": "airport"
        }},
        {"$unwind": "$airport"},
        {"$project": {
            "_id": 0,
            "airport_id": "$_id",
            "name": "$airport.name",
            "city": "$airport.city",
            "country": "$airport.country",
            "iata": "$airport.iata",
            "routes": "$count"
        }}
    ]
    
    results = await db.routes.aggregate(pipeline).to_list(length=limit)
    return results

@api_router.get("/analytics/top-airlines")
async def get_top_airlines(limit: int = Query(10, ge=1, le=50)):
    """Get top airlines by route count"""
    pipeline = [
        {"$match": {"airline_id": {"$ne": None}}},
        {"$group": {"_id": "$airline_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "airlines",
            "localField": "_id",
            "foreignField": "id",
            "as": "airline"
        }},
        {"$unwind": "$airline"},
        {"$project": {
            "_id": 0,
            "airline_id": "$_id",
            "name": "$airline.name",
            "iata": "$airline.iata",
            "country": "$airline.country",
            "routes": "$count"
        }}
    ]
    
    results = await db.routes.aggregate(pipeline).to_list(length=limit)
    return results

@api_router.get("/analytics/popular-routes")
async def get_popular_routes(limit: int = Query(10, ge=1, le=50)):
    """Get most popular routes"""
    pipeline = [
        {"$group": {
            "_id": {"source_id": "$source_id", "dest_id": "$dest_id"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "airports",
            "localField": "_id.source_id",
            "foreignField": "id",
            "as": "source_airport"
        }},
        {"$lookup": {
            "from": "airports",
            "localField": "_id.dest_id",
            "foreignField": "id",
            "as": "dest_airport"
        }},
        {"$project": {
            "_id": 0,
            "source": {"$arrayElemAt": ["$source_airport.iata", 0]},
            "source_name": {"$arrayElemAt": ["$source_airport.name", 0]},
            "dest": {"$arrayElemAt": ["$dest_airport.iata", 0]},
            "dest_name": {"$arrayElemAt": ["$dest_airport.name", 0]},
            "airlines": "$count"
        }}
    ]
    
    results = await db.routes.aggregate(pipeline).to_list(length=limit)
    return results

@api_router.get("/analytics/airports-by-country")
async def get_airports_by_country(limit: int = Query(20, ge=1, le=100)):
    """Get airport count by country"""
    pipeline = [
        {"$match": {"country": {"$ne": None}}},
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$project": {"_id": 0, "country": "$_id", "airports": "$count"}}
    ]
    
    results = await db.airports.aggregate(pipeline).to_list(length=limit)
    return results

# Search Endpoints
@api_router.get("/search/airports")
async def search_airports(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=100)):
    """Search airports by name, city, or IATA code"""
    regex = {"$regex": q, "$options": "i"}
    query = {"$or": [
        {"name": regex},
        {"city": regex},
        {"iata": regex},
        {"country": regex}
    ]}
    
    airports = await db.airports.find(query, {"_id": 0}).limit(limit).to_list(length=limit)
    return airports

@api_router.get("/search/routes/{airport_id}")
async def get_routes_by_airport(airport_id: int, limit: int = Query(50, ge=1, le=200)):
    """Get routes from/to an airport"""
    query = {"$or": [{"source_id": airport_id}, {"dest_id": airport_id}]}
    routes = await db.routes.find(query, {"_id": 0, "embedding": 0}).limit(limit).to_list(length=limit)
    return routes

# Recommendations Endpoint
@api_router.get("/recommendations/similar-routes")
async def get_similar_routes(
    source: str = Query(..., description="Source airport IATA code"),
    destination: str = Query(..., description="Destination airport IATA code"),
    top_k: int = Query(10, ge=1, le=50)
):
    """Get similar route recommendations using vector similarity"""
    route_text = f"{source.upper()}-{destination.upper()}"
    
    # Fetch all routes with embeddings
    all_routes = await db.routes.find({"embedding": {"$exists": True}}, {"_id": 0}).to_list(length=None)
    
    if not all_routes:
        raise HTTPException(status_code=404, detail="No routes with embeddings found")
    
    # Extract embeddings and route info
    embeddings = []
    route_info = []
    
    for route in all_routes:
        try:
            emb = pickle.loads(route['embedding'])
            embeddings.append(emb)
            route_info.append({
                'route_text': route['route_text'],
                'source': route['source'],
                'dest': route['dest'],
                'airline': route.get('airline', 'Unknown')
            })
        except:
            continue
    
    if not embeddings:
        raise HTTPException(status_code=404, detail="No valid embeddings found")
    
    # Create TF-IDF vectorizer with same parameters
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), max_features=128)
    all_route_texts = [r['route_text'] for r in route_info]
    vectorizer.fit(all_route_texts)
    
    # Transform query
    query_vector = vectorizer.transform([route_text]).toarray()
    
    # Stack embeddings
    embeddings_matrix = np.vstack(embeddings)
    
    # Compute cosine similarity
    similarities = cosine_similarity(query_vector, embeddings_matrix)[0]
    
    # Get top K similar routes
    top_indices = similarities.argsort()[-top_k:][::-1]
    
    results = []
    for idx in top_indices:
        results.append({
            **route_info[idx],
            'similarity': float(similarities[idx])
        })
    
    return results

@api_router.get("/recommendations/direct-routes")
async def get_direct_routes(
    source: str = Query(..., description="Source airport IATA code"),
    destination: str = Query(..., description="Destination airport IATA code")
):
    """Get direct routes between two airports"""
    query = {
        "source": source.upper(),
        "dest": destination.upper()
    }
    
    routes = await db.routes.find(query, {"_id": 0, "embedding": 0}).to_list(length=100)
    return routes

# Admin Endpoints
@api_router.post("/admin/ingest-data")
async def trigger_data_ingestion():
    """Trigger data ingestion (for admin use)"""
    try:
        from data_ingestion import run_full_ingestion
        result = await run_full_ingestion()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Data ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/")
async def root():
    return {"message": "Flight Analytics API - Ready", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()