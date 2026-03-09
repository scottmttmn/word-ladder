import WordTile from './WordTile'

interface WordRowProps {
  word: string
  variant?: 'default' | 'start' | 'end' | 'ghost'
  animated?: boolean
}

export default function WordRow({ word, variant = 'default', animated }: WordRowProps) {
  const letters = word.split('')

  return (
    <div className="word-row">
      {letters.map((letter, i) => (
        <WordTile
          key={i}
          letter={letter}
          variant={variant}
          animated={animated}
          delay={i * 60}
        />
      ))}
    </div>
  )
}
