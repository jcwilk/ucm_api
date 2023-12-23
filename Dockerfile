FROM denoland/deno:latest

ENV UCM_VERSION=0.5.12

EXPOSE 8000

WORKDIR /app

ADD https://github.com/unisonweb/unison/releases/download/release%2F${UCM_VERSION}/ucm-linux.tar.gz ./ucm-linux.tar.gz
RUN mkdir -p ./bin
RUN tar -xzf ucm-linux.tar.gz -C ./bin \
    && rm ucm-linux.tar.gz

COPY deps.ts .
RUN deno cache deps.ts

COPY . .

RUN deno cache server.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-run", "server.ts"]
