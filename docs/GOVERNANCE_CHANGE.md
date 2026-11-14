# Protected contracts without constant human bottlenecks

The baseline files/agent rules/core utilities are checksummed. STATUS, HANDOFF, implementation plans, API research journals, scenario content and docs/refinements are mutable working state. Routine detail population consistent with the baseline goes there and does not require owner approval.

Material changes include lowering acceptance, removing sources/AI records, changing the challenge/audience, adding paid/public services, weakening review gates or permitting destructive Git. For these: append an ADR with the exact proposed diff and rationale, obtain explicit owner approval, independently review it, then have the owner or an expressly authorized helper regenerate protected-manifest.json and the installed .git/workflow-baseline.json together after verification. Do not let a builder silently refresh hashes to make a failing guard green. Keep the old/new hashes and approval evidence.

This is an accidental-change safeguard, not cryptographic proof of permission. No local script can distinguish an owner from an equally privileged agent merely because it writes a JSON approval file. Stronger controls require owner-managed remote policies. The kit intentionally does not supply an automatic unlock command that agents can use to approve their own governance changes.
