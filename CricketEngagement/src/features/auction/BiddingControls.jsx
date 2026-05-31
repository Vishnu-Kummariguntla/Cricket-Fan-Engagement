import { formatCrores } from './auctionEngine'

export default function BiddingControls({
  currentBid,
  customBid,
  canPass,
  disabled,
  phase,
  countdown,
  helperText,
  setCustomBid,
  onBid,
  onPass,
  onAutoBid,
  onCustomBid,
  onEndAuction,
  canEndAuction,
}) {
  const timerProgress = Math.max(0, Math.min(100, countdown * 12.5))

  return (
    <section className="auction-controls-panel">
      <div className="auction-countdown">
        <div>
          <span>Live Auction</span>
          <strong>{phase}</strong>
          <small>Current ask starts from {formatCrores(currentBid)}</small>
        </div>
        <div className="auction-timer" aria-label={`${countdown} seconds remaining`}>
          <b>{countdown}</b>
          <i style={{ '--timer-progress': `${timerProgress}%` }} />
        </div>
      </div>
      <div className="auction-control-buttons">
        <button disabled={disabled} onClick={() => onBid(0.2)} type="button">Bid +₹20L</button>
        <button disabled={disabled} onClick={() => onBid(0.5)} type="button">Bid +₹50L</button>
        <button disabled={disabled} onClick={() => onBid(1)} type="button">Bid +₹1Cr</button>
        <button disabled={!canPass} onClick={onPass} type="button">Pass</button>
        <button disabled={disabled} onClick={onAutoBid} type="button">Auto Bid</button>
      </div>
      <p className="auction-bid-helper">{helperText}</p>
      <div className="auction-custom-bid">
        <label>
          Custom Bid
          <input min={currentBid + 0.2} onChange={(event) => setCustomBid(event.target.value)} step="0.1" type="number" value={customBid} />
        </label>
        <button disabled={disabled} onClick={onCustomBid} type="button">Submit</button>
        <button disabled={!canEndAuction} onClick={onEndAuction} type="button">End Auction</button>
      </div>
    </section>
  )
}
