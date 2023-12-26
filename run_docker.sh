#!/bin/bash

docker build -t deno-app . && docker run --env-file .env -it -p 8000:8000 deno-app
