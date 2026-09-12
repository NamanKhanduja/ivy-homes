import requests
import json
import os
import time

BASE_URL = "https://solve.ivy.homes"
API_KEY = "IVY26-4C3EAEB6A76C"

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

def log(msg):
    print(f"[FETCH] {msg}")

# 1. Health check
def fetch_health():
    log("Checking /health...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        log(f"Health response: status={r.status_code}, body={r.text}")
        with open(os.path.join(DATA_DIR, "health.json"), "w", encoding="utf-8") as f:
            f.write(r.text)
    except Exception as e:
        log(f"Health error: {e}")

# 2. Auth login test
def fetch_auth():
    log("Testing /auth/login...")
    payload = {
        "email": "demo1@ivy.homes",
        "password": "117e45bfc1"
    }
    r = requests.post(f"{BASE_URL}/auth/login", json=payload)
    log(f"Auth login status: {r.status_code}, body={r.text}")
    if r.status_code == 200:
        token_data = r.json()
        with open(os.path.join(DATA_DIR, "auth_token.json"), "w", encoding="utf-8") as f:
            json.dump(token_data, f, indent=2)
        return token_data.get("token")
    return None

# 3. Paginated generic fetcher
def fetch_paginated_endpoint(path, filename, limit=200):
    log(f"Fetching endpoint {path} with limit={limit}...")
    page = 1
    all_records = []
    first_response = None
    
    while True:
        url = f"{BASE_URL}{path}?api_key={API_KEY}&page={page}&limit={limit}"
        r = requests.get(url)
        if r.status_code != 200:
            log(f"Error fetching page {page}: {r.status_code} {r.text}")
            break
        
        data = r.json()
        if first_response is None:
            first_response = data
            
        results = data.get("results", [])
        if not results and isinstance(data, list):
            results = data
            
        all_records.extend(results)
        
        total = data.get("total")
        page_size = data.get("page_size", limit)
        
        log(f"Fetched page {page}: got {len(results)} items (Total reported: {total})")
        
        if not results:
            break
        if total is not None and len(all_records) >= total:
            break
        if len(results) < limit:
            break
            
        page += 1
        time.sleep(0.05) # respect rate limit

    log(f"Total fetched for {path}: {len(all_records)}")
    output_path = os.path.join(DATA_DIR, filename)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "first_response_meta": first_response,
            "total_records_fetched": len(all_records),
            "records": all_records
        }, f, indent=2)
    return all_records

# 4. Fetch Analytics Summary
def fetch_analytics():
    log("Fetching /v1/analytics/summary...")
    url = f"{BASE_URL}/v1/analytics/summary?api_key={API_KEY}"
    r = requests.get(url)
    log(f"Analytics status: {r.status_code}")
    if r.status_code == 200:
        with open(os.path.join(DATA_DIR, "analytics.json"), "w", encoding="utf-8") as f:
            json.dump(r.json(), f, indent=2)

if __name__ == "__main__":
    fetch_health()
    token = fetch_auth()
    
    log("Fetching listings...")
    listings = fetch_paginated_endpoint("/v1/listings", "listings.json")
    
    log("Fetching rentals...")
    rentals = fetch_paginated_endpoint("/v1/rentals", "rentals.json")
    
    log("Fetching projects...")
    projects = fetch_paginated_endpoint("/v1/projects", "projects.json")
    
    fetch_analytics()
    log("Data collection phase complete!")
