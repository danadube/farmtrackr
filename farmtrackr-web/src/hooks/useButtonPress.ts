import { useState } from 'react'

/**
 * Reusable hook for button press feedback animations and hover states
 * Provides visual feedback (scale down + inset shadow) when button is pressed
 * Also handles hover states for consistent button interactions
 * 
 * @returns Object containing handlers and style function
 */
export function useButtonPress() {
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set())
  const [hoveredButtons, setHoveredButtons] = useState<Set<string>>(new Set())

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
    onMouseEnter: () => setHoveredButtons(prev => new Set(prev).add(buttonId)),
    onMouseLeave: () => {
      setHoveredButtons(prev => {
        const next = new Set(prev)
        next.delete(buttonId)
        return next
      })
      setPressedButtons(prev => {
        const next = new Set(prev)
        next.delete(buttonId)
        return next
      })
    }
  })

  /**
   * Get press style for a button with hover support
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
  ): React.CSSProperties => {
    const isPressed = pressedButtons.has(buttonId)
    const isHovered = hoveredButtons.has(buttonId)
    const effectiveBg = isPressed 
      ? (hoverBg || baseBg) 
      : isHovered 
        ? (hoverBg || baseBg) 
        : baseBg

    return {
      ...baseStyle,
      backgroundColor: effectiveBg,
      transform: isPressed ? 'scale(0.97)' : 'scale(1)',
      boxShadow: isPressed 
        ? 'inset 0 2px 4px rgba(0,0,0,0.15)' 
        : baseStyle.boxShadow || 'none',
      transition: 'all 0.15s ease',
      opacity: baseStyle.opacity !== undefined ? baseStyle.opacity : (isHovered && !isPressed ? 0.9 : 1)
    }
  }

  /**
   * Get hover style for buttons that need custom hover effects
   * @param buttonId - Unique identifier for the button
   * @param baseStyle - Base CSS styles for the button
   * @param hoverStyle - Style overrides for hover state
   */
  const getButtonHoverStyle = (
    buttonId: string,
    baseStyle: React.CSSProperties,
    hoverStyle?: Partial<React.CSSProperties>
  ): React.CSSProperties => {
    const isHovered = hoveredButtons.has(buttonId)
    return {
      ...baseStyle,
      ...(isHovered && hoverStyle ? hoverStyle : {}),
      transition: 'all 0.15s ease'
    }
  }

  return {
    pressedButtons,
    hoveredButtons,
    getButtonPressHandlers,
    getButtonPressStyle,
    getButtonHoverStyle
  }
}

