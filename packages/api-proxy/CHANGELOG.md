# @tigojs/api-proxy changelog

## v0.2.1

- Fix: when `domain` is an object, the certs cannot be updated.

## v0.2.0

- Breaking change: if `domain` is `String`, this domain will be used to proxy all internal APIs and external APIs.

- Feat: option `domain` now can accept an object contains properties named `internal` and `external`.
