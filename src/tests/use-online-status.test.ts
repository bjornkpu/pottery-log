// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from '#/hooks/use-online-status'

describe('useOnlineStatus', () => {
  it('returns true when browser is online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('updates when going offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('updates when coming back online', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })
})
