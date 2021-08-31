# Changelog

## v0.6.3

- Minor: upgrade dependencies.

## v0.6.2

- Feat: add `queryTransformer` middleware to parse numbers in `ctx.query`.

- Fix: framework middlewares will be loaded before router now.

## v0.6.1

- Minor: upgrade dependencies.

## v0.6.0

- Feat: add an `EventEmitter` named `events` to `App` class, can emit an event named `inited` after the server was initailized.

- Minor: upgrade `@tigojs/utils`.

- Minor: fix up the migrate script.
