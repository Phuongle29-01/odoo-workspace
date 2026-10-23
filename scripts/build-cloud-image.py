"""Reuse npm's integrity-checked public package cache when BuildKit DNS is isolated."""
from pathlib import Path
import os
import subprocess

root = Path(__file__).resolve().parents[1]
cache = Path(os.environ.get('npm_config_cache', '/workspace/.cache/npm')) / '_cacache'
if not cache.is_dir():
    raise SystemExit('Run npm ci with a writable npm cache before building offline.')
recipe = (root / 'Dockerfile').read_text()
start = recipe.index('RUN --mount=type=secret,id=build_ca')
end = recipe.index('FROM deps AS build', start)
recipe = (recipe[:start]
          + 'RUN --mount=type=bind,from=npmcache,target=/npm-cache/_cacache '
          + 'npm ci --offline --no-audit --cache=/npm-cache\n' + recipe[end:])
local = root / '.local'
local.mkdir(exist_ok=True)
target = local / 'Dockerfile.cloud'
target.write_text(recipe)
build_env = dict(os.environ, DOCKER_CONFIG='/workspace/.cache/docker')
subprocess.run(['docker', 'build', '--build-context', f'npmcache={cache}',
                '-f', str(target), '-t', 'smart-workspace:local', '.'],
               cwd=root, env=build_env, check=True)
