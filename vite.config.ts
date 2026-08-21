import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves from https://<user>.github.io/<repo>/
// Update this value if the repository is renamed.
const GITHUB_PAGES_BASE = '/unwritten-worlds/';

export default defineConfig({
	base: GITHUB_PAGES_BASE,
	plugins: [react()],
});
