SYSTEM_PATH := $(PATH)
-include ../.env
export

# Detect OS and arch for running the correct compiled server binary
_OS_RAW  := $(shell uname -s)
_ARCH_RAW := $(shell uname -m)

ifeq ($(_OS_RAW),Darwin)
  _OS := darwin
else
  _OS := linux
endif

ifeq ($(_ARCH_RAW),arm64)
  _ARCH := arm64
else ifeq ($(_ARCH_RAW),aarch64)
  _ARCH := arm64
else
  _ARCH := x64
endif

SERVER_BINARY := ./build/server-bun-$(_OS)-$(_ARCH)

.PHONY: help dev build run preview deps browser setup publish docker stress stress-ui stress-strict stress-heavy stress-soak stress-30min stress-server report clean

STRESS_ROUNDS ?= 12
STRESS_CLICKS_PER_PAGE ?= 14
STRESS_DEGRADE_THRESHOLD_PCT ?= 35
STRESS_LEAK_THRESHOLD_MB ?= 70
STRESS_BASE_URL ?= http://127.0.0.1:4173
STRESS_SERVER_HOST ?= http://localhost:5173
STRESS_SERVER_REQUESTS ?= 1000000
STRESS_SERVER_CONCURRENCY ?= 100

dev:
	BASE_URL=/ bun --tsconfig-override tsconfig.bun.json src/server.ts

build:
	bun run build

run:
	@echo "Running $(SERVER_BINARY)"
ifeq ($(_OS),darwin)
	@codesign --remove-signature $(SERVER_BINARY) 2>/dev/null || true
	@codesign --sign - --force $(SERVER_BINARY)
endif
	$(SERVER_BINARY)

preview: build run

help:
	@echo "Available targets:"
	@echo "  publish    - Build docs and sync full ./build folder (SSR server + dist assets) via rsync"
	@echo "  docker     - Build docs and start via Docker Compose"
	@echo "  stress     - Run standard front stress"
	@echo ""
	@echo "Required environment variables (loaded from ../.env):"
	@echo "  DEPLOY_USER       - SSH username"
	@echo "  DEPLOY_HOST       - SSH host"
	@echo "  DEPLOY_PATH       - Remote destination path"
	@echo "  CLOUDFLARE_DUOCRAFT_CACHING_API_KEY - Cloudflare API token for cache purging"
	@echo ""
	@echo "Docs front stress (Playwright)"
	@echo ""
	@echo "Targets:"
	@echo "  make setup         - Install deps + Chromium browser"
	@echo "  make stress        - Run standard front stress"
	@echo "  make stress-ui     - Run stress with visible browser window"
	@echo "  make stress-strict - Run stress with strict thresholds"
	@echo "  make stress-heavy  - Run heavier stress (40 rounds, 30 clicks/page)"
	@echo "  make stress-soak   - Long soak (80 rounds, 40 clicks/page)"
	@echo "  make stress-30min  - Soak for exactly 30 minutes"
	@echo "  make stress-server - HTTP server stress (1 M requests, random routes)"
	@echo "  make report        - Open Playwright HTML report"
	@echo "  make clean         - Remove test artifacts"
	@echo ""
	@echo "Override defaults (example):"
	@echo "  make stress STRESS_ROUNDS=50 STRESS_CLICKS_PER_PAGE=30"

publish:
	bun run build
	rsync -avz --delete ./build/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)
	ssh $(DEPLOY_USER)@$(DEPLOY_HOST) /home/sites/reboot.sh
	curl -X POST "https://api.cloudflare.com/client/v4/zones/144262096047d02acb7bbb8d6914ca8c/purge_cache" \
		-H "Authorization: Bearer $(CLOUDFLARE_DUOCRAFT_CACHING_API_KEY)" \
		-H "Content-Type: application/json" \
		--data '{"purge_everything":true}'

docker:
	bun run build
	env PATH="$(SYSTEM_PATH)" podman compose up --build

deps:
	bun install

browser:
	bunx playwright install chromium

setup: deps browser

stress:
	STRESS_ROUNDS=$(STRESS_ROUNDS) \
	STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) \
	STRESS_BASE_URL=$(STRESS_BASE_URL) \
	bun run stress:front

stress-ui:
	STRESS_ROUNDS=$(STRESS_ROUNDS) \
	STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) \
	STRESS_BASE_URL=$(STRESS_BASE_URL) \
	bun run stress:front:ui

stress-strict:
	STRESS_STRICT=true \
	STRESS_ROUNDS=$(STRESS_ROUNDS) \
	STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) \
	STRESS_DEGRADE_THRESHOLD_PCT=$(STRESS_DEGRADE_THRESHOLD_PCT) \
	STRESS_LEAK_THRESHOLD_MB=$(STRESS_LEAK_THRESHOLD_MB) \
	STRESS_BASE_URL=$(STRESS_BASE_URL) \
	bun run stress:front:strict

stress-heavy:
	STRESS_ROUNDS=40 STRESS_CLICKS_PER_PAGE=30 bun run stress:front

stress-soak:
	STRESS_ROUNDS=80 STRESS_CLICKS_PER_PAGE=40 bun run stress:front

stress-30min:
	STRESS_DURATION_MS=1800000 STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) STRESS_BASE_URL=$(STRESS_BASE_URL) bun run stress:front:ui

stress-20min:
	STRESS_DURATION_MS=1200000 STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) STRESS_BASE_URL=$(STRESS_BASE_URL) bun run stress:front:ui

stress-10min:
	STRESS_DURATION_MS=600000 STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) STRESS_BASE_URL=$(STRESS_BASE_URL) bun run stress:front:ui

stress-server:
	HOST=$(STRESS_SERVER_HOST) \
	TOTAL_REQUESTS=$(STRESS_SERVER_REQUESTS) \
	CONCURRENCY=$(STRESS_SERVER_CONCURRENCY) \
	bun run stress:server

report:
	bunx playwright show-report playwright-report/stress

clean:
	rm -rf playwright-report test-results
