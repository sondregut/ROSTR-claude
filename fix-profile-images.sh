#!/bin/bash

echo "🔧 Fixing Profile Images with Local URIs"
echo "======================================="
echo ""
echo "This script will check for and fix any profiles that have local file:// URIs"
echo "which don't work in production builds."
echo ""

# Run the TypeScript fix script
npx ts-node scripts/fix-local-image-uris.ts

echo ""
echo "✅ Done! Profile images should now work properly in production."
echo ""
echo "Next steps:"
echo "1. Try uploading a new profile photo"
echo "2. Make sure you have a good network connection"
echo "3. The photo will upload to Supabase storage"
echo ""