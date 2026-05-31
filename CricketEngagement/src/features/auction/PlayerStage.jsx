import { formatCrores } from './auctionEngine'

export default function PlayerStage({ player, currentBid, highestBidder, phase, countdown, onViewPlayer }) {
  if (!player) return null

  return (
    <section className="auction-stage-card" style={{ '--player-team': highestBidder?.colors?.accent ?? '#ff3045' }}>
      <div className="auction-stage-topline" />
      <div className="auction-player-copy">
        <div className="auction-player-meta">
          <span className="auction-role-pill">{player.roleLabel}</span>
          <span>{player.overseas ? '🌍' : '🏏'} {player.nationality === 'India' ? 'IND' : player.nationality}</span>
        </div>
        <h2>{player.name}</h2>
      </div>

      <div className="auction-live-bid">
        <div>
          <span>Bid</span>
          <strong>{highestBidder ? formatCrores(currentBid) : formatCrores(player.basePrice)}</strong>
        </div>
        <b>{highestBidder?.shortName ?? '--'}</b>
        <div className="auction-stage-timer">
          <strong>{countdown}</strong>
          <span>sec</span>
        </div>
      </div>

      <div className="auction-stage-divider" />

      <div className="auction-stage-footer">
        <div className="auction-stage-prompt">
          <span aria-hidden="true">♙</span>
          <p>{phase === 'Open bidding' ? 'Select a bid option below' : phase}</p>
        </div>
        <div className="auction-stage-stats">
          <span>Base {formatCrores(player.basePrice)}</span>
          <span>Market {formatCrores(player.estimatedMarketValue)}</span>
          <span>Star {player.starRating}</span>
          <span>Form {player.formRating}</span>
        </div>
        {player.hasCareerStory && (
          <button className="auction-link-button" onClick={() => onViewPlayer(player.name)} type="button">
            Story
          </button>
        )}
      </div>
    </section>
  )
}
