#!/usr/bin/env sh
yarn export
cd out
touch .nojekyll
echo 'neoburger.io' >CNAME
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:neoburger/web.git master:gh-pages