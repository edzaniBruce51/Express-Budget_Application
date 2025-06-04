// Budget Tracker - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });

  // Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
  alerts.forEach(function(alert) {
    setTimeout(function() {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });

  // Confirm delete actions
  const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
  deleteButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      const message = this.getAttribute('data-confirm-delete') || 'Are you sure you want to delete this item?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });

  // Format currency inputs
  const currencyInputs = document.querySelectorAll('input[type="number"][step="0.01"]');
  currencyInputs.forEach(function(input) {
    input.addEventListener('blur', function() {
      if (this.value) {
        this.value = parseFloat(this.value).toFixed(2);
      }
    });
  });

  // Auto-resize textareas
  const textareas = document.querySelectorAll('textarea[data-auto-resize]');
  textareas.forEach(function(textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  });

  // Form validation enhancement
  const forms = document.querySelectorAll('.needs-validation');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Color picker for category colors
  const colorInputs = document.querySelectorAll('input[type="color"]');
  colorInputs.forEach(function(input) {
    // Set random color if empty
    if (!input.value) {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
      input.value = colors[Math.floor(Math.random() * colors.length)];
    }
  });

  // Search functionality
  const searchInputs = document.querySelectorAll('[data-search]');
  searchInputs.forEach(function(input) {
    const targetSelector = input.getAttribute('data-search');
    const targets = document.querySelectorAll(targetSelector);
    
    input.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      
      targets.forEach(function(target) {
        const text = target.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          target.style.display = '';
        } else {
          target.style.display = 'none';
        }
      });
    });
  });

  // Loading states for forms
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  submitButtons.forEach(function(button) {
    const form = button.closest('form');
    if (form) {
      form.addEventListener('submit', function() {
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        
        // Re-enable after 5 seconds as fallback
        setTimeout(function() {
          button.disabled = false;
          button.innerHTML = originalText;
        }, 5000);
      });
    }
  });
});

// Utility functions
window.BudgetTracker = {
  // Format currency
  formatCurrency: function(amount) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  },

  // Format date
  formatDate: function(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  },

  // Show toast notification
  showToast: function(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
    const toast = this.createToast(message, type);
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  },

  // Create toast container
  createToastContainer: function() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
  },

  // Create toast element
  createToast: function(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    
    const iconMap = {
      success: 'check-circle-fill',
      error: 'exclamation-triangle-fill',
      warning: 'exclamation-triangle-fill',
      info: 'info-circle-fill'
    };
    
    const colorMap = {
      success: 'text-success',
      error: 'text-danger',
      warning: 'text-warning',
      info: 'text-primary'
    };
    
    toast.innerHTML = `
      <div class="toast-header">
        <i class="bi bi-${iconMap[type]} ${colorMap[type]} me-2"></i>
        <strong class="me-auto">Budget Tracker</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    return toast;
  }
};
