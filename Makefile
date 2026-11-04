.PHONY: help

# BUMP is forwarded to packages/nuclo-core's publish target (patch|minor|major).
BUMP ?= patch
# PUBLISH_BRANCH is forwarded to docs' publish target (Cloudflare Pages branch).
PUBLISH_BRANCH ?= main

help:
	@echo "Available targets:"
	@echo "  dev      - Start all dev servers in parallel (docs, examples/basic, packages/nuclo-core)"
	@echo "  install  - Install dependencies for all packages"
	@echo "  up       - Upgrade all dependencies to latest"
	@echo "  publish  - Bump+publish nuclo-core to npm, then refresh stats and deploy docs"
	@echo "             (make publish BUMP=minor, make publish PUBLISH_BRANCH=main)"

.PHONY: dev install up publish

publish:
	@echo "==> [1/2] Publishing packages/nuclo-core ($(BUMP))"
	$(MAKE) -C packages/nuclo-core publish BUMP=$(BUMP)
	@echo "==> [2/2] Refreshing stats and deploying docs"
	$(MAKE) -C docs publish PUBLISH_BRANCH=$(PUBLISH_BRANCH)
	@echo "==> Published nuclo-core and docs."

install:
	cd packages/nuclo-core && bun install && \
	cd ../../examples/basic && bun install && \
	cd ../../docs && bun install

# Bump every package.json in the repo (new untracked ones too, not node_modules)
# to the latest versions their peers allow, then refresh bun.lock.
# Per-package holds go in a .ncurc.yml next to that package.json.
up:
	bun install
	git ls-files -co --exclude-standard ':(glob)**/package.json' | xargs -n1 dirname | \
	while read -r dir; do \
		echo "==> $$dir"; \
		(cd "$$dir" && bunx npm-check-updates@23 -u --peer) || exit 1; \
	done
	bun install

dev:
	@echo "Starting all dev servers in parallel..."
	@(cd packages/nuclo-core && bun dev) & \
	(cd examples/basic && bun dev) & \
	(cd docs && bun dev) & \
	wait
