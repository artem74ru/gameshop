<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="modal-overlay" @click.self="close">
        <div class="modal-content" :class="modalTypeClass">
          <div class="modal-icon">
            <span v-if="type === 'success'" class="icon-success">✓</span>
            <span v-else-if="type === 'error'" class="icon-error">✕</span>
            <span v-else-if="type === 'info'" class="icon-info">ℹ</span>
            <span v-else class="icon-warning">⚠</span>
          </div>
          <h3 class="modal-title">{{ title }}</h3>
          <p v-if="message" class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button v-if="showCancel" class="btn btn-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="btn btn-confirm" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  type?: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  autoClose?: boolean
  autoCloseDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Отмена',
  showCancel: false,
  autoClose: false,
  autoCloseDelay: 3000
})

const emit = defineEmits<{
  close: []
  confirm: []
  cancel: []
}>()

const modalTypeClass = computed(() => `modal-${props.type}`)

let autoCloseTimer: NodeJS.Timeout | null = null

watch(() => props.isVisible, (visible) => {
  if (visible && props.autoClose) {
    autoCloseTimer = setTimeout(() => {
      close()
    }, props.autoCloseDelay)
  } else if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
})

onUnmounted(() => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
  }
})

const close = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  text-align: center;
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
  font-weight: bold;
}

.modal-success .modal-icon {
  background: #e8f5e9;
  color: #4caf50;
}

.modal-error .modal-icon {
  background: #ffebee;
  color: #f44336;
}

.modal-info .modal-icon {
  background: #e3f2fd;
  color: #2196f3;
}

.modal-warning .modal-icon {
  background: #fff3e0;
  color: #ff9800;
}

.icon-success,
.icon-error,
.icon-info,
.icon-warning {
  display: block;
  line-height: 1;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #000;
}

.modal-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  min-width: 120px;
}

.btn-confirm {
  background: #1976d2;
  color: white;
}

.btn-confirm:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .modal-content {
    padding: 24px;
    margin: 20px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-message {
    font-size: 14px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal-content {
    padding: 20px;
    margin: 0;
    max-width: 100%;
  }

  .modal-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 18px;
  }

  .modal-message {
    font-size: 13px;
  }

  .btn {
    padding: 10px 20px;
    font-size: 14px;
    min-width: 100px;
  }
}

@media (max-width: 375px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-content {
    padding: 16px;
  }

  .modal-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
    margin-bottom: 12px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-message {
    font-size: 12px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
