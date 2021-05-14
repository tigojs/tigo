# @tigojs/faas changelog

## 0.3.0

- Breaking change: using UUID string as lambda script ID (also the primary key in SQL database).

- Breaking change: removed `uid` in script model, now replaced with `scopeId`.

- Feat: added support for `@tigojs/faas-log` (due to the breaking changes, the addon will not work with older version).

- Minor: upgrade `@tigojs/utils`.
