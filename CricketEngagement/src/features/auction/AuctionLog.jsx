export default function AuctionLog({ entries }) {
  return (
    <section className="auction-log-panel">
      <div className="auction-panel-heading">
        <span>Auction Log</span>
        <strong>Live room feed</strong>
      </div>
      <div className="auction-log-list">
        {entries.map((entry, index) => (
          <p key={`${entry}-${index}`}>{entry}</p>
        ))}
      </div>
    </section>
  )
}

