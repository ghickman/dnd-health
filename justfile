# list available commands
default:
    @{{ just_executable() }} --list

# upgrade dev or prod dependencies (specify package to upgrade single package, all by default)
upgrade env package="":
    #!/usr/bin/env bash
    opts="--upgrade"
    test -z "{{ package }}" || opts="--upgrade-package {{ package }}"
    uv add $opts

test *args:
    echo "Not implemented yet"

black *args=".":
    uv run black --check {{ args }}

ruff *args=".":
    uv run ruff check {{ args }}

toml-sort *args:
    uv run toml-sort {{ args }} pyproject.toml

check: black ruff
    {{ just_executable() }} toml-sort --check

# fix formatting and import sort ordering
fix:
    uv run black .
    uv run ruff check --fix .
    {{ just_executable() }} toml-sort --in-place
    just --fmt --unstable --justfile justfile

# Run the dev project
run *args:
    uv run -m health {{ args }}
