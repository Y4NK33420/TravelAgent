# Pinecone Setup Guide (Easier than Qdrant!)

## Why Pinecone?

✅ **Cloud-based** - No local installation needed  
✅ **Free tier** - 1 index, up to 100K vectors  
✅ **Simple setup** - Just API key, no Docker  
✅ **Auto-scaling** - Managed service  

---

## Step 1: Create Pinecone Account (2 minutes)

1. Go to: https://www.pinecone.io/
2. Click "Sign Up" (free tier available)
3. Create account with email/Google

---

## Step 2: Get API Key

1. After login, go to: https://app.pinecone.io/
2. Click "API Keys" in left sidebar
3. You'll see your API key (looks like: `pcsk_xxx...`)
4. **Copy this API key** (you'll need it next)

---

## Step 3: Update .env File

In `C:\Users\Yugam\Downloads\HCI_WORKING\backend\.env`, update these lines:

```env
# Vector Database - Pinecone (Phase 2.2)
PINECONE_API_KEY=pcsk_YOUR_API_KEY_HERE
PINECONE_ENVIRONMENT=gcp-starter
PINECONE_INDEX_NAME=travel-agent-pois
```

Replace `pcsk_YOUR_API_KEY_HERE` with your actual Pinecone API key.

---

## Step 4: That's It!

No Docker, no local services, no port conflicts. Pinecone is ready to use!

When you start the backend, it will automatically:
1. Connect to Pinecone
2. Create the index if it doesn't exist
3. Start indexing POIs

---

## Verify Setup

Start your backend:

```bash
cd C:\Users\Yugam\Downloads\HCI_WORKING\backend
python start_server.py
```

You should see:
```
✓ Database initialized
✓ Vector store initialized  ← This line confirms Pinecone is working!
✓ Google Maps service initialized
✓ Gemini service initialized
```

Visit: http://localhost:8000/api/v2/pois/stats

You should see:
```json
{
  "total_indexed_pois": 0,
  "collection": "travel-agent-pois",
  "status": "operational"
}
```

---

## Test Semantic Search

Once you have some POIs indexed, test the semantic search:

```bash
# Using curl (or use http://localhost:8000/docs)
curl -X POST "http://localhost:8000/api/v2/pois/semantic-search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "quiet cafes with good wifi for working",
    "limit": 10
  }'
```

---

## Pinecone Dashboard

View your index at: https://app.pinecone.io/

You can see:
- Number of vectors indexed
- Query performance
- Usage statistics

---

## Free Tier Limits

- **1 index** (enough for this project)
- **100,000 vectors** (plenty for POIs)
- **2GB storage**
- **Unlimited queries**

This is more than enough for development and even small production deployments!

---

## Troubleshooting

### Error: "Invalid API key"

**Solution:**
1. Go to https://app.pinecone.io/
2. Copy your API key again
3. Make sure there are no spaces in `.env`
4. Restart the backend

### Error: "Index already exists"

**Solution:** This is fine! The system will use the existing index.

To start fresh:
1. Go to https://app.pinecone.io/
2. Delete the `travel-agent-pois` index
3. Restart backend (it will recreate it)

### Can't see indexed POIs

**Solution:** POIs are indexed when discovered. Run a trip planning workflow:
1. Create user + login
2. Create trip
3. Run discovery agent → POIs get indexed automatically

---

## Comparison: Pinecone vs Qdrant

| Feature | Pinecone | Qdrant |
|---------|----------|--------|
| **Setup** | API key only | Docker or local install |
| **Hosting** | Cloud (managed) | Self-hosted |
| **Free Tier** | 100K vectors | Unlimited (self-hosted) |
| **Maintenance** | None | You manage |
| **Scaling** | Automatic | Manual |
| **Best For** | Quick start, production | Full control, privacy |

For this project, **Pinecone is easier and recommended for development**.

---

## Next Steps

After Pinecone is working:

1. ✅ Setup PostgreSQL (see QUICK_SETUP.md)
2. ✅ Run migrations: `alembic upgrade head`
3. ✅ Start backend: `python start_server.py`
4. ✅ Test API: http://localhost:8000/docs

---

**Need Help?** Check the Pinecone docs: https://docs.pinecone.io/








