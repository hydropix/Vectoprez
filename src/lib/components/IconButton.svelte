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
		background: var(--color-background);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		transition: all 0.15s ease;
		padding: 0;
		position: relative;
	}

	.icon-button:hover:not(:disabled) {
		background: var(--color-button-hover);
		border-color: var(--color-button-hover-border);
	}

	.icon-button:active:not(:disabled) {
		transform: translateY(1px);
	}

	.icon-button.active {
		background: var(--color-button-active);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.icon-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-button.danger {
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.icon-button.danger:hover:not(:disabled) {
		background: var(--color-danger-bg);
		border-color: var(--color-danger);
	}

	/* Sizes */
	.icon-button.small {
		width: 28px;
		height: 28px;
	}

	.icon-button.medium {
		width: 36px;
		height: 36px;
	}

	.icon-button.large {
		width: 44px;
		height: 44px;
	}

	/* SVG styling */
	.icon-button :global(svg) {
		display: block;
		flex-shrink: 0;
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
