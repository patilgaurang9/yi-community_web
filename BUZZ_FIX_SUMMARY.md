# Buzz Chat Interface - Connection Fix Summary

## Issues Fixed

### 1. **CORS Configuration** ✅
**Problem:** Backend only allowed `localhost:3000`, but Next.js might use `127.0.0.1:3000`
**Fix:** Added `http://127.0.0.1:3000` and `http://127.0.0.1:3001` to CORS origins

### 2. **Default API URL** ✅
**Problem:** Frontend defaulted to `localhost:5000` which can have DNS resolution issues
**Fix:** Changed default to `http://127.0.0.1:5000` for more reliable connection

### 3. **OPTIONS Preflight Response** ✅
**Problem:** OPTIONS handler didn't explicitly set CORS headers
**Fix:** Added explicit CORS headers to OPTIONS response

### 4. **Error Logging** ✅
**Problem:** Generic error messages made debugging difficult
**Fix:** Added detailed console logging for:
- Request URL being called
- Payload being sent
- Response status
- Error details

## Connection Flow Verification

### Step 1: Browser sends OPTIONS (Preflight)
- ✅ Backend handles OPTIONS at `/api/chat`
- ✅ Returns 200 with CORS headers
- ✅ Allows `Content-Type` header

### Step 2: Browser sends POST
- ✅ Frontend sends to `http://127.0.0.1:5000/api/chat`
- ✅ Payload: `{ "query": "user message" }`
- ✅ Headers: `Content-Type: application/json`
- ✅ Backend reads `request.json.get("query")`

### Step 3: Backend Response
- ✅ Returns: `{ category, answer, data }`
- ✅ Frontend extracts `data.answer` and `data.data`

## Environment Variable Setup

Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:5000
```

**Important:** After creating/updating `.env.local`:
1. Stop the Next.js dev server (Ctrl+C)
2. Restart with `npm run dev`
3. Next.js only reads env vars on startup

## Manual Verification Steps

### 1. Check Backend is Running
```bash
cd backend
python server.py
# Should see: Running on http://0.0.0.0:5000
```

### 2. Test Backend Health Endpoint
```bash
curl http://127.0.0.1:5000/health
# Should return JSON with status: "ok"
```

### 3. Test Chat Endpoint Directly
```bash
curl -X POST http://127.0.0.1:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
# Should return JSON with category, answer, data
```

### 4. Check Browser Console
Open browser DevTools → Console
- Look for 🔵 logs showing API URL and request details
- Look for 🟢 logs showing response status
- Look for ❌ logs showing any errors

## Common Failure Points

| Issue | Symptom | Solution |
|-------|---------|----------|
| Backend not running | "Failed to fetch" | Start backend: `python server.py` |
| Wrong port | Connection refused | Verify backend runs on port 5000 |
| CORS blocked | CORS error in console | Check CORS origins include your frontend URL |
| Env var not loaded | Uses default URL | Restart Next.js after changing `.env.local` |
| localhost vs 127.0.0.1 | DNS resolution fails | Use `127.0.0.1` in `.env.local` |

## Debugging Checklist

- [ ] Backend is running (`python server.py`)
- [ ] Backend shows: `Running on http://0.0.0.0:5000`
- [ ] Frontend `.env.local` exists with `NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:5000`
- [ ] Next.js dev server was restarted after env changes
- [ ] Browser console shows 🔵 logs with correct API URL
- [ ] No CORS errors in browser console
- [ ] Network tab shows OPTIONS request succeeds (200)
- [ ] Network tab shows POST request succeeds (200)

## Code Changes Made

### Backend (`server.py`)
1. Added `127.0.0.1` variants to CORS origins
2. Enhanced OPTIONS handler with explicit CORS headers

### Frontend (`app/(portal)/buzz/page.tsx`)
1. Changed default URL from `localhost` to `127.0.0.1`
2. Added comprehensive error logging
3. Added API URL logging on component mount
4. Improved error messages with details

## Next Steps

1. **Create `.env.local`** in frontend directory:
   ```
   NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:5000
   ```

2. **Restart both servers:**
   - Backend: `python server.py`
   - Frontend: Stop (Ctrl+C) and `npm run dev`

3. **Test the connection:**
   - Open browser console
   - Send a test message in the chat
   - Check console logs for connection details

4. **If still failing:**
   - Check browser Network tab for failed requests
   - Verify backend logs show incoming requests
   - Check CORS headers in Network tab response headers
