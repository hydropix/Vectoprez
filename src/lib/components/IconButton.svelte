<script lang="ts">
	import { icons, type IconName } from '$lib/utils/icons';

	export let icon: IconName;
	export let title: string = '';
	export let active: boolean = false;
	export let disabled: boolean = false;
	export let variant: 'default' | 'danger' = 'default';
	export let size: 'small' | 'medium' | 'large' = 'medium';
</script>

<button
	class="icon-button"
	class:active
	class:disabled
	class:danger={variant === 'danger'}
	class:small={size === 'small'}
	class:medium={size === 'medium'}
	class:large={size === 'large'}
	{title}
	{disabled}
	on:click
>
	{@html icons[icon]}
</button>

<style>
	.icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		background: var(--color-surface);
		color: var(--color-text);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-full);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 0;
		position: relative;
		box-shadow: var(--shadow-sm);
		backdrop-filter: blur(8px);
	}

	.icon-button:hover:not(:disabled) {
		background: var(--color-button-hover);
		border-color: var(--color-button-hover-border);
		transform: translateY(-2px) scale(1.05);
		box-shadow: var(--shadow-md);
	}

	.icon-button:active:not(:disabled) {
		transform: translateY(0) scale(0.98);
		box-shadow: var(--shadow-sm);
		transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.icon-button.active {
		background: var(--color-button-active);
		border-color: var(--color-accent);
		color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), var(--shadow-sm);
	}

	.icon-button.active:hover:not(:disabled) {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), var(--shadow-md);
	}

	.icon-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.icon-button.danger {
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.icon-button.danger:hover:not(:disabled) {
		background: var(--color-danger-bg);
		border-color: var(--color-danger);
		box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1), var(--shadow-md);
	}

	/* Sizes */
	.icon-button.small {
		width: 32px;
		height: 32px;
	}

	.icon-button.medium {
		width: 42px;
		height: 42px;
	}

	.icon-button.large {
		width: 52px;
		height: 52px;
	}

	/* SVG styling */
	.icon-button :global(svg) {
		display: block;
		flex-shrink: 0;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.icon-button:hover:not(:disabled) :global(svg) {
		transform: scale(1.1);
	}

	.icon-button.small :global(svg) {
		width: 16px;
		height: 16px;
	}

	.icon-button.medium :global(svg) {
		width: 20px;
		height: 20px;
	}

	.icon-button.large :global(svg) {
		width: 24px;
		height: 24px;
	}
</style>
