#!/bin/bash

# Comprehensive diagnostics script for ChatVendas connection issues
# Run this on your Ubuntu system after installation

echo "=== ChatVendas Connection Diagnostics ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in the ChatVendas project directory"
    echo "Please run this script from the root of your ChatVendas installation"
    exit 1
fi

echo "1. Checking environment variables..."
echo "   Current directory: $(pwd)"
if [ -f ".env" ]; then
    echo "   ✅ .env file found"
    echo "   Supabase URL: $(grep VITE_SUPABASE_URL .env | cut -d'=' -f2)"
    echo "   Baileys URL: $(grep VITE_BAILEYS_URL .env | cut -d'=' -f2)"
    echo "   Web.js URL: $(grep VITE_WEBJS_URL .env | cut -d'=' -f2)"
else
    echo "   ❌ .env file not found"
fi
echo ""

echo "2. Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    echo "   ✅ PM2 is installed"
    echo "   PM2 processes:"
    pm2 list
else
    echo "   ❌ PM2 is not installed"
    echo "   Install with: npm install -g pm2"
fi
echo ""

echo "3. Checking network connectivity..."
echo "   Testing internet connectivity..."
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo "   ✅ Internet connectivity OK"
else
    echo "   ❌ No internet connectivity"
fi

echo "   Testing DNS resolution..."
if nslookup fwhcgliitnhcbtlcxnif.supabase.co &> /dev/null; then
    echo "   ✅ DNS resolution for Supabase OK"
else
    echo "   ❌ DNS resolution for Supabase failed"
fi
echo ""

echo "4. Checking port availability..."
echo "   Port 3000 (Frontend):"
if netstat -tulpn | grep :3000 &> /dev/null; then
    echo "   ✅ Port 3000 is listening"
else
    echo "   ❌ Port 3000 is not listening"
fi

echo "   Port 3001 (Baileys):"
if netstat -tulpn | grep :3001 &> /dev/null; then
    echo "   ✅ Port 3001 is listening"
else
    echo "   ❌ Port 3001 is not listening"
fi

echo "   Port 3002 (Web.js):"
if netstat -tulpn | grep :3002 &> /dev/null; then
    echo "   ✅ Port 3002 is listening"
else
    echo "   ❌ Port 3002 is not listening"
fi
echo ""

echo "5. Testing service connectivity..."
echo "   Testing Frontend (port 3000):"
if curl -s --connect-timeout 5 http://localhost:3000 &> /dev/null; then
    echo "   ✅ Frontend service is responding"
else
    echo "   ❌ Frontend service is not responding"
fi

echo "   Testing Baileys service (port 3001):"
if curl -s --connect-timeout 5 http://localhost:3001 &> /dev/null; then
    echo "   ✅ Baileys service is responding"
else
    echo "   ❌ Baileys service is not responding"
fi

echo "   Testing Web.js service (port 3002):"
if curl -s --connect-timeout 5 http://localhost:3002 &> /dev/null; then
    echo "   ✅ Web.js service is responding"
else
    echo "   ❌ Web.js service is not responding"
fi
echo ""

echo "6. Checking firewall status..."
if command -v ufw &> /dev/null; then
    echo "   UFW status: $(ufw status | head -1)"
else
    echo "   UFW not found"
fi
echo ""

echo "7. Checking Supabase connectivity..."
echo "   Testing Supabase endpoint..."
if curl -s --connect-timeout 10 -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d'=' -f2)" \
    https://fwhcgliitnhcbtlcxnif.supabase.co/rest/v1/ &> /dev/null; then
    echo "   ✅ Supabase is accessible"
else
    echo "   ❌ Supabase is not accessible"
    echo "   This could be due to:"
    echo "   - Network connectivity issues"
    echo "   - Firewall blocking outgoing connections"
    echo "   - DNS resolution problems"
    echo "   - Supabase service temporary unavailability"
fi
echo ""

echo "=== Diagnostic Summary ==="
echo ""
echo "Common solutions if services are not responding:"
echo "1. Start services: pm2 start ecosystem.config.cjs"
echo "2. Restart services: pm2 restart all"
echo "3. Check logs: pm2 logs"
echo "4. Check firewall: sudo ufw allow 3000 && sudo ufw allow 3001 && sudo ufw allow 3002"
echo ""
echo "If Supabase is not accessible:"
echo "1. Check internet connectivity"
echo "2. Try accessing https://fwhcgliitnhcbtlcxnif.supabase.co in a browser"
echo "3. Check if your network blocks outgoing connections to Supabase"