include .env
export

.PHONY: publish

publish:
	cd packages/nuclo && $(MAKE) publish && \
	cd ../../docs-source && pnpm build
	rsync -avz --delete ./docs/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)

.PHONY: help

help:
	@echo "Available targets:"
	@echo "  publish  - Build docs-source and sync ./docs folder to remote server via rsync"
	@echo "  dev      - Start all dev servers in parallel (docs-source, examples/basic, packages/nuclo)"
	@echo ""
	@echo "Required environment variables:"
	@echo "  DEPLOY_USER  - SSH username"
	@echo "  DEPLOY_HOST  - SSH host"
	@echo "  DEPLOY_PATH  - Remote destination path"

.PHONY: dev install up

install:
	cd packages/nuclo && pnpm install && \
	cd ../../examples/basic && pnpm install && \
	cd ../../docs-source && pnpm install

up:
	cd packages/nuclo && pnpm up && \
	cd ../../examples/basic && pnpm up && \
	cd ../../docs-source && pnpm up

dev:
	@echo "Starting all dev servers in parallel..."
	@(cd packages/nuclo && pnpm dev) & \
	(cd examples/basic && pnpm dev) & \
	(cd docs-source && pnpm dev) & \
	wait