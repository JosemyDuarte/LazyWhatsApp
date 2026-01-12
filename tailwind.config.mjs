/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				bg: 'var(--color-bg)',
				'bg-alt': 'var(--color-bg-alt)',
				card: 'var(--color-card)',
				'card-border': 'var(--color-card-border)',
				text: 'var(--color-text)',
				'text-muted': 'var(--color-text-muted)',
				primary: 'var(--color-primary)',
				'primary-hover': 'var(--color-primary-hover)',
				accent: 'var(--color-accent)',
				success: 'var(--color-success)',
				error: 'var(--color-error)',
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
			},
			fontFamily: {
				sans: 'var(--font-sans)',
			},
			transitionTimingFunction: {
				bounce: 'var(--transition-bounce)',
			}
		},
	},
	plugins: [],
}
