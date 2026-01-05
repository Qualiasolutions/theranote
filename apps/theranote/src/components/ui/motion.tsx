'use client'

import { motion, type Variants, type HTMLMotionProps, useReducedMotion } from 'motion/react'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Fade in from bottom
export const FadeIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { delay?: number; duration?: number }
>(({ children, delay = 0, duration = 0.5, className, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
})
FadeIn.displayName = 'FadeIn'

// Slide in from side
export const SlideIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { direction?: 'left' | 'right' | 'up' | 'down'; delay?: number; duration?: number }
>(({ children, direction = 'left', delay = 0, duration = 0.5, className, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()

  const directionOffset = {
    left: { x: -30, y: 0 },
    right: { x: 30, y: 0 },
    up: { x: 0, y: -30 },
    down: { x: 0, y: 30 },
  }

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? {} : { opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
})
SlideIn.displayName = 'SlideIn'

// Scale in
export const ScaleIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { delay?: number; duration?: number }
>(({ children, delay = 0, duration = 0.4, className, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
})
ScaleIn.displayName = 'ScaleIn'

// Stagger container for lists
const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export function StaggerContainer({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      animate="visible"
      variants={staggerContainerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={staggerItemVariants} className={className} {...props}>
      {children}
    </motion.div>
  )
}

// Hover card with lift effect
export function HoverCard({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Hover scale for buttons and interactive elements
export function HoverScale({
  children,
  className,
  scale = 1.02,
  ...props
}: HTMLMotionProps<'div'> & { scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Animated counter for stats
export function AnimatedNumber({
  value,
  className,
  duration = 1,
}: {
  value: number
  className?: string
  duration?: number
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {value}
      </motion.span>
    </motion.span>
  )
}

// Page transition wrapper
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Shimmer loading effect
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        'before:animate-shimmer',
        className
      )}
    />
  )
}

// Pulse animation for notifications
export function Pulse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Floating animation
export function Float({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Re-export motion for direct use
export { motion }
