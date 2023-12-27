#!/bin/sh

if [ -z "$CREDENTIALS_JSON" ]; then
  echo 'Error: CREDENTIALS_JSON is empty or not set.' >&2
  exit 1
fi
echo $CREDENTIALS_JSON > /root/.local/share/unisonlanguage/credentials.json

echo "CREDENTIALS_JSON written to /root/.local/share/unisonlanguage/credentials.json"
