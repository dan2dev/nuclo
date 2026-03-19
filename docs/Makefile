.PHONY: help deps browser setup stress stress-ui stress-strict stress-heavy stress-soak stress-30min report clean

STRESS_ROUNDS ?= 12
STRESS_CLICKS_PER_PAGE ?= 14
STRESS_DEGRADE_THRESHOLD_PCT ?= 35
STRESS_LEAK_THRESHOLD_MB ?= 70
STRESS_BASE_URL ?= http://127.0.0.1:4173

help:
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
