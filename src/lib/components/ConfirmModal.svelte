<script lang="ts">
  export let isOpen = false;
  export let title = 'Confirmation';
  export let message = 'Are you sure?';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let onConfirm: () => void;
  export let onCancel: () => void;

  function handleConfirm() {
    onConfirm();
    isOpen = false;
  }

  function handleCancel() {
    onCancel();
    isOpen = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="modal-content">
      <h2>{title}</h2>
      <p>{message}</p>
      <div class="modal-buttons">
        <button class="cancel-btn" on:click={handleCancel}>{cancelText}</button>
        <button class="confirm-btn" on:click={handleConfirm}>{confirmText}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    max-width: 440px;
    width: 90%;
    box-shadow: var(--shadow-xl);
    backdrop-filter: blur(12px) saturate(1.2);
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Dark theme adjustments */
  [data-theme='dark'] .modal-content {
    background: rgba(45, 55, 72, 0.98);
  }

  h2 {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--color-text);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  p {
    margin: 0 0 var(--spacing-xl) 0;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.6;
  }

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
  }

  button {
    padding: 10px 20px;
    cursor: pointer;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  button:active {
    transform: translateY(0);
  }

  .cancel-btn {
    background: var(--color-surface);
    color: var(--color-text);
  }

  .cancel-btn:hover {
    background: var(--color-button-hover);
    border-color: var(--color-button-hover-border);
  }

  .confirm-btn {
    background: var(--color-danger);
    color: white;
    border-color: var(--color-danger);
  }

  .confirm-btn:hover {
    background: #c92a2a;
    border-color: #c92a2a;
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.15), var(--shadow-md);
  }
</style>
