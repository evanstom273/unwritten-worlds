# Unwritten Worlds

A browser-based voxel game prototype.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Deployment

Pushes to `main` automatically build and deploy the production Vite output to GitHub Pages through GitHub Actions (`.github/workflows/deploy.yml`).

### One-time GitHub repository setting

In the repository on GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.

### GitHub Pages base path

This project is configured for repository Pages at `https://<username>.github.io/unwritten-worlds/`. The Vite `base` path is defined once in `vite.config.ts` as `GITHUB_PAGES_BASE`. If the repository is renamed, update that constant to match the new repository name.
