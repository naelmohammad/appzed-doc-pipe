# AppZed Doc Pipe Agent

PUT documents to R2, get Workers AI summaries with metadata in D1. Schema self-initializes.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/naelmohammad/appzed-doc-pipe)

Click **Deploy to Cloudflare**: it clones this repo to your GitHub account, provisions the bindings below on your Cloudflare account, and wires CI/CD with preview URLs on every PR.

## Bindings (auto-provisioned)

```jsonc
{
  "name": "appzed-doc-pipe",
  "ai": {
    "binding": "AI"
  },
  "r2_buckets": [
    {
      "binding": "DOCS",
      "bucket_name": "appzed-doc-pipe-docs"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "appzed-doc-pipe-meta"
    }
  ]
}
```

## Try it

```bash
curl -X PUT https://<your-worker>.workers.dev/docs/invoice-1 --data-binary @invoice.txt
```

GET /health for a liveness check. Managed by AppZed (https://dev.appzed.com/solutions/doc-pipe).
