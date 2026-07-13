'use client'
import { useEffect } from 'react'

/* Homepage micro-motion: sticky-header blur on scroll, scroll-reveal for
   [data-reveal] sections, and count-up for [data-count] stats. Runs after
   hydration (no SSR/client mismatch) and degrades to fully-visible content
   when JS is off or reduced-motion is requested. */
export default function HomeMotion() {
  useEffect(() => {
    const hdr = document.getElementById('nmh-header')
    const onScroll = () => hdr?.classList.toggle('nmhome-scrolled', window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    function countUp(el: Element) {
      if (el.getAttribute('data-counted')) return
      el.setAttribute('data-counted', '1')
      const target = parseFloat(el.getAttribute('data-count') || '0') || 0
      const suffix = el.getAttribute('data-suffix') || ''
      if (target === 0) { el.textContent = '0' + suffix; return }
      const dur = 900, start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        const v = target * eased
        el.textContent = (target % 1 === 0 ? Math.round(v).toLocaleString() : v.toFixed(1)) + suffix
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const reveals = Array.from(document.querySelectorAll('[data-reveal]'))
    const counters = Array.from(document.querySelectorAll('[data-count]'))

    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('nmhome-in'))
      counters.forEach(countUp)
      return () => window.removeEventListener('scroll', onScroll)
    }

    // Enable the "hidden then reveal" styling only now that JS drives it.
    document.querySelector('.nmh')?.classList.add('nmh-anim')

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('nmhome-in')
        e.target.querySelectorAll('[data-count]').forEach(countUp)
        if (e.target.hasAttribute('data-count')) countUp(e.target)
        io.unobserve(e.target)
      })
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' })
    reveals.forEach(el => io.observe(el))
    counters.forEach(el => io.observe(el))

    return () => { window.removeEventListener('scroll', onScroll); io.disconnect() }
  }, [])

  return null
}
