.PHONY: publish release-patch release-minor release-major version show-version ensure-clean

# BUMP can be: patch | minor | major (default patch if not provided)
BUMP ?= patch

# Location of versioned manifest
PKG_FILE := package.json

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
# 2. Bump version (no auto tag/commit)
# 3. Publish to registry
# 4. Commit version bump
# 5. Create annotated tag v<version> (skip if exists)
# 6. Push commit + tag
publish: 
	@echo "==> Building (pnpm build)"
	@pnpm build
	@echo "==> Bumping $(BUMP) version (no git tag/commit by pnpm)"
	@pnpm version $(BUMP) --no-git-tag-version --no-git-checks
	@new_version=$$(jq -r .version $(PKG_FILE)); \
	  echo "==> New version: $$new_version"; \
	  echo "==> Publishing to registry"; \
	  pnpm publish --no-git-checks; \
	  echo "==> Staging version bump artifacts"; \
	  git add $(PKG_FILE) pnpm-lock.yaml 2>/dev/null || true; \
	  if git diff --cached --quiet; then \
	    echo "==> No staged changes to commit (possibly already committed)"; \
	  else \
	    git commit -m "chore: release v$$new_version"; \
	  fi; \
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
	@echo "  make release-patch|minior|major"
	@echo ""
	@echo "Other:"
	@echo "  make version            -> show current version"
	@echo "  make help               -> this help"