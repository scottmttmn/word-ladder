interface HowToPlayModalProps {
  onClose: () => void
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-help" onClick={e => e.stopPropagation()}>
        <h2>How to Play</h2>
        <p>Transform the <strong>start word</strong> into the <strong>end word</strong> one step at a time.</p>

        <h3>Move Types</h3>
        <div className="help-moves">
          <div className="help-move">
            <span className="help-badge" style={{ backgroundColor: 'var(--color-classic)' }}>Letter Swap</span>
            <span>Change one letter: <strong>CAT &rarr; COT</strong></span>
          </div>
          <div className="help-move">
            <span className="help-badge" style={{ backgroundColor: 'var(--color-rhyme)' }}>Rhyme</span>
            <span>Use a rhyming word: <strong>CAT &rarr; FLAT</strong></span>
          </div>
          <div className="help-move">
            <span className="help-badge" style={{ backgroundColor: 'var(--color-anagram)' }}>Anagram</span>
            <span>Rearrange letters: <strong>CAT &rarr; ACT</strong></span>
          </div>
          <div className="help-move">
            <span className="help-badge" style={{ backgroundColor: 'var(--color-add-remove)' }}>Add/Remove</span>
            <span>Add or remove a letter: <strong>CAT &rarr; CART</strong></span>
          </div>
        </div>

        <p>Try to match or beat the <strong>optimal</strong> number of moves!</p>

        <button className="btn btn-primary" onClick={onClose}>Got it!</button>
      </div>
    </div>
  )
}
