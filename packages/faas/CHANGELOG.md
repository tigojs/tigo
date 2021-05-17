# @tigojs/faas changelog

## 0.3.0

- Breaking change: using UUID string as lambda script ID (also the primary key in SQL database).

- Breaking change: removed `uid` in script model, now replaced with `scopeId`.

- Breaking change: lambda KV storage now must need a `mongodb database engine`.

- Feat: added support for `@tigojs/faas-log` (due to the breaking changes, the addon will not work with older version).

- Feat: added a method called `getName` to get lambda name by ID.

- Feat: added configurable lambda policy.

- Fix: the default `Content-Type` header will be `text/plain` by default when `body` in `respondWith` method is not an object.

- Fix: lambda KV storage key and cache key is not right.

- Fix: lambda's KV storage will be deleted when lambda is removed.

- Fix: service can read lambda kv config correctly now.

- Fix: lambda event emitter will remove all event listeners when it be diposed.

- Fix: unhandled promise rejection in lambda will be transformed into an error and be thrown to the outside.

- Minor: upgrade `@tigojs/utils`.
