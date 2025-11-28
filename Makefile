include .env
export

.PHONY: publish

publish:
	cd docs-source && pnpm build
	rsync -avz --delete ./docs/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)

.PHONY: help

help:
	@echo "Available targets:"
	@echo "  publish  - Build docs-source and sync ./docs folder to remote server via rsync"
	@echo ""
	@echo "Required environment variables:"
	@echo "  DEPLOY_USER  - SSH username"
	@echo "  DEPLOY_HOST  - SSH host"
	@echo "  DEPLOY_PATH  - Remote destination path"
