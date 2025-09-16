# Whisper Functionality Implementation

## Overview
The Electron app now automatically sends whisper requests to Path of Exile's trade API when new trade data is received from the Chrome extension.

## How It Works

### 1. Data Flow
```
Chrome Extension → WebSocket → Electron App → Whisper API
```

1. **Chrome Extension** captures trade data and sends it via WebSocket
2. **Electron App** receives the data and extracts necessary information
3. **Whisper Request** is automatically sent to POE's whisper API
4. **Results** are displayed in the UI

### 2. Data Extraction

From the received trade data, the system extracts:
- **hideout_token**: From `result.listing.hideout_token`
- **query**: From the URL (last part after the final slash)
- **item_name**: From `result.item.name` or `result.item.typeLine`
- **account_name**: From `result.listing.account.name`

### 3. Rate Limiting

- **10-second cooldown** between whisper requests
- **Immediate processing** when new trade data arrives (if not rate limited)
- **Duplicate detection** prevents processing the same trade multiple times
- Prevents spam and respects POE's API limits
- Shows remaining wait time in console when rate limited

### 4. Authentication

- Uses **POESESSID** cookie from the Chrome extension
- Cookie is automatically stored when received from extension
- Sent in the `Cookie` header of whisper requests

## Implementation Details

### Main Process (main.js)

```javascript
// Rate limiting variables
let lastWhisperTime = 0;
const WHISPER_RATE_LIMIT = 10000; // 10 seconds
let isWhisperPending = false; // Prevent multiple simultaneous whisper requests
let lastProcessedTradeId = null; // Prevent duplicate processing

// Store POESESSID when received
if (data.cookies && data.cookies.POESESSID) {
  poeSessionId = data.cookies.POESESSID.value;
}

// Handle whisper for new trade data (immediate processing if not rate limited)
handleWhisperRequest(data);
```

### Whisper Request Structure

```javascript
const response = await axios.post('https://www.pathofexile.com/api/trade2/whisper', 
  {
    token: hideoutToken
  },
  {
    headers: {
      'cookie': `POESESSID=${poeSessionId}`,
      'referer': `https://www.pathofexile.com/trade2/search/poe2/Rise%20of%20the%20Abyssal/${query}`,
      // ... other headers
    }
  }
);
```

### UI Display (renderer.js)

- **Whisper History Section**: Shows all whisper attempts
- **Success/Error Indicators**: Visual feedback for each whisper
- **Real-time Updates**: New whispers appear immediately
- **Scrollable List**: Limited to 50 most recent whispers

## Example Data Flow

### Input (from Chrome Extension)
```json
{
  "type": "TRADE_DATA",
  "url": "/api/trade2/fetch/e160a514d414e69c087d79d201680b493035fdfaaa2e5c93bf4c52321b61ada7?query=8eJ93OMtV&realm=poe2",
  "data": {
    "result": [{
      "listing": {
        "hideout_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "account": { "name": "Himawari#5209" }
      },
      "item": {
        "name": "Oblivion Scratch",
        "typeLine": "Attuned Wand"
      }
    }]
  }
}
```

### Extracted Data
- **Query**: `8eJ93OMtV` (from URL)
- **Hideout Token**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`
- **Item Name**: `Oblivion Scratch`
- **Account**: `Himawari#5209`

### Whisper Request
```bash
POST https://www.pathofexile.com/api/trade2/whisper
Cookie: POESESSID=977814ba395d5c9896b8e27a61191654
Referer: https://www.pathofexile.com/trade2/search/poe2/Rise%20of%20the%20Abyssal/8eJ93OMtV
Content-Type: application/json

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Features

### ✅ **Automatic Whisper Sending**
- Triggers immediately when new trade data arrives
- No manual intervention required

### ✅ **Rate Limiting**
- 10-second cooldown between requests
- Prevents API abuse

### ✅ **Error Handling**
- Graceful handling of failed requests
- Detailed error logging

### ✅ **UI Feedback**
- Real-time whisper history
- Success/error indicators
- Timestamp tracking

### ✅ **Data Validation**
- Checks for required data before sending
- Validates POESESSID availability
- Ensures hideout token exists

## Console Output Examples

### Successful Whisper
```
📤 Sending whisper for item: Oblivion Scratch from Himawari#5209
🔗 Query: 8eJ93OMtV, Token: eyJ0eXAiOiJKV1QiLCJhbGc...
✅ Whisper sent successfully for Oblivion Scratch
📊 Response status: 200
```

### Rate Limited
```
⏰ Whisper rate limited. Waiting 7 seconds...
```

### Missing Data
```
❌ No POESESSID available for whisper request
❌ No hideout token available for whisper
```

## Dependencies Added

- **axios**: For making HTTP requests to POE's whisper API

## Installation

1. **Install dependencies**:
   ```bash
   cd electron-app
   npm install
   ```

2. **Start the app**:
   ```bash
   npm start
   ```

3. **Ensure Chrome extension is active** and sending data

The whisper functionality will work automatically once the Chrome extension starts sending trade data and cookies to the Electron app.
