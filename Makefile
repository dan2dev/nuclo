.PHONY: help

help:
	@echo "Available targets:"
	@echo "  dev      - Start all dev servers in parallel (docs, examples/basic, packages/nuclo-core)"
	@echo "  install  - Install dependencies for all packages"
	@echo "  up       - Upgrade all dependencies to latest"
	@echo ""
	@echo "To publish docs, run: make publish from the docs/ directory"

.PHONY: dev install up

install:
	cd packages/nuclo-core && bun install && \
	cd ../../examples/basic && bun install && \
	cd ../../docs && bun install

up:
	cd packages/nuclo-core && bun update --latest && \
	cd ../../examples/basic && bun update --latest && \
	cd ../../docs && bun update --latest

dev:
	@echo "Starting all dev servers in parallel..."
	@(cd packages/nuclo-core && bun dev) & \
	(cd examples/basic && bun dev) & \
	(cd docs && bun dev) & \
	wait
