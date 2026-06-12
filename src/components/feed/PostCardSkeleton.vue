<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
</script>

<template>
  <div class="rounded-card border border-line bg-base p-4 sm:p-5">
    <div class="flex items-center gap-3">
      <BaseSkeleton class="h-10 w-10 rounded-full" />
      <div class="flex-1 space-y-2">
        <BaseSkeleton class="h-3.5 w-32" />
        <BaseSkeleton class="h-3 w-16" />
      </div>
    </div>
    <div class="mt-4 space-y-2">
      <BaseSkeleton class="h-3.5 w-full" />
      <BaseSkeleton class="h-3.5 w-4/5" />
      <BaseSkeleton class="h-3.5 w-2/3" />
    </div>
    <div class="mt-4 flex gap-5">
      <BaseSkeleton class="h-4 w-10" />
      <BaseSkeleton class="h-4 w-10" />
    </div>
  </div>
</template>
