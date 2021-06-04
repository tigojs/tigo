# @tigojs/faas changelog

## v0.4.0

- Breaking change: API for lambda policies changed to `/faas/policy/set` and `/faas/policy/get`.

## v0.3.4

- Feat: add performence log support for the request event.

## v0.3.3

- Minor: upgrade `@tigojs/utils`.

## v0.3.2

- Feat: add `ownerCheck` to `app.tigo.faas`.

- Feat: all the results of `ownerCheck` will be cached.

- Fix: set lambda policy to the right key.

## v0.3.1

- Feat: add post install script.

- Fix: debugger doesn't encode the url before sending.

- Fix: cannot get value from lambda KV storage properly.

## v0.3.0

- Breaking change: using UUID string as lambda script ID (also the primary key in SQL database).

- Breaking change: removed `uid` in script model, now replaced with `scopeId`.

- Breaking change: lambda KV storage now must need a `mongodb database engine`.

- Breaking change: remove `@tigojs/oss-client` from lambda external modules whitelist.

- Feat: added support for `@tigojs/faas-log` (due to the breaking changes, the addon will not work with older version).

- Feat: added a method called `getName` to get lambda name by ID.

- Feat: added configurable lambda policy.

- Fix: the default `Content-Type` header will be `text/plain` by default when `body` in `respondWith` method is not an object.

- Fix: lambda KV storage key and cache key is not right.

- Fix: lambda's KV storage will be deleted when lambda is removed.

- Fix: service can read lambda kv config correctly now.

- Fix: lambda event emitter will remove all event listeners when it be diposed.

- Fix: unhandled promise rejection in lambda will be transformed into an error and be thrown to the outside.

- Fix: edit lambda environment will throw a cache related error.

- Minor: upgrade `@tigojs/utils`.
