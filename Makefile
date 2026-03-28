.PHONY: help

help:
	@echo "Available targets:"
	@echo "  dev      - Start all dev servers in parallel (docs, examples/basic, packages/v0.1)"
	@echo "  install  - Install dependencies for all packages"
	@echo "  up       - Upgrade all dependencies to latest"
	@echo ""
	@echo "To publish docs, run: make publish from the docs/ directory"

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
