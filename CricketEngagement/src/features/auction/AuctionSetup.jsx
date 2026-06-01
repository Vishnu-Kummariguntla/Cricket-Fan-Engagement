import { motion } from 'framer-motion'
import { getFranchiseProfile } from './botStrategies'

const teamLogoPaths = {
  csk: '/images/logos/chennai-super-kings.svg',
  dc: '/images/logos/delhi-capitals.svg',
  gt: '/images/logos/gujarat-titans.svg',
  kkr: '/images/logos/kolkata-knight-riders.svg',
  lsg: '/images/logos/lucknow-super-giants.svg',
  mi: '/images/logos/mumbai-indians.svg',
  pbks: '/images/logos/punjab-kings.svg',
  rr: '/images/logos/rajasthan-royals.png',
  rcb: '/images/logos/royal-challengers-bengaluru.svg',
  srh: '/images/logos/sunrisers-hyderabad.svg',
}

export default function AuctionSetup({ teams, onSelectTeam }) {
  return (
    <section className="auction-page auction-setup-page">
      <div className="auction-hero">
        <span>IPL Auction Simulator</span>
        <h1>Choose your franchise table.</h1>
        <p>Enter a live mega auction room, manage a ₹120Cr purse, and battle the other nine IPL franchises for active 2026 players.</p>
      </div>

      <div className="auction-franchise-grid">
        {teams.map((team, index) => {
          const profile = getFranchiseProfile(team.id)

          return (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className="auction-franchise-card"
              initial={{ opacity: 0.82, y: 12 }}
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              style={{ '--auction-accent': team.colors.accent, '--auction-secondary': team.colors.secondary }}
              transition={{ delay: index * 0.018 }}
              type="button"
            >
              <div className="auction-franchise-logo">
                <img alt={`${team.name} logo`} src={teamLogoPaths[team.id]} />
              </div>
              <span>{profile.stadium}</span>
              <strong>{team.name}</strong>
              <small>{profile.identity}</small>
              <p>{profile.strategy}</p>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
