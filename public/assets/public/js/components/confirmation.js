/**
 * Custom Confirmation Dialog Box
 * @param {string} message - The confirmation message to display
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 * @param {object} options - Customization options
 */
function showConfirmationBox(message, onConfirm, onCancel, options = {}) {
    // Default options
    const {
        confirmText = 'Yes',
        cancelText = 'No',
        confirmColor = '#ef233c', // Red for destructive actions
        cancelColor = '#4361ee',  // Blue for cancel
        overlayColor = 'rgba(0,0,0,0.5)',
        animationDuration = 200
    } = options;

    // Create elements
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    const messageEl = document.createElement('p');
    const buttonContainer = document.createElement('div');
    const confirmBtn = document.createElement('button');
    const cancelBtn = document.createElement('button');

    // Styling
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = overlayColor;
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.opacity = '0';
    overlay.style.transition = `opacity ${animationDuration}ms ease`;

    dialog.style.backgroundColor = 'white';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    dialog.style.maxWidth = '90%';
    dialog.style.width = '400px';
    dialog.style.textAlign = 'center';

    messageEl.textContent = message;
    messageEl.style.marginBottom = '20px';
    messageEl.style.fontSize = '16px';

    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';

    confirmBtn.textContent = confirmText;
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.backgroundColor = confirmColor;
    confirmBtn.style.color = 'white';
    confirmBtn.style.cursor = 'pointer';

    cancelBtn.textContent = cancelText;
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.backgroundColor = cancelColor;
    cancelBtn.style.color = 'white';
    cancelBtn.style.cursor = 'pointer';

    // Build DOM structure
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);

    // Add to document
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Animate in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);

    // Cleanup function
    const cleanup = () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        }, animationDuration);
    };

    // Keyboard handler
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') handleCancel();
        if (e.key === 'Enter') handleConfirm();
    };

    // Return promise
    return new Promise((resolve) => {
        const handleConfirm = () => {
            cleanup();
            if (typeof onConfirm === 'function') onConfirm();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            if (typeof onCancel === 'function') onCancel();
            resolve(false);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        window.addEventListener('keydown', handleKeyDown);
    });
}
