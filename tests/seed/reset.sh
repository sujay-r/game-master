#!/bin/bash
echo "=============RESETTING DATABASE============="
npx supabase db reset --local

echo "Waiting for Supabase to be ready..."
until curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; do
  sleep 1
done
echo "Supabase is ready."

node --env-file=.env tests/seed/seed-dynamic.js

sleep 2

for file in ./supabase/storage/icons/*; do
  npx supabase storage cp --local --experimental "$file" ss:///icons/$(basename "$file")
done

echo "=============DATABASE RESET FINISHED============="
