# WhatsApp Integration Setup & Testing Guide

## ✅ Current Status

Your WhatsApp Business API is **connected and working**! The test message was sent successfully.

## 🚀 Next Steps

### Step 1: Connect Business to WhatsApp

Run this to connect your demo business with the WhatsApp phone number:

```bash
curl -X POST https://recepcionista.com/api/whatsapp/setup
```

Or visit in browser:
```
https://recepcionista.com/api/whatsapp/setup
```

This will:
- Create a demo business (`demo_business`) if it doesn't exist
- Connect it to your WhatsApp phone number ID (`931277210074180`)
- Enable the webhook to route incoming messages to your AI

### Step 2: Test the Full Flow

**Option A: Send a message from your phone**

1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business number: `+34 936 09 62 40`
3. Your AI should automatically respond!

**Option B: Use Meta's test number**

If you have a test number configured in Meta, you can send messages to it and receive responses.

### Step 3: Verify Webhook is Working

Check Vercel logs to see incoming messages:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Logs" tab
4. Look for `[WhatsApp] From ...` messages when someone texts you

### Step 4: Monitor Conversations

Once messages start coming in, you can:
- View conversations in your dashboard (when implemented)
- Check the database for stored messages
- See AI responses in real-time

## 🔍 Troubleshooting

### "No business found for phone_number_id"

**Solution:** Run the setup endpoint:
```bash
curl -X POST https://recepcionista.com/api/whatsapp/setup
```

### Messages not being received

**Check:**
1. Webhook is subscribed in Meta Business Suite
2. Webhook URL is: `https://recepcionista.com/api/whatsapp/webhook`
3. Verify token matches: `wefijafw_Fewijf!fw12`
4. Check Vercel logs for errors

### AI not responding

**Check:**
1. `OPENAI_API_KEY` is set in Vercel environment variables
2. `generateResponse` function is working (check logs)
3. Business has proper configuration in database

## 📋 Environment Variables Checklist

Make sure these are set in **Vercel** (not just `.env.local`):

- ✅ `WHATSAPP_ACCESS_TOKEN` - Your Meta access token
- ✅ `WHATSAPP_VERIFY_TOKEN` - Your webhook verify token
- ✅ `whatsappPhoneNumberId` - Your phone number ID (`931277210074180`)
- ✅ `whatsappPhoneNumber` - Display number (`+34 936 09 62 40`)
- ✅ `OPENAI_API_KEY` - For AI responses
- ✅ `DATABASE_URL` - For storing conversations
- ✅ `PINECONE_API_KEY` - For RAG (if using knowledge base)

## 🎯 What Happens When Someone Messages You

1. **Customer sends message** → Meta WhatsApp API
2. **Meta sends webhook** → `https://recepcionista.com/api/whatsapp/webhook`
3. **Webhook handler:**
   - Finds business by `phone_number_id`
   - Creates/updates conversation
   - Stores incoming message
   - Generates AI response using `generateResponse()`
   - Sends response back via WhatsApp API
   - Stores outgoing message

## 🚦 Testing Checklist

- [x] Test template message sent successfully
- [ ] Business connected via `/api/whatsapp/setup`
- [ ] Incoming message received via webhook
- [ ] AI response generated and sent
- [ ] Messages stored in database
- [ ] Conversation visible in dashboard

## 📞 Support

If you encounter issues:
1. Check Vercel logs for error messages
2. Verify all environment variables are set
3. Test webhook manually using Meta's webhook tester
4. Check Meta Business Suite for API status

---

**Ready to test?** Run the setup endpoint and send yourself a WhatsApp message! 🎉
