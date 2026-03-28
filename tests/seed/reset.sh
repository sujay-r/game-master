#!/bin/bash
echo "=============RESETTING DATABASE============="
npx supabase db reset --local
node --env-file=.env tests/seed/seed-dynamic.js

for file in ./supabase/storage/icons/*; do
  npx supabase storage cp --local --experimental "$file" ss:///icons/$(basename "$file")
done

echo "=============DATABASE RESET FINISHED============="
