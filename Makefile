release:
	@for pkg in *-package.json; do \
		cp $$pkg package.json && \
		npx changeset && \
		pnpm run version && \
		pnpm run release && \
		rm package.json; \
	done

run:
	cp create-browser-app-package.json package.json && \
	pnpm run start
	rm package.json