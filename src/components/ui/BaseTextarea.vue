<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  maxlength: { type: Number, default: null },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-ink">{{ label }}</label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      class="w-full resize-none rounded-xl border bg-base px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand disabled:opacity-60"
      :class="error ? 'border-danger' : 'border-line'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
