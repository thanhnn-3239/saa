---
description: Deploy projects with platform auto-detection
argument-hint: [platform or environment]
---

Activate the `deploy` skill.

<target>$ARGUMENTS</target>

Detection priority:
1. Explicit platform in args
2. Project framework (Next.js → Vercel, Workers → Cloudflare, etc.)
3. Existing deploy config (wrangler.toml, vercel.json, Dockerfile, k8s/)

Confirm destination before production deploys.
