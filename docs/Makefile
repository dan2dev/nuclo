SYSTEM_PATH := $(PATH)
include ../.env
export

.PHONY: help deps browser setup publish docker stress stress-ui stress-strict stress-heavy stress-soak stress-30min report clean

STRESS_ROUNDS ?= 12
STRESS_CLICKS_PER_PAGE ?= 14
STRESS_DEGRADE_THRESHOLD_PCT ?= 35
STRESS_LEAK_THRESHOLD_MB ?= 70
STRESS_BASE_URL ?= http://127.0.0.1:4173

help:
	@echo "Available targets:"
	@echo "  publish    - Build docs and sync ./dist folder to remote server via rsync"
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
	@echo "  make report        - Open Playwright HTML report"
	@echo "  make clean         - Remove test artifacts"
	@echo ""
	@echo "Override defaults (example):"
	@echo "  make stress STRESS_ROUNDS=50 STRESS_CLICKS_PER_PAGE=30"

publish:
	pnpm build
	rsync -avz --delete ./dist/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)
	curl -X POST "https://api.cloudflare.com/client/v4/zones/144262096047d02acb7bbb8d6914ca8c/purge_cache" \
		-H "Authorization: Bearer $(CLOUDFLARE_DUOCRAFT_CACHING_API_KEY)" \
		-H "Content-Type: application/json" \
		--data '{"purge_everything":true}'

docker:
	pnpm build
	env PATH="$(SYSTEM_PATH)" podman compose up --build

deps:
	pnpm install --ignore-workspace

browser:
	pnpm exec playwright install chromium

setup: deps browser

stress:
	STRESS_ROUNDS=$(STRESS_ROUNDS) \
	STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) \
	STRESS_BASE_URL=$(STRESS_BASE_URL) \
	pnpm stress:front

stress-ui:
	STRESS_ROUNDS=$(STRESS_ROUNDS) \
	STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) \
	STRESS_BASE_URL=$(STRESS_BASE_URL) \
	pnpm stress:front:ui

stress-strict:
	STRESS_STRICT=true \
	STRESS_ROUNDS=$(STRESS_ROUNDS) \
	STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) \
	STRESS_DEGRADE_THRESHOLD_PCT=$(STRESS_DEGRADE_THRESHOLD_PCT) \
	STRESS_LEAK_THRESHOLD_MB=$(STRESS_LEAK_THRESHOLD_MB) \
	STRESS_BASE_URL=$(STRESS_BASE_URL) \
	pnpm stress:front:strict

stress-heavy:
	STRESS_ROUNDS=40 STRESS_CLICKS_PER_PAGE=30 pnpm stress:front

stress-soak:
	STRESS_ROUNDS=80 STRESS_CLICKS_PER_PAGE=40 pnpm stress:front

stress-30min:
	STRESS_DURATION_MS=1800000 STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) STRESS_BASE_URL=$(STRESS_BASE_URL) pnpm stress:front:ui

stress-20min:
	STRESS_DURATION_MS=1200000 STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) STRESS_BASE_URL=$(STRESS_BASE_URL) pnpm stress:front:ui

stress-10min:
	STRESS_DURATION_MS=600000 STRESS_CLICKS_PER_PAGE=$(STRESS_CLICKS_PER_PAGE) STRESS_BASE_URL=$(STRESS_BASE_URL) pnpm stress:front:ui

report:
	pnpm exec playwright show-report playwright-report/stress

clean:
	rm -rf playwright-report test-results
