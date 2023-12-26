FROM denoland/deno:latest

ARG UCM_VERSION=0.5.12
ENV CREDENTIALS_JSON=""
ENV MASTER_API_KEY=""

EXPOSE 8000

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Download and set up Unison Codebase Manager
ADD https://github.com/unisonweb/unison/releases/download/release%2F${UCM_VERSION}/ucm-linux.tar.gz ./ucm-linux.tar.gz
RUN mkdir -p ./bin && \
    tar -xzf ucm-linux.tar.gz -C ./bin && \
    rm ucm-linux.tar.gz

RUN mkdir -p ./templates

RUN mkdir -p /root/.local/share/unisonlanguage

# Copy and cache dependencies
COPY src/deps/ ./src/deps/
COPY src/deps.ts ./src/
RUN deno cache src/deps.ts

# Copy the rest of the application files
COPY src/ ./src/

# Cache the main module file
RUN deno cache src/mod.ts

# Copy the credential writing script
COPY scripts/write_credentials.sh /root/write_credentials.sh
RUN chmod +x /root/write_credentials.sh

# Run the application
CMD ["/bin/sh", "-c", "/root/write_credentials.sh && deno run --allow-net --allow-env --allow-read --allow-write --allow-run src/mod.ts"]
