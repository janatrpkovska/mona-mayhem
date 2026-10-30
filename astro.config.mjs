// @ts-check
import process from 'node:process';
import { defineConfig, passthroughImageService } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Vercel sets VERCEL=1 during its builds; everywhere else keep the Node standalone server.
export default defineConfig({
	output: 'server',
	// The app has no optimized images; never decode untrusted images with Sharp.
	image: {
		service: passthroughImageService(),
	},
	adapter: process.env.VERCEL
		? vercel()
		: node({
			mode: 'standalone',
		}),
});
