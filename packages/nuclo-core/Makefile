.PHONY: publish release-patch release-minor release-major version show-version ensure-clean help

.DEFAULT_GOAL := help

# BUMP can be: patch | minor | major (default patch if not provided)
BUMP ?= patch

# Location of versioned manifest
PKG_FILE := package.json

# The docs site's generated version/bundle-size stats file, and the script
# that regenerates it from this package's package.json + dist output. Kept
# in sync with the version bump below so both land in the same commit.
DOCS_STATS_SCRIPT := ../../docs/scripts/update-doc-stats.ts
DOCS_STATS_FILE   := ../../docs/src/generated/nuclo-stats.ts

# Bump version locally without invoking npm workspace resolution.
bump-version:
	@node -e 'const fs = require("node:fs"); const pkgPath = process.argv[1]; const bump = process.argv[2]; const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")); const parts = pkg.version.split(".").map(Number); if (parts.length !== 3 || parts.some(Number.isNaN)) { console.error("Unsupported version format: " + pkg.version); process.exit(1); } if (bump === "patch") { parts[2] += 1; } else if (bump === "minor") { parts[1] += 1; parts[2] = 0; } else if (bump === "major") { parts[0] += 1; parts[1] = 0; parts[2] = 0; } else { console.error("Unsupported bump type: " + bump); process.exit(1); } pkg.version = parts.join("."); fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t") + "\n"); console.log(pkg.version);' "$(PKG_FILE)" "$(BUMP)"

# Helper: extract current version from package.json
version:
	@jq -r '.version' $(PKG_FILE)

show-version: version

# Optional safety: refuse to publish if there are unstaged tracked changes (excluding lock + package.json changes that will change anyway)
ensure-clean:
	@if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "Working tree not clean. Commit or stash changes before publishing."; \
		exit 1; \
	fi

# Main publish + tag workflow:
# 1. Build
# 2. Login to npm registry
# 3. Bump version (no auto tag/commit)
# 4. Refresh docs' generated version/bundle-size stats for the new version
# 5. Commit version bump + docs stats together
# 6. Publish to registry
# 7. Create annotated tag v<version> (skip if exists)
# 8. Push commit + tag
publish:
	@echo "==> Building (bun run build)"
	@bun run build
	@echo "==> Logging in to npm registry"
	@if ! npm login; then \
	  echo "ERROR: npm login failed. Cannot proceed with publish."; \
	  exit 1; \
	fi
	@echo "==> Bumping $(BUMP) version (local package.json update)"
	@new_version=$$($(MAKE) --no-print-directory bump-version BUMP=$(BUMP)); \
	  echo "==> New version: $$new_version"; \
	  echo "==> Refreshing docs stats (version + gzip size) for $$new_version"; \
	  bun $(DOCS_STATS_SCRIPT); \
	  echo "==> Staging version bump + docs stats artifacts"; \
	  git add $(PKG_FILE) $(DOCS_STATS_FILE); \
	  if git diff --cached --quiet; then \
	    echo "==> No staged changes to commit (possibly already committed)"; \
	  else \
	    git commit -m "chore(core): bump nuclo-core to $$new_version"; \
	  fi; \
	  echo "==> Publishing to registry"; \
	  bun publish --no-git-checks && \
	  echo "==> Creating tag (if missing)"; \
	  if git rev-parse -q --verify "refs/tags/v$$new_version" >/dev/null; then \
	    echo "Tag v$$new_version already exists - skipping"; \
	  else \
	    git tag -a "v$$new_version" -m "Release v$$new_version"; \
	    echo "Created tag v$$new_version"; \
	  fi; \
	  echo "==> Pushing commit + tag"; \
	  git push --follow-tags
	@echo "==> Done."

# Convenience targets
release-patch:
	@$(MAKE) publish BUMP=patch

release-minor:
	@$(MAKE) publish BUMP=minor

release-major:
	@$(MAKE) publish BUMP=major

# Usage help
help:
	@echo "Release / Publish targets:"
	@echo "  make publish            -> bump PATCH (default), publish, commit, tag, push"
	@echo "  make publish BUMP=minor -> bump MINOR"
	@echo "  make publish BUMP=major -> bump MAJOR"
	@echo "  make release-patch|minor|major"
	@echo ""
	@echo "Other:"
	@echo "  make version            -> show current version"
	@echo "  make help               -> this help"