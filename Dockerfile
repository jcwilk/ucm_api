FROM denoland/deno:latest

ENV UCM_VERSION=0.5.12

EXPOSE 8000

WORKDIR /app

# Download and set up Unison Codebase Manager
ADD https://github.com/unisonweb/unison/releases/download/release%2F${UCM_VERSION}/ucm-linux.tar.gz ./ucm-linux.tar.gz
RUN mkdir -p ./bin && \
    tar -xzf ucm-linux.tar.gz -C ./bin && \
    rm ucm-linux.tar.gz

# Copy and cache dependencies
COPY src/deps.ts ./src/
RUN deno cache src/deps.ts

# Copy the rest of the application files
COPY src/ ./src/

# Cache the main module file
RUN deno cache src/mod.ts

# Run the application
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-run", "src/mod.ts"]
