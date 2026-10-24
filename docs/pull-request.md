Odoo Smart Workspace connects each employee to Odoo 17 with their own identity, preserving ORM ACL/record rules, atomic revision checks and idempotent writes. The Vietnamese UI includes task/project navigation across projects, Chatter, Discuss, notifications and attachments, with isolated local Docker fixtures and automated validation.

UX2 adds optional normalized trigram search through the employee ORM, clear bounded-scan continuation, search filter/page restoration, Focus Mode, progressive child navigation, safe PDF/image preview, paginated notifications with batched target reads, and readable/searchable Discuss history. Missing addons or unsupported Odoo APIs retain explicit fallbacks.

Validation: new production standalone typecheck/build and 15 unit/30 real Odoo integration tests pass. Chromium functional/UI cases pass; reviewed UX2 visual references and final CI results are tracked in docs/validation.md. Includes 48 before/after browser-fixture screenshots and real local Odoo browser evidence, raw benchmarks at 100–10,000 tasks, known-local-secret scan and a three-employee study protocol.

Staging is blocked pending an authorized database and test identities. No enterprise data mutations, production deployment or user-study scores are claimed. See docs/ux2-report.md for implementation, limitations and acceptance instructions.
