.PHONY: publish

publish:
	@echo "Publishing with pnpm..."
	# @echo "Stashing working directory (if needed)..."
	# @git diff --quiet && git diff --cached --quiet || git stash push -u -m "pre-publish" >/dev/null
	@pnpm build
	@echo "Bumping patch version..."
	@pnpm version patch --no-git-checks
	@pnpm publish --no-git-checks
	@echo "pushing to remote..."
	@git add ./package.json ./pnpm-lock.yaml
	@new_version=$$(jq -r .version package.json); git commit -m "chore: release v$${new_version}"
	@git push
	# @echo "Restoring stashed changes (if any)..."
	# @if git stash list | head -n1 | grep -q "pre-publish"; then git stash pop --index >/dev/null || true; fi
