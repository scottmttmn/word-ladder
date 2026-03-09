interface WordTileProps {
  letter: string
  variant?: 'default' | 'start' | 'end' | 'ghost'
  animated?: boolean
  delay?: number
}

export default function WordTile({ letter, variant = 'default', animated, delay = 0 }: WordTileProps) {
  return (
    <div
      className={`tile tile-${variant} ${animated ? 'tile-pop' : ''}`}
      style={animated ? { animationDelay: `${delay}ms` } : undefined}
    >
      {letter.toUpperCase()}
    </div>
  )
}
