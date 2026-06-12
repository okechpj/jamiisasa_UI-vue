import { watch, onBeforeUnmount } from 'vue'

/*
 * useInfiniteScroll — invoke `onLoadMore` whenever a sentinel element scrolls
 * into view. Pass a template ref to the sentinel; the observer re-binds if the
 * element changes and disconnects on unmount. No external dependency.
 */
export function useInfiniteScroll(sentinelRef, onLoadMore, options = {}) {
  let observer = null

  function bind(el) {
    if (observer) observer.disconnect()
    if (!el || typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore()
        }
      },
      { rootMargin: options.rootMargin || '240px' },
    )
    observer.observe(el)
  }

  watch(sentinelRef, (el) => bind(el), { immediate: true, flush: 'post' })

  onBeforeUnmount(() => {
    if (observer) observer.disconnect()
  })
}
