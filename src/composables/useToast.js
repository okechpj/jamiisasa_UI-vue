import { ref } from 'vue'

/*
 * useToast — a tiny app-wide toast queue. The state is module-level so every
 * caller shares one queue; <ToastContainer /> (mounted once in App.vue) renders
 * it. Components trigger toasts via success()/error()/info().
 */
const toasts = ref([])
let seq = 0

function push(message, type = 'info', timeout = 4000) {
  const id = ++seq
  toasts.value.push({ id, message, type })
  if (timeout) {
    setTimeout(() => dismiss(id), timeout)
  }
  return id
}

function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    show: push,
    success: (message, timeout) => push(message, 'success', timeout),
    error: (message, timeout) => push(message, 'error', timeout),
    info: (message, timeout) => push(message, 'info', timeout),
  }
}
