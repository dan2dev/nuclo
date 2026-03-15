include .env
export

.PHONY: publish

publish:
	cd docs && pnpm build
	rsync -avz --delete ./docs/dist/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)
	curl -X POST "https://api.cloudflare.com/client/v4/zones/144262096047d02acb7bbb8d6914ca8c/purge_cache" \
		-H "Authorization: Bearer $(CLOUDFLARE_DUOCRAFT_CACHING_API_KEY)" \
		-H "Content-Type: application/json" \
		--data '{"purge_everything":true}'

.PHONY: help

help:
	@echo "Available targets:"
	@echo "  publish  - Build docs and sync ./docs folder to remote server via rsync"
	@echo "  dev      - Start all dev servers in parallel (docs, examples/basic, packages/v0.1)"
	@echo ""
	@echo "Required environment variables:"
	@echo "  DEPLOY_USER       - SSH username"
	@echo "  DEPLOY_HOST       - SSH host"
	@echo "  DEPLOY_PATH       - Remote destination path"
	@echo "  CLOUDFLARE_DUOCRAFT_CACHING_API_KEY - Cloudflare API token for cache purging"

.PHONY: dev install up

install:
	cd packages/v0.1 && pnpm install && \
	cd ../../examples/basic && pnpm install && \
	cd ../../docs && pnpm install

up:
	cd packages/v0.1 && pnpm up --latest && \
	cd ../../examples/basic && pnpm up --latest && \
	cd ../../docs && pnpm up --latest

dev:
	@echo "Starting all dev servers in parallel..."
	@(cd packages/v0.1 && pnpm dev) & \
	(cd examples/basic && pnpm dev) & \
	(cd docs && pnpm dev) & \
	wait
