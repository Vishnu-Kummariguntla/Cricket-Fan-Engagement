import { formatCrores, maxSquadSize } from './auctionEngine'

export default function BotTeamsPanel({ teams, userTeamId }) {
  return (
    <aside className="auction-bot-panel">
      <div className="auction-panel-heading">
        <span>Other IPL Franchises</span>
        <strong>AI tables</strong>
      </div>
      <div className="auction-bot-list">
        {teams.filter((team) => team.id !== userTeamId).map((team) => (
          <div className="auction-bot-team" key={team.id} style={{ '--auction-accent': team.colors.accent }}>
            <div className="auction-mini-logo">{team.shortName}</div>
            <div>
              <strong>{team.name}</strong>
              <span>{team.biddingStatus}</span>
            </div>
            <small>{formatCrores(team.purse)} · {team.squad.length}/{maxSquadSize}</small>
          </div>
        ))}
      </div>
    </aside>
  )
}

