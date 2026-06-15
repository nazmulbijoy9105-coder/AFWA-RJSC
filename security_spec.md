# Security Specification and Threat Intelligence Spec - Firestore Access Controls

## 1. Data Invariants

1. **User Identity Isolation**: A user's profile can only be created or written to by the authenticated user themselves. Accessing another user's PII is strictly block-gated.
2. **Access-to-Read Enforcements**: Only authenticated users are allowed to interact with corporate compliance records (companies, audit histories, bypassed lists).
3. **Immutability of Key Audit Properties**: Audit trails once written are read-only (immutable).
4. **Role Integrity Guard**: Users are forbidden from altering or upgrading their own RBAC roles (`role` field must not be self-promoted). Only active authenticated users with the 'admin' role can modify global roles, or admins can define them.
5. **No Spoofing**: The `username` or `uid` of any outgoing audit-log must match the authenticated user's email or UID. 

---

## 2. The "Dirty Dozen" Threat Payloads

Here are twelve highly targeted JSON payloads designed to attempt privilege escalation or data corruption:

### Attack Vector Group A: Identity & Self-Promotion
1. **Self-Elevating Admin Profile Creation**: Creating a profile in `/users/attacker123` with `"role": "admin"` to gain instant master credentials.
2. **Post-Reg Upgrade Hack**: Modifying an existing user document at `/users/regularUid` to change `role` from `"spectator"` to `"admin"`.
3. **Spoofed Audit Author**: Submitting an audit trail onto `/auditTrails/trial001` with `username` set to `"admin@dhakallp.com"` when the authenticated user is actually `"attacker@gmail.com"`.

### Attack Vector Group B: Rule Circumvention & Data Alteration
4. **Unauthenticated Read Attempt (Denial of Privacy)**: Attempting to query `companies` without an authentication token.
5. **Malicious Company Hijack (Override ID)**: Modifying a `company` to re-assign its primary `id` or `regNumber` to a custom attacker-made string.
6. **Poisoned Audit Severity**: Submitting an `AuditTrailEntry` with a non-existent action `"super_bypassed"` or payload size greater than limits.

### Attack Vector Group C: Orphaned State Modifications
7. **Phantom Override Creation**: Writing a bypassed rule entry to `/bypassedRules/COM-99` for a company that does not exist in the database.
8. **Malicious Audit Eviction**: Deleting the immutable audit trails without admin authorization to conceal high-risk breaches.

---

## 3. Threat Verification Test Suite Draft (Simulation Model)

```typescript
// Test suite outline for firestore.rules testing
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// High-fidelity validation tests verifying permission blocks return PERMISSION_DENIED
// for malicious payloads that violate the above threat payloads.
```
