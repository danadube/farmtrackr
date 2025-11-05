# Vercel Deployment Configuration

## Root Directory Setup

The FarmTrackr repository structure:
```
FarmTrackr-old/                    # Repository root
├── .vercelignore                  # Ignores everything except farmtrackr-web
├── farmtrackr-web/                # Next.js application (Root Directory)
│   ├── package.json
│   ├── vercel.json
│   ├── src/
│   └── ...
└── archive/                       # Archived files
```

## Vercel Project Settings

**Root Directory:** Must be set to `farmtrackr-web`

### How to Update in Vercel Dashboard:

1. Go to your Vercel project settings
2. Navigate to **Settings** → **General**
3. Under **Root Directory**, ensure it's set to: `farmtrackr-web`
4. Save the changes
5. Trigger a new deployment

## Configuration Files

- **`.vercelignore`** (repository root): Ignores everything except `farmtrackr-web/`
- **`vercel.json`** (in `farmtrackr-web/`): Next.js configuration

## Troubleshooting

If you see the error: *"The specified Root Directory 'farmtrackr-web' does not exist"*

1. Verify the repository structure matches the above
2. Check Vercel project settings → Root Directory is set to `farmtrackr-web`
3. Ensure `.vercelignore` is correctly configured
4. Try redeploying after updating settings

---

*Last Updated: November 3, 2025*

