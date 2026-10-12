.PHONY: publish version help

.DEFAULT_GOAL := help

# BUMP can be: patch | minor | major (default patch if not provided)
BUMP ?= patch

PKG_FILE := package.json

# Bump version locally without invoking npm workspace resolution.
bump-version:
	@node -e 'const fs = require("node:fs"); const [p, bump] = process.argv.slice(1); const pkg = JSON.parse(fs.readFileSync(p, "utf8")); const v = pkg.version.split(".").map(Number); const i = ["major", "minor", "patch"].indexOf(bump); if (v.length !== 3 || v.some(Number.isNaN) || i < 0) { console.error("Unsupported version/bump: " + pkg.version + " " + bump); process.exit(1); } v[i] += 1; v.fill(0, i + 1); pkg.version = v.join("."); fs.writeFileSync(p, JSON.stringify(pkg, null, "\t") + "\n"); console.log(pkg.version);' "$(PKG_FILE)" "$(BUMP)"

version:
	@jq -r '.version' $(PKG_FILE)

# The docs site's generated stats file and the markdown carrying bundle-size
# spans (router README included). Refreshed after the build so they land in the
# same commit as the version bump, as in nuclo-core.
DOCS_STATS_SCRIPT := ../../docs/scripts/update-doc-stats.ts
DOCS_STATS_FILE   := ../../docs/src/generated/nuclo-stats.ts
DOCS_STATS_MD     := ../../README.md ../nuclo-core/README.md README.md

# 1. Sync with remote (so the final push is a fast-forward)  2. Build (nuclo-core + nuclo-router)
# 3. Login to npm registry  4. Bump version (no auto tag/commit)  5. Refresh docs stats
# 6. Commit version bump + docs stats together  7. Publish to registry
# 8. Create annotated tag nuclo-router-v<version> (plain v* tags belong to nuclo-core; skip if exists)
# 9. Push commit + tag
publish:
	@echo "==> Syncing with remote"
	@git pull --rebase --autostash
	@echo "==> Building (nuclo-core + nuclo-router)"
	@bun run --cwd ../nuclo-core build
	@bun run build
	@echo "==> Logging in to npm registry"
	@if ! npm login; then \
	  echo "ERROR: npm login failed. Cannot proceed with publish."; \
	  exit 1; \
	fi
	@echo "==> Bumping $(BUMP) version (local package.json update)"
	@new_version=$$($(MAKE) --no-print-directory bump-version BUMP=$(BUMP)); \
	  echo "==> New version: $$new_version"; \
	  echo "==> Refreshing docs stats + markdown bundle sizes"; \
	  bun $(DOCS_STATS_SCRIPT); \
	  echo "==> Staging version bump + docs stats artifacts"; \
	  git add $(PKG_FILE) $(DOCS_STATS_FILE) $(DOCS_STATS_MD); \
	  if git diff --cached --quiet; then \
	    echo "==> No staged changes to commit (possibly already committed)"; \
	  else \
	    git commit -m "chore(router): bump nuclo-router to $$new_version"; \
	  fi; \
	  echo "==> Publishing to registry"; \
	  bun publish --no-git-checks && \
	  echo "==> Creating tag (if missing)"; \
	  if git rev-parse -q --verify "refs/tags/nuclo-router-v$$new_version" >/dev/null; then \
	    echo "Tag nuclo-router-v$$new_version already exists - skipping"; \
	  else \
	    git tag -a "nuclo-router-v$$new_version" -m "Release nuclo-router v$$new_version"; \
	    echo "Created tag nuclo-router-v$$new_version"; \
	  fi; \
	  echo "==> Pushing commit + tag"; \
	  git push --follow-tags
	@echo "==> Done."

help:
	@echo "  make publish            -> build, bump PATCH (default), publish, commit, tag, push"
	@echo "  make publish BUMP=minor -> bump MINOR (or major)"
	@echo "  make version            -> show current version"
