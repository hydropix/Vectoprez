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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  h2 {
    margin: 0 0 12px 0;
    color: var(--color-text);
    font-size: 20px;
  }

  p {
    margin: 0 0 24px 0;
    color: var(--color-text);
    font-size: 14px;
    line-height: 1.5;
  }

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    padding: 8px 16px;
    cursor: pointer;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: var(--color-background);
    color: var(--color-text);
  }

  .cancel-btn:hover {
    background: var(--color-button-hover);
  }

  .confirm-btn {
    background: #e03131;
    color: white;
    border-color: #c92a2a;
  }

  .confirm-btn:hover {
    background: #c92a2a;
  }
</style>
