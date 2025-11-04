import { useState } from 'react'

/**
 * Reusable hook for button press feedback animations
 * Provides visual feedback (scale down + inset shadow) when button is pressed
 * 
 * @returns Object containing handlers and style function
 */
export function useButtonPress() {
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set())

  /**
   * Get event handlers for a button
   * @param buttonId - Unique identifier for the button
   */
  const getButtonPressHandlers = (buttonId: string) => ({
    onMouseDown: () => setPressedButtons(prev => new Set(prev).add(buttonId)),
    onMouseUp: () => setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(buttonId)
      return next
    }),
    onMouseLeave: () => setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(buttonId)
      return next
    })
  })

  /**
   * Get press style for a button
   * @param buttonId - Unique identifier for the button
   * @param baseStyle - Base CSS styles for the button
   * @param baseBg - Base background color
   * @param hoverBg - Hover background color (optional)
   */
  const getButtonPressStyle = (
    buttonId: string, 
    baseStyle: React.CSSProperties, 
    baseBg: string, 
    hoverBg?: string
  ): React.CSSProperties => ({
    ...baseStyle,
    backgroundColor: pressedButtons.has(buttonId) ? (hoverBg || baseBg) : baseBg,
    transform: pressedButtons.has(buttonId) ? 'scale(0.97)' : 'scale(1)',
    boxShadow: pressedButtons.has(buttonId) 
      ? 'inset 0 2px 4px rgba(0,0,0,0.15)' 
      : baseStyle.boxShadow || 'none',
    transition: 'all 0.1s ease'
  })

  return {
    pressedButtons,
    getButtonPressHandlers,
    getButtonPressStyle
  }
}

