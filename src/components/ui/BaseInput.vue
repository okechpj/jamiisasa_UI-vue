<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  autocomplete: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-ink">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      class="w-full rounded-xl border bg-base px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand disabled:opacity-60"
      :class="error ? 'border-danger' : 'border-line'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</p>
  </div>
</template>
