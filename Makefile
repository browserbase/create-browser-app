release:
	@for pkg in *-package.json; do \
		cp $$pkg package.json && \
		npx changeset && \
		pnpm run version && \
		pnpm run release && \
		rm package.json; \
	done