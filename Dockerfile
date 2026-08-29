# Clay CLI runtime — mount page files and run without a local Bun install.
#
# For production deploys with pages baked in, see Dockerfile.compile (~163 MB,
# compiled binary) vs this dev-friendly CLI image (~200 MB, mount pages at run time).
# Build:
#   docker build -t clay .
#
# Single file:
#   docker run --rm -p 3000:3000 \
#     -v "$PWD/hello.ts:/app/hello.ts" \
#     clay hello.ts
#
# Page directory with app shell:
#   docker run --rm -p 3000:3000 \
#     -v "$PWD/pages:/app/pages" \
#     clay ./pages --app --title "My App"
#
# Dev with reload (restarts when mounted files change):
#   docker run --rm -p 3000:3000 \
#     -v "$PWD/pages:/app/pages" \
#     clay ./pages --app --reload
#
# Optional env: CLAY_PORT (default 3000), CLAY_TITLE, CLAY_APP=1

FROM oven/bun:1.2-alpine

WORKDIR /app

# Pre-install Clay so mounted .ts files can `import { ui } from '@close-by/clay'`
# without the user shipping node_modules or running bun install.
RUN printf '%s\n' '{"name":"clay-runtime","private":true,"type":"module"}' > package.json \
  && bun add --production @close-by/clay-cli@0.1.0 @close-by/clay@0.1.0 \
  && rm -rf /root/.bun/install/cache \
  && find node_modules -type f \( -name '*.md' -o -name 'LICENSE*' -o -name 'CHANGELOG*' \) -delete

ENV CLAY_PORT=3000

EXPOSE 3000

COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["."]
