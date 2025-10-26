"""Data ingestion script for OpenFlights dataset"""
import asyncio
import os
import pandas as pd
import numpy as np
import pickle
from motor.motor_asyncio import AsyncIOMotorClient
from sklearn.feature_extraction.text import TfidfVectorizer
import logging
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

DATA_DIR = Path(__file__).parent / 'data'

async def ingest_airports():
    """Ingest airports data"""
    logger.info("Ingesting airports...")
    cols = ['id', 'name', 'city', 'country', 'iata', 'icao', 'latitude', 'longitude', 
            'altitude', 'timezone', 'dst', 'tz', 'type', 'source']
    
    df = pd.read_csv(DATA_DIR / 'airports.dat', header=None, names=cols, na_values='\\N')
    df = df[['id', 'name', 'city', 'country', 'iata', 'icao', 'latitude', 'longitude']]
    df = df.dropna(subset=['id'])
    df['id'] = df['id'].astype(int)
    
    # Clear existing data
    await db.airports.delete_many({})
    
    # Insert data
    records = df.to_dict('records')
    if records:
        await db.airports.insert_many(records)
    
    # Create indexes
    await db.airports.create_index('id', unique=True)
    await db.airports.create_index('iata')
    await db.airports.create_index('country')
    
    logger.info(f"Ingested {len(records)} airports")
    return len(records)

async def ingest_airlines():
    """Ingest airlines data"""
    logger.info("Ingesting airlines...")
    cols = ['id', 'name', 'alias', 'iata', 'icao', 'callsign', 'country', 'active']
    
    df = pd.read_csv(DATA_DIR / 'airlines.dat', header=None, names=cols, na_values='\\N')
    df = df.dropna(subset=['id'])
    df['id'] = df['id'].astype(int)
    df['active'] = df['active'] == 'Y'
    
    # Clear existing data
    await db.airlines.delete_many({})
    
    # Insert data
    records = df.to_dict('records')
    if records:
        await db.airlines.insert_many(records)
    
    # Create indexes
    await db.airlines.create_index('id', unique=True)
    await db.airlines.create_index('iata')
    await db.airlines.create_index('country')
    
    logger.info(f"Ingested {len(records)} airlines")
    return len(records)

async def ingest_routes_with_embeddings():
    """Ingest routes and compute TF-IDF embeddings"""
    logger.info("Ingesting routes with embeddings...")
    cols = ['airline', 'airline_id', 'source', 'source_id', 'dest', 'dest_id', 
            'codeshare', 'stops', 'equipment']
    
    df = pd.read_csv(DATA_DIR / 'routes.dat', header=None, names=cols, na_values='\\N')
    df = df.dropna(subset=['source_id', 'dest_id'])
    df['source_id'] = df['source_id'].astype(int)
    df['dest_id'] = df['dest_id'].astype(int)
    
    # Build route_text for embeddings
    df['route_text'] = df['source'].astype(str) + '-' + df['dest'].astype(str)
    
    # Compute TF-IDF embeddings
    logger.info("Computing TF-IDF embeddings...")
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), max_features=128)
    vectors = vectorizer.fit_transform(df['route_text'])
    dense = vectors.toarray()
    
    # Clear existing data
    await db.routes.delete_many({})
    
    # Insert routes with embeddings
    records = []
    for idx, (i, row) in enumerate(df.iterrows()):
        emb = dense[idx]
        emb_bytes = pickle.dumps(emb, protocol=4)
        
        record = {
            'id': idx + 1,
            'airline': row['airline'],
            'airline_id': int(row['airline_id']) if pd.notnull(row['airline_id']) else None,
            'source': row['source'],
            'source_id': int(row['source_id']),
            'dest': row['dest'],
            'dest_id': int(row['dest_id']),
            'codeshare': row['codeshare'] if pd.notnull(row['codeshare']) else None,
            'stops': int(row['stops']) if pd.notnull(row['stops']) else 0,
            'equipment': row['equipment'] if pd.notnull(row['equipment']) else None,
            'route_text': row['route_text'],
            'embedding': emb_bytes
        }
        records.append(record)
        
        # Batch insert every 1000 records
        if len(records) >= 1000:
            await db.routes.insert_many(records)
            records = []
    
    # Insert remaining records
    if records:
        await db.routes.insert_many(records)
    
    # Create indexes
    await db.routes.create_index('id', unique=True)
    await db.routes.create_index('source_id')
    await db.routes.create_index('dest_id')
    await db.routes.create_index('airline_id')
    
    logger.info(f"Ingested {len(df)} routes with embeddings")
    return len(df)

async def run_full_ingestion():
    """Run complete data ingestion pipeline"""
    logger.info("Starting full data ingestion...")
    
    airports_count = await ingest_airports()
    airlines_count = await ingest_airlines()
    routes_count = await ingest_routes_with_embeddings()
    
    logger.info(f"Ingestion complete: {airports_count} airports, {airlines_count} airlines, {routes_count} routes")
    return {
        'airports': airports_count,
        'airlines': airlines_count,
        'routes': routes_count
    }

if __name__ == '__main__':
    asyncio.run(run_full_ingestion())