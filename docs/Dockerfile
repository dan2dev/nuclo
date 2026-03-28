FROM oven/bun:latest

WORKDIR /app/docs

COPY docs/tsconfig.bun.json ./
COPY docs/src/ ./src/
COPY docs/dist/ ./dist/
COPY packages/v0.1/src/ ../packages/v0.1/src/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "--tsconfig-override", "tsconfig.bun.json", "src/server.ts"]
