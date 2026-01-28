#!/bin/bash

# WhatsApp Business Setup Script
# This connects your demo business to WhatsApp using the existing API endpoint

echo "🔗 Connecting WhatsApp to your business..."

# Use the existing /api/whatsapp/connect endpoint
curl -X POST https://recepcionista.com/api/whatsapp/connect \
  -H 'Content-Type: application/json' \
  -d '{
    "businessId": "demo_business",
    "phoneNumberId": "931277210074180",
    "phoneNumber": "+34 936 09 62 40"
  }'

echo ""
echo ""
echo "✅ Done! If you see 'success: true', your business is connected."
echo ""
echo "📱 Next step: Send a WhatsApp message to +34 936 09 62 40"
