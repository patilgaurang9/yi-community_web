# import os
# import json
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from dotenv import load_dotenv
# from openai import OpenAI
# from supabase import create_client, Client
# from datetime import datetime, timedelta

# # Load environment variables
# load_dotenv()

# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# app = Flask(__name__)

# # CORS configuration for web - allow your frontend domains
# # For development, allow all localhost/127.0.0.1 variants on any port
# CORS(app, resources={
#     r"/*": {
#         "origins": "*",  # Allow all origins in development
#         "methods": ["GET", "POST", "OPTIONS"],
#         "allow_headers": ["Content-Type", "Authorization"],
#         "supports_credentials": False  # Must be False when origins is *
#     }
# })

# # Initialize OpenAI client
# client = OpenAI(api_key=OPENAI_API_KEY)

# # Initialize Supabase client
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# @app.route("/health", methods=["GET"])
# def health():
#     """Health check endpoint"""
#     try:
#         # Minimal test call
#         client.models.list()

#         return jsonify({
#             "status": "ok",
#             "openai_key_loaded": True,
#             "openai_api_working": True,
#             "timestamp": datetime.utcnow().isoformat()
#         })

#     except Exception as e:
#         return jsonify({
#             "status": "error",
#             "openai_key_loaded": OPENAI_API_KEY is not None,
#             "openai_api_working": False,
#             "error": str(e)
#         }), 500


# @app.route("/api/chat", methods=["POST", "OPTIONS"])
# def chat():
#     """Handle AI assistant queries - both general and database-specific"""
#     # Handle preflight OPTIONS request
#     if request.method == "OPTIONS":
#         response = jsonify({"status": "ok"})
#         response.headers.add("Access-Control-Allow-Origin", "*")
#         response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
#         response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
#         return response, 200
    
#     try:
#         data = request.json
#         user_query = data.get("query", "")
        
#         if not user_query:
#             return jsonify({"error": "Query is required"}), 400
        
#         # Step 1: Categorize the query using AI
#         category_response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": """You are a query classifier. Categorize user queries into one of these types:
#                     - "members": queries about finding members/profiles (company, industry, role, field, location, job title, etc.)
#                     - "events": queries about events (recent, upcoming, ongoing, by date, by category, by topic/keyword, etc.)
#                     - "offers": queries about benefits/offers/deals/discounts
#                     - "general": general questions not related to the above
                    
#                     Extract ALL relevant filters from the query. Be precise:
#                     - For members: extract company, industry, role, location, job_title
#                       * If user mentions "role" or "job" (like "role engineer" or "job developer"), put it in job_title field
#                       * "industry" is for sectors like tech, healthcare, finance, etc.
#                       * "role" is only for Member/Admin type roles in the community
#                     - For events: extract specific dates, timeframe (recent/upcoming/ongoing), category, and ALWAYS extract keywords
#                       * keyword should be the main topic/subject of events they're looking for
#                       * Examples: "cyber security events" -> keyword: "cyber security"
#                       * "product management event" -> keyword: "product management"
#                       * "tech networking" -> keyword: "tech networking"
#                     - For offers: extract keywords about what type of offer/benefit they want
                    
#                     Respond ONLY with a JSON object like:
#                     {
#                         "category": "members|events|offers|general",
#                         "filters": {
#                             "company": "exact company name if mentioned",
#                             "industry": "industry name if mentioned (e.g., tech, healthcare, finance)",
#                             "role": "Member/Admin role in community (rarely used)",
#                             "location": "location if mentioned",
#                             "job_title": "job position like engineer, developer, manager, designer, etc.",
#                             "date": "YYYY-MM-DD if specific date mentioned",
#                             "timeframe": "recent|upcoming|ongoing",
#                             "category": "event category if mentioned",
#                             "keyword": "main search topic/keywords for events or offers"
#                         }
#                     }
                    
#                     Examples:
#                     - "find members in tech industry" -> category: "members", industry: "tech"
#                     - "show me members with role engineer" -> category: "members", job_title: "engineer"
#                     - "cyber security events" -> category: "events", keyword: "cyber security"
#                     - "product management event" -> category: "events", keyword: "product management"
#                     - "upcoming events" -> category: "events", timeframe: "upcoming"
#                     - "events on 2026-01-15" -> category: "events", date: "2026-01-15"
#                     - "offers related to gym" -> category: "offers", keyword: "gym"
#                     """
#                 },
#                 {
#                     "role": "user",
#                     "content": user_query
#                 }
#             ],
#             temperature=0.3
#         )
        
#         # Parse the categorization
#         category_data = json.loads(category_response.choices[0].message.content)
#         category = category_data.get("category")
#         filters = category_data.get("filters", {})
        
#         print(f"Query: '{user_query}'")
#         print(f"Categorized as: {category}")
#         print(f"Filters: {filters}")
        
#         # Step 2: Handle based on category
#         if category == "members":
#             results = query_members(filters)
#             ai_response = generate_members_response(user_query, results)
#             return jsonify({
#                 "category": "members",
#                 "answer": ai_response,
#                 "data": results
#             })
            
#         elif category == "events":
#             results = query_events(filters)
#             ai_response = generate_events_response(user_query, results)
#             return jsonify({
#                 "category": "events",
#                 "answer": ai_response,
#                 "data": results
#             })
            
#         elif category == "offers":
#             results = query_offers(filters)
#             ai_response = generate_offers_response(user_query, results)
#             return jsonify({
#                 "category": "offers",
#                 "answer": ai_response,
#                 "data": results
#             })
            
#         else:  # general
#             # For general queries, just use GPT directly
#             general_response = client.chat.completions.create(
#                 model="gpt-4o-mini",
#                 messages=[
#                     {
#                         "role": "system",
#                         "content": "You are a helpful AI assistant for a professional community platform. Be friendly, concise, and helpful."
#                     },
#                     {
#                         "role": "user",
#                         "content": user_query
#                     }
#                 ],
#                 temperature=0.7
#             )
            
#             return jsonify({
#                 "category": "general",
#                 "answer": general_response.choices[0].message.content,
#                 "data": None
#             })
            
#     except Exception as e:
#         print(f"Error in chat endpoint: {str(e)}")
#         return jsonify({"error": str(e)}), 500


# def query_members(filters):
#     """Query the profiles table based on filters"""
#     try:
#         query = supabase.table("profiles").select("*")
        
#         has_filters = False
        
#         # Apply specific column filters
#         if filters.get("company"):
#             query = query.ilike("company", f"%{filters['company']}%")
#             has_filters = True
        
#         if filters.get("industry"):
#             query = query.ilike("industry", f"%{filters['industry']}%")
#             has_filters = True
        
#         if filters.get("role"):
#             query = query.ilike("role", f"%{filters['role']}%")
#             has_filters = True
        
#         if filters.get("location"):
#             query = query.ilike("location", f"%{filters['location']}%")
#             has_filters = True
        
#         if filters.get("job_title"):
#             query = query.ilike("job_title", f"%{filters['job_title']}%")
#             has_filters = True
        
#         # Keyword search across multiple fields (only if no specific filters)
#         if filters.get("keyword") and not has_filters:
#             keyword = filters["keyword"]
#             results = query.execute()
#             # Filter in Python for keyword matching across fields
#             filtered = [
#                 r for r in results.data 
#                 if any(keyword.lower() in str(r.get(field, "")).lower() 
#                        for field in ["full_name", "company", "industry", "job_title", "location", "role"])
#             ]
#             return filtered[:20]
        
#         results = query.limit(20).execute()
#         return results.data
        
#     except Exception as e:
#         print(f"Error querying members: {str(e)}")
#         return []


# def query_events(filters):
#     """Query the events table based on filters"""
#     try:
#         query = supabase.table("events").select("*")
        
#         now = datetime.utcnow()
#         has_time_filter = False
        
#         # Specific date filter takes priority
#         if filters.get("date"):
#             try:
#                 # Parse the date and create a range for the entire day
#                 target_date = datetime.fromisoformat(filters["date"])
#                 start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
#                 end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                
#                 query = query.gte("start_time", start_of_day.isoformat())
#                 query = query.lte("start_time", end_of_day.isoformat())
#                 has_time_filter = True
#             except Exception as e:
#                 print(f"Error parsing date: {e}")
        
#         # Handle timeframe filters (only if no specific date)
#         elif filters.get("timeframe"):
#             if filters["timeframe"] == "recent":
#                 # Events that ended in the last 7 days
#                 past_date = now - timedelta(days=7)
#                 query = query.gte("start_time", past_date.isoformat())
#                 query = query.lte("start_time", now.isoformat())
#                 has_time_filter = True
            
#             elif filters["timeframe"] == "upcoming":
#                 # Events starting in the future
#                 query = query.gte("start_time", now.isoformat())
#                 has_time_filter = True
            
#             elif filters["timeframe"] == "ongoing":
#                 # Events that are currently happening
#                 query = query.lte("start_time", now.isoformat())
#                 # Also check if end_time is in the future (if exists)
#                 results = query.execute()
#                 filtered = [
#                     r for r in results.data 
#                     if r.get("end_time") and datetime.fromisoformat(r["end_time"].replace("Z", "+00:00")) >= now
#                 ]
#                 return filtered[:20]
        
#         # Category filter
#         if filters.get("category"):
#             query = query.ilike("category", f"%{filters['category']}%")
        
#         # Keyword search with robust scoring (applied after initial filtering)
#         if filters.get("keyword"):
#             keyword = filters["keyword"].lower()
#             # If no time filter was applied, get all events
#             if not has_time_filter:
#                 results = query.limit(200).execute()  # Get more events for better matching
#             else:
#                 results = query.execute()
            
#             print(f"Searching events with keyword: '{keyword}'")
#             print(f"Total events to search: {len(results.data)}")
            
#             # Score each event based on relevance
#             scored_results = []
#             for event in results.data:
#                 score = 0
#                 title = str(event.get("title", "")).lower()
#                 description = str(event.get("description", "")).lower()
#                 category = str(event.get("category", "")).lower()
#                 location = str(event.get("location_name", "")).lower()
#                 host = str(event.get("host_name", "")).lower()
                
#                 # Exact match in title gets highest score
#                 if keyword == title:
#                     score += 100
#                 elif keyword in title:
#                     score += 50
                
#                 # Partial word matches in title
#                 search_words = keyword.split()
#                 for word in search_words:
#                     if len(word) > 2:  # Skip very short words
#                         if word in title:
#                             score += 20
#                         if word in description:
#                             score += 10
#                         if word in category:
#                             score += 15
#                         if word in location:
#                             score += 8
#                         if word in host:
#                             score += 5
                
#                 # Boost for category relevance
#                 if keyword in category or category in keyword:
#                     score += 25
                
#                 if score > 0:
#                     scored_results.append((score, event))
            
#             print(f"Found {len(scored_results)} matching events")
            
#             # Sort by score (highest first) and return
#             scored_results.sort(key=lambda x: x[0], reverse=True)
#             return [event for score, event in scored_results[:20]]
        
#         results = query.order("start_time", desc=False).limit(20).execute()
#         return results.data
        
#     except Exception as e:
#         print(f"Error querying events: {str(e)}")
#         return []


# def query_offers(filters):
#     """Query the benefits table based on filters"""
#     try:
#         query = supabase.table("benefits").select("*").eq("type", "offer")
        
#         # Only show non-expired offers
#         now = datetime.utcnow().date().isoformat()
#         query = query.or_(f"expiration_date.gte.{now},expiration_date.is.null")
        
#         # Get all offers first
#         results = query.execute()
        
#         # Apply keyword/category filtering
#         if filters.get("category") or filters.get("keyword"):
#             search_term = (filters.get("category") or filters.get("keyword")).lower()
            
#             # Score each offer based on relevance
#             scored_results = []
#             for offer in results.data:
#                 score = 0
#                 title = str(offer.get("title", "")).lower()
#                 description = str(offer.get("description", "")).lower()
                
#                 # Exact match in title gets highest score
#                 if search_term in title:
#                     score += 10
                
#                 # Words match in title
#                 search_words = search_term.split()
#                 for word in search_words:
#                     if word in title:
#                         score += 5
#                     if word in description:
#                         score += 2
                
#                 if score > 0:
#                     scored_results.append((score, offer))
            
#             # Sort by score (highest first) and return
#             scored_results.sort(key=lambda x: x[0], reverse=True)
#             return [offer for score, offer in scored_results[:20]]
        
#         return results.data[:20]
        
#     except Exception as e:
#         print(f"Error querying offers: {str(e)}")
#         return []


# def generate_members_response(query, results):
#     """Generate natural language response for member queries"""
#     try:
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a helpful assistant. Given a user query and search results, provide a natural, friendly response summarizing the findings. Be concise but informative. Use PLAIN TEXT ONLY - no markdown, no asterisks, no special formatting. Just simple conversational text."
#                 },
#                 {
#                     "role": "user",
#                     "content": f"Query: {query}\n\nResults: {json.dumps(results[:5])}\n\nProvide a friendly summary of these members using plain text only (no markdown formatting)."
#                 }
#             ],
#             temperature=0.7
#         )
#         return response.choices[0].message.content
#     except:
#         return f"Found {len(results)} members matching your criteria."


# def generate_events_response(query, results):
#     """Generate natural language response for event queries"""
#     try:
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a helpful assistant. Given a user query and event results, provide a natural, friendly response summarizing the events. Be concise but informative. Use PLAIN TEXT ONLY - no markdown, no asterisks, no special formatting. Just simple conversational text."
#                 },
#                 {
#                     "role": "user",
#                     "content": f"Query: {query}\n\nResults: {json.dumps(results[:5])}\n\nProvide a friendly summary of these events using plain text only (no markdown formatting)."
#                 }
#             ],
#             temperature=0.7
#         )
#         return response.choices[0].message.content
#     except:
#         return f"Found {len(results)} events matching your criteria."


# def generate_offers_response(query, results):
#     """Generate natural language response for offer queries"""
#     try:
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a helpful assistant. Given a user query and offer results, provide a natural, friendly response summarizing the offers. Be concise but informative. Use PLAIN TEXT ONLY - no markdown, no asterisks, no special formatting. Just simple conversational text."
#                 },
#                 {
#                     "role": "user",
#                     "content": f"Query: {query}\n\nResults: {json.dumps(results[:5])}\n\nProvide a friendly summary of these offers using plain text only (no markdown formatting)."
#                 }
#             ],
#             temperature=0.7
#         )
#         return response.choices[0].message.content
#     except:
#         return f"Found {len(results)} offers matching your criteria."


# if __name__ == "__main__":
#     # For production, use a production WSGI server like gunicorn
#     # gunicorn -w 4 -b 0.0.0.0:5000 app:app
#     port = int(os.environ.get("PORT", 5000))
#     app.run(host="0.0.0.0", port= port, debug=False)




import os
import json
import time  # <--- Added time module
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = Flask(__name__)

# CORS configuration for web - allow your frontend domains
# For development, allow all localhost/127.0.0.1 variants on any port
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Allow all origins in development
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False  # Must be False when origins is *
    }
})

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hardcoded Q&A responses - checked FIRST before AI processing
HARDCODED_RESPONSES = {
    "who is the india head of yi": {
        "category": "general",
        "answer": "The India head of Young Indians (Yi), an integral part of the Confederation of Indian Industry (CII), is the National Chairman, currently held by Arun Rathod for the 2026 term.",
        "data": None
    },
    "who is the india head of yi?": {
        "category": "general",
        "answer": "The India head of Young Indians (Yi), an integral part of the Confederation of Indian Industry (CII), is the National Chairman, currently held by Arun Rathod for the 2026 term.",
        "data": None
    },
    "which is the biggest yi chapter in india": {
        "category": "general",
        "answer": "While specific rankings fluctuate, Young Indians (Yi) chapters in major metropolitan and industrial hubs like Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune, and Kolkata are typically the largest, driven by high concentrations of entrepreneurs and professionals, with cities like Vadodara and Raipur also showing significant growth, though official data isn't always public. Yi's network spans many cities (over 70 chapters), so 'biggest' can mean most members or most impactful activities, but large city chapters generally lead in numbers.",
        "data": None
    },
    "which is the biggest yi chapter in india?": {
        "category": "general",
        "answer": "While specific rankings fluctuate, Young Indians (Yi) chapters in major metropolitan and industrial hubs like Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune, and Kolkata are typically the largest, driven by high concentrations of entrepreneurs and professionals, with cities like Vadodara and Raipur also showing significant growth, though official data isn't always public. Yi's network spans many cities (over 70 chapters), so 'biggest' can mean most members or most impactful activities, but large city chapters generally lead in numbers.",
        "data": None
    }
}

# Flexible keyword matching for hardcoded responses
HARDCODED_KEYWORDS = {
    "india head yi": "The India head of Young Indians (Yi), an integral part of the Confederation of Indian Industry (CII), is the National Chairman, currently held by Arun Rathod for the 2026 term.",
    "yi india head": "The India head of Young Indians (Yi), an integral part of the Confederation of Indian Industry (CII), is the National Chairman, currently held by Arun Rathod for the 2026 term.",
    "national chairman yi": "The India head of Young Indians (Yi), an integral part of the Confederation of Indian Industry (CII), is the National Chairman, currently held by Arun Rathod for the 2026 term.",
    "biggest yi chapter": "While specific rankings fluctuate, Young Indians (Yi) chapters in major metropolitan and industrial hubs like Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune, and Kolkata are typically the largest, driven by high concentrations of entrepreneurs and professionals, with cities like Vadodara and Raipur also showing significant growth, though official data isn't always public. Yi's network spans many cities (over 70 chapters), so 'biggest' can mean most members or most impactful activities, but large city chapters generally lead in numbers.",
    "largest yi chapter": "While specific rankings fluctuate, Young Indians (Yi) chapters in major metropolitan and industrial hubs like Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune, and Kolkata are typically the largest, driven by high concentrations of entrepreneurs and professionals, with cities like Vadodara and Raipur also showing significant growth, though official data isn't always public. Yi's network spans many cities (over 70 chapters), so 'biggest' can mean most members or most impactful activities, but large city chapters generally lead in numbers."
}

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    try:
        # Minimal test call
        client.models.list()

        return jsonify({
            "status": "ok",
            "openai_key_loaded": True,
            "openai_api_working": True,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "openai_key_loaded": OPENAI_API_KEY is not None,
            "openai_api_working": False,
            "error": str(e)
        }), 500


@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat():
    """Handle AI assistant queries - both general and database-specific"""
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200
    
    try:
        data = request.json
        user_query = data.get("query", "")
        
        if not user_query:
            return jsonify({"error": "Query is required"}), 400
        
        # STEP 0: Check hardcoded responses FIRST (exact match)
        user_query_lower = user_query.lower().strip()
        if user_query_lower in HARDCODED_RESPONSES:
            print(f"Hardcoded exact match found for: '{user_query}'")
            
            # --- DELAY ADDED HERE ---
            time.sleep(3) 
            # ------------------------
            
            return jsonify(HARDCODED_RESPONSES[user_query_lower])
        
        # STEP 0.5: Check hardcoded keywords (partial match)
        for keyword, answer in HARDCODED_KEYWORDS.items():
            if keyword in user_query_lower:
                print(f"Hardcoded keyword match found: '{keyword}' in '{user_query}'")
                
                # --- DELAY ADDED HERE ---
                time.sleep(3)
                # ------------------------
                
                return jsonify({
                    "category": "general",
                    "answer": answer,
                    "data": None
                })
        
        # Step 1: Categorize the query using AI
        category_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a query classifier. Categorize user queries into one of these types:
                    - "members": queries about finding members/profiles (company, industry, role, field, location, job title, etc.)
                    - "events": queries about events (recent, upcoming, ongoing, by date, by category, by topic/keyword, by organizer/host/vertical, etc.)
                    - "offers": queries about benefits/offers/deals/discounts
                    - "general": general questions not related to the above
                    
                    Extract ALL relevant filters from the query. Be precise:
                    - For members: extract company, industry, role, location, job_title, field
                      * If user mentions "role" or "job" (like "role engineer" or "job developer"), put it in job_title field
                      * "field" is for areas of work like "data science", "machine learning", "marketing", "sales"
                      * "industry" is for sectors like tech, healthcare, finance, etc.
                      * "role" is only for Member/Admin type roles in the community
                      * Examples: "find someone in data science" -> field: "data science"
                      * "who works in ML" -> field: "machine learning"
                    - For events: extract specific dates, timeframe (recent/upcoming/ongoing), category, organizer/host/vertical, and ALWAYS extract keywords
                      * keyword should be the main topic/subject of events they're looking for
                      * host_name or organizer for events arranged by specific people/organizations/verticals
                      * Examples: "cyber security events" -> keyword: "cyber security"
                      * "events by tech vertical" -> host_name: "tech"
                      * "upcoming events arranged by marketing team" -> timeframe: "upcoming", host_name: "marketing"
                      * "product management event" -> keyword: "product management"
                      * "tech networking" -> keyword: "tech networking"
                    - For offers: extract keywords about what type of offer/benefit they want
                    
                    Respond ONLY with a JSON object like:
                    {
                        "category": "members|events|offers|general",
                        "filters": {
                            "company": "exact company name if mentioned",
                            "industry": "industry name if mentioned (e.g., tech, healthcare, finance)",
                            "role": "Member/Admin role in community (rarely used)",
                            "location": "location if mentioned",
                            "job_title": "job position like engineer, developer, manager, designer, etc.",
                            "field": "area of work like data science, ML, marketing, sales, etc.",
                            "date": "YYYY-MM-DD if specific date mentioned",
                            "timeframe": "recent|upcoming|ongoing",
                            "category": "event category if mentioned",
                            "host_name": "organizer/host/vertical name if mentioned",
                            "keyword": "main search topic/keywords for events or offers"
                        }
                    }
                    
                    Examples:
                    - "find members in tech industry" -> category: "members", industry: "tech"
                    - "show me members with role engineer" -> category: "members", job_title: "engineer"
                    - "find someone who works in data science" -> category: "members", field: "data science"
                    - "who works in ML" -> category: "members", field: "machine learning"
                    - "cyber security events" -> category: "events", keyword: "cyber security"
                    - "upcoming events by tech vertical" -> category: "events", timeframe: "upcoming", host_name: "tech"
                    - "events arranged by marketing team" -> category: "events", host_name: "marketing"
                    - "product management event" -> category: "events", keyword: "product management"
                    - "upcoming events" -> category: "events", timeframe: "upcoming"
                    - "events on 2026-01-15" -> category: "events", date: "2026-01-15"
                    - "offers related to gym" -> category: "offers", keyword: "gym"
                    """
                },
                {
                    "role": "user",
                    "content": user_query
                }
            ],
            temperature=0.3
        )
        
        # Parse the categorization
        category_data = json.loads(category_response.choices[0].message.content)
        category = category_data.get("category")
        filters = category_data.get("filters", {})
        
        print(f"Query: '{user_query}'")
        print(f"Categorized as: {category}")
        print(f"Filters: {filters}")
        
        # Step 2: Handle based on category
        if category == "members":
            results = query_members(filters)
            ai_response = generate_members_response(user_query, results)
            return jsonify({
                "category": "members",
                "answer": ai_response,
                "data": results
            })
            
        elif category == "events":
            results = query_events(filters)
            ai_response = generate_events_response(user_query, results)
            return jsonify({
                "category": "events",
                "answer": ai_response,
                "data": results
            })
            
        elif category == "offers":
            results = query_offers(filters)
            ai_response = generate_offers_response(user_query, results)
            return jsonify({
                "category": "offers",
                "answer": ai_response,
                "data": results
            })
            
        else:  # general
            # For general queries, just use GPT directly
            general_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant for a professional community platform. Be friendly, concise, and helpful."
                    },
                    {
                        "role": "user",
                        "content": user_query
                    }
                ],
                temperature=0.7
            )
            
            return jsonify({
                "category": "general",
                "answer": general_response.choices[0].message.content,
                "data": None
            })
            
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500


def query_members(filters):
    """Query the profiles table based on filters"""
    try:
        query = supabase.table("profiles").select("*")
        
        has_filters = False
        
        # Apply specific column filters
        if filters.get("company"):
            query = query.ilike("company", f"%{filters['company']}%")
            has_filters = True
        
        if filters.get("industry"):
            query = query.ilike("industry", f"%{filters['industry']}%")
            has_filters = True
        
        if filters.get("role"):
            query = query.ilike("role", f"%{filters['role']}%")
            has_filters = True
        
        if filters.get("location"):
            query = query.ilike("location", f"%{filters['location']}%")
            has_filters = True
        
        if filters.get("job_title"):
            query = query.ilike("job_title", f"%{filters['job_title']}%")
            has_filters = True
        
        # NEW: Field/area of work filter (searches across job_title and industry)
        if filters.get("field"):
            field = filters["field"].lower()
            results = query.execute()
            
            # Score-based matching for field
            scored_results = []
            for member in results.data:
                score = 0
                job_title = str(member.get("job_title", "")).lower()
                industry = str(member.get("industry", "")).lower()
                company = str(member.get("company", "")).lower()
                
                # Check for field matches
                field_words = field.split()
                for word in field_words:
                    if len(word) > 2:
                        if word in job_title:
                            score += 10
                        if word in industry:
                            score += 5
                        if word in company:
                            score += 2
                
                # Boost for exact or close matches
                if field in job_title:
                    score += 20
                if field in industry:
                    score += 15
                
                if score > 0:
                    scored_results.append((score, member))
            
            # Sort by score and return
            scored_results.sort(key=lambda x: x[0], reverse=True)
            return [member for score, member in scored_results[:20]]
        
        # Keyword search across multiple fields (only if no specific filters)
        if filters.get("keyword") and not has_filters:
            keyword = filters["keyword"]
            results = query.execute()
            # Filter in Python for keyword matching across fields
            filtered = [
                r for r in results.data 
                if any(keyword.lower() in str(r.get(field, "")).lower() 
                       for field in ["full_name", "company", "industry", "job_title", "location", "role"])
            ]
            return filtered[:20]
        
        results = query.limit(20).execute()
        return results.data
        
    except Exception as e:
        print(f"Error querying members: {str(e)}")
        return []


def query_events(filters):
    """Query the events table based on filters"""
    try:
        query = supabase.table("events").select("*")
        
        now = datetime.utcnow()
        has_time_filter = False
        
        # Specific date filter takes priority
        if filters.get("date"):
            try:
                # Parse the date and create a range for the entire day
                target_date = datetime.fromisoformat(filters["date"])
                start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                
                query = query.gte("start_time", start_of_day.isoformat())
                query = query.lte("start_time", end_of_day.isoformat())
                has_time_filter = True
            except Exception as e:
                print(f"Error parsing date: {e}")
        
        # Handle timeframe filters (only if no specific date)
        elif filters.get("timeframe"):
            if filters["timeframe"] == "recent":
                # Events that ended in the last 7 days
                past_date = now - timedelta(days=7)
                query = query.gte("start_time", past_date.isoformat())
                query = query.lte("start_time", now.isoformat())
                has_time_filter = True
            
            elif filters["timeframe"] == "upcoming":
                # Events starting in the future
                query = query.gte("start_time", now.isoformat())
                has_time_filter = True
            
            elif filters["timeframe"] == "ongoing":
                # Events that are currently happening
                query = query.lte("start_time", now.isoformat())
                # Also check if end_time is in the future (if exists)
                results = query.execute()
                filtered = [
                    r for r in results.data 
                    if r.get("end_time") and datetime.fromisoformat(r["end_time"].replace("Z", "+00:00")) >= now
                ]
                return filtered[:20]
        
        # Category filter
        if filters.get("category"):
            query = query.ilike("category", f"%{filters['category']}%")
        
        # NEW: Host/Organizer/Vertical filter
        if filters.get("host_name"):
            host_filter = filters["host_name"].lower()
            print(f"Filtering events by host: '{host_filter}'")
            
            # Get events based on time filter if any
            if has_time_filter:
                results = query.execute()
            else:
                results = query.limit(200).execute()
            
            # Filter by host_name
            filtered_results = []
            for event in results.data:
                host_name = str(event.get("host_name", "")).lower()
                organizer = str(event.get("organizer", "")).lower()
                
                if host_filter in host_name or host_filter in organizer:
                    filtered_results.append(event)
            
            print(f"Found {len(filtered_results)} events by host '{host_filter}'")
            return filtered_results[:20]
        
        # Keyword search with robust scoring (applied after initial filtering)
        if filters.get("keyword"):
            keyword = filters["keyword"].lower()
            # If no time filter was applied, get all events
            if not has_time_filter:
                results = query.limit(200).execute()  # Get more events for better matching
            else:
                results = query.execute()
            
            print(f"Searching events with keyword: '{keyword}'")
            print(f"Total events to search: {len(results.data)}")
            
            # Score each event based on relevance
            scored_results = []
            for event in results.data:
                score = 0
                title = str(event.get("title", "")).lower()
                description = str(event.get("description", "")).lower()
                category = str(event.get("category", "")).lower()
                location = str(event.get("location_name", "")).lower()
                host = str(event.get("host_name", "")).lower()
                
                # Exact match in title gets highest score
                if keyword == title:
                    score += 100
                elif keyword in title:
                    score += 50
                
                # Partial word matches in title
                search_words = keyword.split()
                for word in search_words:
                    if len(word) > 2:  # Skip very short words
                        if word in title:
                            score += 20
                        if word in description:
                            score += 10
                        if word in category:
                            score += 15
                        if word in location:
                            score += 8
                        if word in host:
                            score += 5
                
                # Boost for category relevance
                if keyword in category or category in keyword:
                    score += 25
                
                if score > 0:
                    scored_results.append((score, event))
            
            print(f"Found {len(scored_results)} matching events")
            
            # Sort by score (highest first) and return
            scored_results.sort(key=lambda x: x[0], reverse=True)
            return [event for score, event in scored_results[:20]]
        
        results = query.order("start_time", desc=False).limit(20).execute()
        return results.data
        
    except Exception as e:
        print(f"Error querying events: {str(e)}")
        return []


def query_offers(filters):
    """Query the benefits table based on filters"""
    try:
        query = supabase.table("benefits").select("*").eq("type", "offer")
        
        # Only show non-expired offers
        now = datetime.utcnow().date().isoformat()
        query = query.or_(f"expiration_date.gte.{now},expiration_date.is.null")
        
        # Get all offers first
        results = query.execute()
        
        # Apply keyword/category filtering
        if filters.get("category") or filters.get("keyword"):
            search_term = (filters.get("category") or filters.get("keyword")).lower()
            
            # Score each offer based on relevance
            scored_results = []
            for offer in results.data:
                score = 0
                title = str(offer.get("title", "")).lower()
                description = str(offer.get("description", "")).lower()
                
                # Exact match in title gets highest score
                if search_term in title:
                    score += 10
                
                # Words match in title
                search_words = search_term.split()
                for word in search_words:
                    if word in title:
                        score += 5
                    if word in description:
                        score += 2
                
                if score > 0:
                    scored_results.append((score, offer))
            
            # Sort by score (highest first) and return
            scored_results.sort(key=lambda x: x[0], reverse=True)
            return [offer for score, offer in scored_results[:20]]
        
        return results.data[:20]
        
    except Exception as e:
        print(f"Error querying offers: {str(e)}")
        return []


def generate_members_response(query, results):
    """Generate natural language response for member queries"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Given a user query and search results, provide a natural, friendly response summarizing the findings. Be concise but informative. Use PLAIN TEXT ONLY - no markdown, no asterisks, no special formatting. Just simple conversational text."
                },
                {
                    "role": "user",
                    "content": f"Query: {query}\n\nResults: {json.dumps(results[:5])}\n\nProvide a friendly summary of these members using plain text only (no markdown formatting)."
                }
            ],
            temperature=0.7
        )
        return response.choices[0].message.content
    except:
        return f"Found {len(results)} members matching your criteria."


def generate_events_response(query, results):
    """Generate natural language response for event queries"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Given a user query and event results, provide a natural, friendly response summarizing the events. Be concise but informative. Use PLAIN TEXT ONLY - no markdown, no asterisks, no special formatting. Just simple conversational text."
                },
                {
                    "role": "user",
                    "content": f"Query: {query}\n\nResults: {json.dumps(results[:5])}\n\nProvide a friendly summary of these events using plain text only (no markdown formatting)."
                }
            ],
            temperature=0.7
        )
        return response.choices[0].message.content
    except:
        return f"Found {len(results)} events matching your criteria."


def generate_offers_response(query, results):
    """Generate natural language response for offer queries"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Given a user query and offer results, provide a natural, friendly response summarizing the offers. Be concise but informative. Use PLAIN TEXT ONLY - no markdown, no asterisks, no special formatting. Just simple conversational text."
                },
                {
                    "role": "user",
                    "content": f"Query: {query}\n\nResults: {json.dumps(results[:5])}\n\nProvide a friendly summary of these offers using plain text only (no markdown formatting)."
                }
            ],
            temperature=0.7
        )
        return response.choices[0].message.content
    except:
        return f"Found {len(results)} offers matching your criteria."


if __name__ == "__main__":
    # For production, use a production WSGI server like gunicorn
    # gunicorn -w 4 -b 0.0.0.0:5000 app:app
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)