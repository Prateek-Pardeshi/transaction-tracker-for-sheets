#!/bin/sh

CONFIG=/usr/share/nginx/html/assets/config.json

sed -i "s|__GOOGLE_CLIENT_ID__|$GOOGLE_CLIENT_ID|g" $CONFIG
sed -i "s|__GOOGLE_CLIENT_SECRET__|$GOOGLE_CLIENT_SECRET|g" $CONFIG
sed -i "s|__GOOGLE_API_KEY__|$GOOGLE_API_KEY|g" $CONFIG

exec "$@"