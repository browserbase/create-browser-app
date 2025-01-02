#!/bin/bash

for pkg in lib/*-package.json; do
    cp $pkg package.json
    npx changeset
    pnpm run version
    pnpm run release
    rm package.json
done

cp lib/create-browser-app-package.json package.json
