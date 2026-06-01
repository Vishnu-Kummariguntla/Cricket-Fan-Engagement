import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap } from 'gsap'
import * as THREE from 'three'
import './App.css'
import { cricketerProfiles, quizQuestions } from './cricketerProfiles'
import spreadsheetCareerTimelines from './data/careerTimelines.json'
import featuredPlayers from './data/featuredPlayers.json'
import iplTeams from './data/iplTeams.json'
import iplSeasonImages from './data/iplSeasonImages.json'
import iplSeasonTimeline from './data/iplSeasonTimeline.json'
import playerMeta from './data/playerMeta.json'
import eventDetailsData from './data/eventDetails.json'
import playerHighlightsData from './data/playerHighlights.json'
import internationalCareerTimelinesData from './data/internationalCareerTimelines.json'
import heroImage from './assets/hero.png'
import IplDynastyBuilder from './features/dynasty/DynastyBuilder'
import AuctionSimulator from './features/auction/AuctionSimulator'
import AccountNav from './features/account/AccountNav'
import AuthModal from './features/account/AuthModal'
import { AuthProvider, useAuth } from './features/account/AuthProvider'
import CricketHub from './features/account/CricketHub'
import ProfilePage from './features/account/ProfilePage'
import SharePage from './features/account/SharePage'

const players = featuredPlayers

const eventDetails = eventDetailsData

const featuredAnimations = Object.values(players).reduce((animations, player) => {
  animations[player.name] = player
  return animations
}, {})

const knownJerseyNumbers = playerMeta.jerseyNumbers

const roleOrder = {
  batter: 1,
  keeper: 2,
  allrounder: 3,
  bowler: 4,
}

const roleLabels = {
  batter: 'Batter',
  keeper: 'Keeper-batter',
  allrounder: 'All-rounder',
  bowler: 'Bowler',
}

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

const wicketkeepers = new Set(playerMeta.roleGroups.wicketkeepers)
const allrounders = new Set(playerMeta.roleGroups.allrounders)
const bowlers = new Set(playerMeta.roleGroups.bowlers)

const playerHighlights = playerHighlightsData

const internationalCareerTimelines = internationalCareerTimelinesData

const visualizationPlayerNames = new Set(iplTeams.flatMap((team) => team.players.map(([name]) => name)))

function hasPlayerVisualization(name) {
  return visualizationPlayerNames.has(name)
}

function getRoleGroup(name, explicitRole) {
  if (explicitRole) return explicitRole
  if (wicketkeepers.has(name)) return 'keeper'
  if (allrounders.has(name)) return 'allrounder'
  if (bowlers.has(name)) return 'bowler'
  return 'batter'
}

function hasVerificationPlaceholder(timeline) {
  return timeline.some(([, , tag, detail]) => {
    const text = `${tag} ${detail}`.toLowerCase()

    return (
      tag === 'Verify' ||
      text.includes('should be checked') ||
      text.includes('should be verified') ||
      text.includes('verify before publication') ||
      text.includes('no clear public comeback narrative found')
    )
  })
}

function getPlayerNumber(name, rosterIndex) {
  return knownJerseyNumbers[name] ?? String(rosterIndex + 1).padStart(2, '0')
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((character) => character + character).join('') : value
  const number = Number.parseInt(normalized, 16)

  return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`
}

function getColorVars(colors) {
  return {
    '--accent': colors.accent,
    '--accent-rgb': hexToRgb(colors.accent),
    '--secondary': colors.secondary,
    '--secondary-rgb': hexToRgb(colors.secondary),
    '--team-accent': colors.accent,
    '--team-secondary': colors.secondary,
    '--team-tertiary': colors.tertiary ?? colors.secondary,
  }
}

function getPlayerAnimationProfile(name, nationality, team, rosterIndex, explicitRole) {
  const featured = featuredAnimations[name]
  const number = getPlayerNumber(name, rosterIndex)
  const role = getRoleGroup(name, explicitRole)
  const roleLabel = roleLabels[role]
  const highlight = playerHighlights[name] ?? {
    early:
      nationality === 'India'
        ? `${name}'s early pathway runs through Indian domestic, age-group, academy, or state-cricket competition before the IPL squad stage.`
        : `${name}'s early pathway runs through ${nationality}'s cricket structure and franchise opportunities before entering this IPL squad context.`,
    debut:
      nationality === 'India'
        ? `India pathway: domestic cricket, IPL selection, and national-team contention shape ${name}'s profile.`
        : `${nationality} pathway: international or franchise cricket experience shapes ${name}'s IPL value.`,
    influence: `${name}'s influential performances are framed through ${roleLabel.toLowerCase()} role execution, pressure moments, and fit inside ${team.shortName}'s tactical plans.`,
    best: `${name}'s best-season window is measured through availability, selection trust, role clarity, and repeatable impact for ${team.shortName}.`,
  }
  const spreadsheetTimeline = spreadsheetCareerTimelines[name]
  const usableSpreadsheetTimeline =
    spreadsheetTimeline && !hasVerificationPlaceholder(spreadsheetTimeline) ? spreadsheetTimeline : undefined
  const explicitTimeline = highlight.timeline ?? usableSpreadsheetTimeline ?? internationalCareerTimelines[name]

  if (featured) {
    return {
      ...featured,
      subtitle: `${team.shortName} 2026 squad · ${roleLabel} · ${nationality}`,
      number,
    }
  }

  if (explicitTimeline) {
    return {
      name,
      number,
      subtitle: `${team.shortName} 2026 squad · ${roleLabel} · ${nationality}`,
      theme: 'team-player',
      range: explicitTimeline.at(-1)?.[1] ?? '2026',
      nodes: explicitTimeline.map(([title, year, tag, detail], index) => ({
        title,
        year,
        tag,
        detail,
        frame: 45 + index * 58,
      })),
      bars: explicitTimeline.slice(0, 8).map(([title, year], index) => ({
        year,
        nodeTitle: title,
        label: title.split(' ').slice(0, 2).join(' '),
        value: Math.min(96, 48 + index * 7),
        frame: 65 + index * 48,
      })),
      portals: ['Early life', 'Debut', 'Milestones', 'Trophies', 'Peak seasons', 'Franchise role'],
    }
  }

  return {
    name,
    number,
    subtitle: `${team.shortName} 2026 squad · ${roleLabel} · ${nationality}`,
    theme: 'team-player',
    range: '2026 IPL squad',
    nodes: [
      {
        title: 'Early pathway',
        year: nationality,
        tag: 'Origin',
        frame: 45,
        detail: highlight.early,
      },
      {
        title: 'Debut checkpoint',
        year: 'Debut',
        tag: 'Launch',
        frame: 105,
        detail: highlight.debut,
      },
      {
        title: role === 'bowler' ? 'Influential spell' : 'Influential innings',
        year: 'Impact',
        tag: 'Memory',
        frame: 175,
        detail: highlight.influence,
      },
      {
        title: 'Best seasons',
        year: 'Peak',
        tag: 'Form',
        frame: 245,
        detail: highlight.best,
      },
      {
        title: 'Winning value',
        year: 'Wins',
        tag: 'Pressure',
        frame: 285,
        detail:
          highlight.franchise ??
          `${name}'s winning value for ${team.shortName} is judged by whether the ${roleLabel.toLowerCase()} role holds up when game state, venue, and opposition matchup all change.`,
      },
      {
        title: `${team.shortName} squad entry`,
        year: '2026',
        tag: 'Franchise',
        frame: 345,
        detail: `${team.shortName} carries ${name} in a roster built around captain ${team.captain}, role coverage, matchup flexibility, and tactical depth across the season.`,
      },
      {
        title: 'Matchday responsibility',
        year: 'XI',
        tag: 'Role',
        frame: 425,
        detail: `${name}'s matchday value is framed through role competition, entry point, pressure phase, and the specific job ${team.name} needs filled against different opponents.`,
      },
      {
        title: 'Future fan signal',
        year: 'Story',
        tag: 'Fans',
        frame: 505,
        detail: `For supporters, ${name} becomes one more node in the larger ${team.shortName} story: jersey number, nationality, role expectation, and team colors moving together.`,
      },
    ],
    bars: [
      { year: nationality, label: 'Nation', value: 54, frame: 65 },
      { year: 'Debut', label: 'Path', value: 64, frame: 125 },
      { year: 'Impact', label: 'Memory', value: 74, frame: 185 },
      { year: 'Peak', label: 'Season', value: 78, frame: 245 },
      { year: 'Wins', label: 'Value', value: 72, frame: 285 },
      { year: '2026', label: team.shortName, value: 82, frame: 345 },
      { year: 'XI', label: 'Role', value: 68, frame: 405 },
    ],
    portals: ['Early pathway', 'Debut path', 'Influential performance', 'Best seasons', 'Winning value', 'Fan connection'],
  }
}

function getEventPosition(index, total, isCompact) {
  if (isCompact) {
    const columns = 3
    const row = Math.floor(index / columns)
    const column = index % columns
    const xStep = columns > 1 ? 68 / (columns - 1) : 0

    return {
      x: 16 + column * xStep,
      y: 12 + row * 24,
    }
  }

  const topCount = Math.ceil(total / 2)
  const bottomCount = Math.floor(total / 2)
  const rowIndex = Math.floor(index / 2)
  const isTopRow = index % 2 === 0
  const count = isTopRow ? topCount : bottomCount
  const start = isTopRow ? 8 : 16
  const end = isTopRow ? 92 : 84
  const step = count > 1 ? (end - start) / (count - 1) : 0

  return {
    x: start + rowIndex * step,
    y: isTopRow ? 23 : 73,
  }
}

function useIsCompactLayout() {
  const [isCompact, setIsCompact] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  })

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 640)

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isCompact
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    return typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(media.matches)

    handleChange()
    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-shell">
          <section className="app-error">
            <strong>Something failed while loading this page.</strong>
            <p>{this.state.error.message}</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

function usePlayback() {
  const [frame, setFrame] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (current >= 720) {
          window.clearInterval(timer)
          return 720
        }

        return Math.min(720, current + 6)
      })
    }, 45)

    return () => window.clearInterval(timer)
  }, [])

  return frame
}

function NetworkLine({ node, visible }) {
  const center = { x: 50, y: 48 }
  const dx = node.x - center.x
  const dy = node.y - center.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return (
    <span
      className={visible ? 'network-line visible' : 'network-line'}
      style={{
        left: `${center.x}%`,
        top: `${center.y}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  )
}

function KnowledgeNetwork({ player, frame, sectionId, colors, embedded = false }) {
  const isCompact = useIsCompactLayout()
  const toneStyle = colors ? getColorVars(colors) : undefined
  const positionedNodes = useMemo(() => {
    return player.nodes.map((node, index) => ({
      ...node,
      detail: node.detail ?? eventDetails[node.title] ?? `${node.title} shaped ${player.name}'s career arc in ${node.year}.`,
      ...getEventPosition(index, player.nodes.length, isCompact),
    }))
  }, [isCompact, player.name, player.nodes])
  const currentNode = useMemo(() => {
    return positionedNodes.reduce((latest, node) => {
      if (frame >= node.frame && node.frame >= latest.frame) {
        return node
      }
      return latest
    }, positionedNodes[0])
  }, [frame, positionedNodes])
  const [selectedNodeTitle, setSelectedNodeTitle] = useState(null)
  const selectedNode = useMemo(() => {
    return positionedNodes.find((node) => node.title === selectedNodeTitle) ?? currentNode
  }, [currentNode, positionedNodes, selectedNodeTitle])
  const selectedBar = useMemo(() => {
    return (
      player.bars.find((bar) => {
        if (bar.nodeTitle) {
          return bar.nodeTitle === selectedNode.title
        }

        return bar.year === selectedNode.year
      }) ?? player.bars[0]
    )
  }, [player.bars, selectedNode.title, selectedNode.year])

  return (
    <section
      className={`network-stage pointer-reactive ${player.theme} ${embedded ? 'embedded' : ''}`}
      id={sectionId}
      style={toneStyle}
      aria-label={`${player.name} animated knowledge network`}
    >
      <div className="stage-header">
        <div className="identity">
          <span>{player.number}</span>
          <div>
            <strong>{player.name}</strong>
            <small>{player.subtitle}</small>
          </div>
        </div>

        <div className="mode-label">
          <span>{player.range}</span>
          <small>Living Knowledge Network</small>
        </div>
      </div>

      <div className="network-map pointer-reactive">
        <div className="aura aura-one" />
        <div className="aura aura-two" />

        {positionedNodes.map((node) => (
          <NetworkLine node={node} visible={frame >= node.frame} key={`line-${node.title}`} />
        ))}

        <div className="core-node">
          <span>{player.number}</span>
          <strong>{player.name}</strong>
        </div>

        {positionedNodes.map((node) => (
          <button
            className={[
              'career-node',
              frame >= node.frame ? 'visible' : '',
              selectedNode.title === node.title ? 'selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={node.title}
            onClick={() => setSelectedNodeTitle(node.title)}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            type="button"
          >
            <span>{node.year}</span>
            <strong>{node.title}</strong>
            <small>{node.tag}</small>
          </button>
        ))}

        <div className="particle-field">
          {Array.from({ length: 34 }, (_, index) => (
            <span
              className={frame > 280 + index * 5 ? 'particle visible' : 'particle'}
              key={index}
              style={{
                '--angle': `${index * 24}deg`,
                '--distance': `${90 + index * 5}px`,
                '--delay': `${index * 38}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="lower-grid">
        <div className="momentum-panel">
          <div className="panel-heading">
            <h2>Career Momentum</h2>
            <span>{selectedNode.year}</span>
          </div>
          <div className="bar-row">
            {player.bars.map((bar) => (
              <button
                className={bar === selectedBar ? 'bar-item selected' : 'bar-item'}
                key={`${bar.year}-${bar.nodeTitle ?? bar.label}`}
                onClick={() => {
                  const nextNode = positionedNodes.find((node) => {
                    if (bar.nodeTitle) {
                      return node.title === bar.nodeTitle
                    }

                    return node.year === bar.year
                  })
                  setSelectedNodeTitle(nextNode?.title ?? selectedNode.title)
                }}
                type="button"
              >
                <div className="bar-shell">
                  <span
                    style={{
                      height: frame >= bar.frame ? `${bar.value}%` : '2%',
                    }}
                  />
                </div>
                <strong>{bar.year}</strong>
                <small>{bar.label}</small>
              </button>
            ))}
          </div>
          <div className="event-detail-bar">
            <div className="detail-meter">
              <span style={{ width: `${selectedBar.value}%` }} />
            </div>
            <div>
              <strong>{selectedNode.title}</strong>
              <p>{selectedNode.detail}</p>
            </div>
          </div>
        </div>

        <div className="portal-panel">
          <h2>Influence Portals</h2>
          <div>
            {player.portals.map((portal, index) => (
              <span className={frame >= 90 + index * 55 ? 'portal visible' : 'portal'} key={portal}>
                {portal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function getPlayerSlug(name) {
  return name.toLowerCase().replaceAll(' ', '-')
}

function getTargetPlayerName() {
  if (typeof window === 'undefined') return ''

  return new URLSearchParams(window.location.search).get('player') ?? ''
}

function getSeasonImage(season, imageType) {
  return iplSeasonImages.seasons[String(season.year)]?.[imageType]?.path ?? ''
}

function getSeasonImageMeta(season, imageType) {
  return iplSeasonImages.seasons[String(season.year)]?.[imageType] ?? null
}

const wikipediaTitleOverrides = {
  'David Warner': 'David Warner (cricketer)',
  'KL Rahul': 'K. L. Rahul',
  'RP Singh': 'R. P. Singh',
}

const directArchiveImageOverrides = {
  'Harshal Patel': 'https://img.ipl.com/upload/20251106/7148d75045552eb9db20dc265b77c4e2.jpg',
  'Prasidh Krishna': 'https://img.ipl.com/upload/20251224/a59a1510497c37689aed5691a66e1918.jpg',
}

function getArchiveImageSubject(season, imageType) {
  if (imageType === 'champion') return season.champion
  if (imageType === 'orangeCap') return season.orangeCap.winner
  if (imageType === 'purpleCap') return season.purpleCap.winner
  return ''
}

function shouldUseLocalSeasonImage(season, imageType) {
  const image = getSeasonImageMeta(season, imageType)

  return image?.status === 'manual-replacement'
}

function IplArchiveImage({ alt, imageType, season }) {
  const imageMeta = getSeasonImageMeta(season, imageType)
  const localPath = getSeasonImage(season, imageType)
  const subject = getArchiveImageSubject(season, imageType)
  const title = wikipediaTitleOverrides[subject] ?? subject
  const directImageUrl = directArchiveImageOverrides[subject] ?? ''
  const useLocalOnly = shouldUseLocalSeasonImage(season, imageType) || !title || title === 'Season in progress' || title === 'Live race'
  const [wikiImage, setWikiImage] = useState({ title: '', url: '', hasError: false })
  const initials = subject
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const hasWikiImage = wikiImage.title === title && wikiImage.url && !wikiImage.hasError
  const isChampionLogo = imageType === 'champion'
  const imageUrl = directImageUrl || (hasWikiImage ? wikiImage.url : localPath || '')
  const imageClassName = isChampionLogo ? 'archive-logo-image' : 'archive-player-image'
  const isUndecidedSeasonImage = title === 'Season in progress' || title === 'Live race'

  useEffect(() => {
    const controller = new AbortController()

    if (useLocalOnly) return () => controller.abort()

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data) => {
        const thumbnail = data?.thumbnail?.source || data?.originalimage?.source
        if (thumbnail) {
          setWikiImage({ title, url: thumbnail, hasError: false })
        } else {
          setWikiImage({ title, url: '', hasError: true })
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setWikiImage({ title, url: '', hasError: true })
        }
      })

    return () => controller.abort()
  }, [title, useLocalOnly])

  if (isUndecidedSeasonImage) {
    return (
      <div className="archive-image-fallback archive-image-tbd" role="img" aria-label={alt || 'To be determined'}>
        <span>To be determined</span>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className="archive-image-fallback" role="img" aria-label={alt}>
        <span>{initials || season.year}</span>
      </div>
    )
  }

  return <img alt={alt} className={imageClassName} src={imageUrl} onError={() => setWikiImage({ title, url: '', hasError: true })} />
}

function isUndecidedIplSeason(season) {
  return season.champion === 'Season in progress'
}

function TeamSquadAnimation({ team, frame }) {
  const orderedPlayers = useMemo(() => {
    return [...team.players].sort(([leftName, , leftRole], [rightName, , rightRole]) => {
      if (leftName === team.captain) return -1
      if (rightName === team.captain) return 1
      const roleDifference = roleOrder[getRoleGroup(leftName, leftRole)] - roleOrder[getRoleGroup(rightName, rightRole)]

      return roleDifference || leftName.localeCompare(rightName)
    })
  }, [team.captain, team.players])
  const defaultPlayerName = useMemo(() => {
    const requestedPlayer = getTargetPlayerName()
    const matchedPlayer = orderedPlayers.find(([name]) => getPlayerSlug(name) === requestedPlayer)?.[0]

    return matchedPlayer ?? orderedPlayers.find(([name]) => name === team.captain)?.[0] ?? orderedPlayers[0][0]
  }, [orderedPlayers, team.captain])
  const [selectedPlayerName, setSelectedPlayerName] = useState(defaultPlayerName)
  const selectedPlayerIndex = orderedPlayers.findIndex(([name]) => name === selectedPlayerName)
  const selectedPlayer = orderedPlayers[selectedPlayerIndex] ?? orderedPlayers[0]
  const selectedProfile = useMemo(() => {
    return getPlayerAnimationProfile(
      selectedPlayer[0],
      selectedPlayer[1],
      team,
      Math.max(0, selectedPlayerIndex),
      selectedPlayer[2],
    )
  }, [selectedPlayer, selectedPlayerIndex, team])
  const overseasCount = orderedPlayers.filter(([, nationality]) => nationality !== 'India').length

  return (
    <section
      className={`team-squad-stage pointer-reactive ${team.id}`}
      id={`${team.id}-team`}
      style={{
        '--team-accent': team.colors.accent,
        '--team-secondary': team.colors.secondary,
        '--team-tertiary': team.colors.tertiary ?? team.colors.secondary,
      }}
      aria-label={`${team.name} 2026 squad visualization`}
    >
      <div className="team-squad-header">
        <div className="team-mark">
          <img alt={`${team.name} logo`} src={teamLogoPaths[team.id]} />
        </div>
        <div>
          <h2>{team.name}</h2>
          <p>
            Captain: {team.captain} · {orderedPlayers.length} players · {overseasCount} overseas
          </p>
        </div>
      </div>

      <div className="team-squad-layout">
        <div className="team-roster-grid">
          {orderedPlayers.map(([name, nationality, role], index) => (
            <button
              className={[
                'team-player-card',
                'visible',
                selectedPlayerName === name ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={`${team.id}-${name}`}
              onClick={() => setSelectedPlayerName(name)}
              data-player-slug={getPlayerSlug(name)}
              style={{ '--delay': `${index * 24}ms` }}
              type="button"
            >
              <span>{getPlayerNumber(name, index)}</span>
              <strong>
                {name}
                {name === team.captain ? ' (C)' : ''}
              </strong>
              <small>{nationality}</small>
              <em>{roleLabels[getRoleGroup(name, role)]}</em>
            </button>
          ))}
        </div>

        <KnowledgeNetwork
          colors={team.colors}
          embedded
          frame={frame}
          player={selectedProfile}
          sectionId={`${team.id}-${getPlayerSlug(selectedPlayerName)}-visualization`}
        />
      </div>
    </section>
  )
}

function VisualizationsPage({ frame }) {
  useEffect(() => {
    const requestedPlayer = getTargetPlayerName()
    if (!requestedPlayer) return

    window.setTimeout(() => {
      document.querySelector(`[data-player-slug="${requestedPlayer}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)
  }, [])

  return (
    <div className="animations-page">
      <nav className="animation-scrollbar" aria-label="Visualization sections">
        <div className="scrollbar-track">
          {iplTeams.map((team, index) => (
            <a
              href={`#${team.id}-team`}
              key={team.id}
              aria-label={`Jump to ${team.name} squad`}
              data-team={team.shortName}
            >
              <img alt="" aria-hidden="true" src={teamLogoPaths[team.id]} />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="team-squad-page">
        {iplTeams.map((team) => (
          <TeamSquadAnimation frame={frame} key={team.id} team={team} />
        ))}
      </div>
    </div>
  )
}

function IplMuseumScene() {
  const canvasRef = useRef(null)
  const isCompact = useIsCompactLayout()
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (isCompact || prefersReducedMotion) return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xd72638, roughness: 0.36, metalness: 0.18 }),
    )
    const seam = new THREE.Mesh(
      new THREE.TorusGeometry(1.27, 0.025, 10, 56),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
    )
    const trophy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.72, 1.6, 24),
      new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.2, metalness: 0.85 }),
    )
    const lights = [-4, -2, 0, 2, 4].map((x, index) => {
      const light = new THREE.SpotLight(0xffffff, 0, 16, Math.PI / 6, 0.6, 1.2)
      light.position.set(x, 4.5, 3)
      gsap.to(light, { intensity: 12, delay: index * 0.22, duration: 0.7, ease: 'power2.out' })
      scene.add(light)
      return light
    })

    camera.position.set(0, 0.25, 7)
    ball.add(seam)
    seam.rotation.x = Math.PI / 2
    trophy.position.set(0, -0.18, -4)
    trophy.scale.set(0.46, 0.46, 0.46)
    scene.add(ball, trophy, new THREE.AmbientLight(0x335577, 1.8))

    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / Math.max(clientHeight, 1)
      camera.updateProjectionMatrix()
    }

    let frameId = 0
    let isVisible = true
    const render = () => {
      if (!isVisible) {
        frameId = requestAnimationFrame(render)
        return
      }

      ball.rotation.y += 0.014
      ball.rotation.x += 0.006
      trophy.rotation.y += 0.004
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(render)
    }
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })

    resize()
    observer.observe(canvas)
    render()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      lights.forEach((light) => scene.remove(light))
      renderer.dispose()
      ball.geometry.dispose()
      seam.geometry.dispose()
      trophy.geometry.dispose()
    }
  }, [isCompact, prefersReducedMotion])

  if (isCompact || prefersReducedMotion) {
    return (
      <div className="ipl-museum-placeholder" aria-hidden="true">
        <div className="placeholder-icon" />
        <div className="placeholder-copy">
          <strong>IPL Stadium Ready</strong>
          <span>Lightweight mode keeps navigation responsive.</span>
        </div>
      </div>
    )
  }

  return <canvas className="ipl-museum-canvas" ref={canvasRef} aria-label="Spinning cricket ball in stadium lights" />
}

function SeasonModal({ season, onClose }) {
  if (!season) return null

  const isUndecided = isUndecidedIplSeason(season)

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="season-modal-backdrop"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
      >
        <motion.article
          animate={{ scale: 1, y: 0 }}
          className="season-modal"
          exit={{ scale: 0.96, y: 28 }}
          initial={{ scale: 0.96, y: 28 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <button aria-label="Close season card" className="season-close" onClick={onClose} type="button">
            Close
          </button>
          <div className="season-modal-grid">
            <div className="season-champion-panel" style={{ '--season-a': season.colors[0], '--season-b': season.colors[1] }}>
              <div className="season-team-image" aria-label={`${season.champion} winning team image`}>
                <IplArchiveImage alt={`${season.champion} ${season.year} winning team`} imageType="champion" season={season} />
                {!isUndecided && <span>{season.year}</span>}
                {!isUndecided && <strong>{season.champion}</strong>}
                {!isUndecided && <small>Winning team</small>}
              </div>
              {!isUndecided && <span>{season.year}</span>}
              <h2>{isUndecided ? 'To be determined' : season.champion}</h2>
              {!isUndecided && <p>{season.finalScore}</p>}
              {!isUndecided && (
                <div className="celebration-strip">
                  <span>{season.champion}</span>
                  <span>Celebration frame</span>
                  <span>{season.finalMvp}</span>
                </div>
              )}
            </div>
            <div className="season-modal-copy">
              <div className="season-awards">
                <div>
                  <IplArchiveImage alt={`${season.orangeCap.winner} portrait`} imageType="orangeCap" season={season} />
                  <span>Orange Cap</span>
                  <strong>{season.orangeCap.winner}</strong>
                  <small>{season.orangeCap.runs} runs</small>
                </div>
                <div>
                  <IplArchiveImage alt={`${season.purpleCap.winner} portrait`} imageType="purpleCap" season={season} />
                  <span>Purple Cap</span>
                  <strong>{season.purpleCap.winner}</strong>
                  <small>{season.purpleCap.wickets} wickets</small>
                </div>
              </div>
              <p>{season.summary}</p>
              <dl>
                <div>
                  <dt>Final venue</dt>
                  <dd>{season.venue}</dd>
                </div>
                <div>
                  <dt>Player of the tournament</dt>
                  <dd>{season.playerOfTournament}</dd>
                </div>
                <div>
                  <dt>Final MVP</dt>
                  <dd>{season.finalMvp}</dd>
                </div>
                <div>
                  <dt>Best innings</dt>
                  <dd>{season.bestInnings}</dd>
                </div>
                <div>
                  <dt>Best bowling spell</dt>
                  <dd>{season.bestBowling}</dd>
                </div>
              </dl>
              <div className="iconic-moments">
                {season.moments.map((moment) => (
                  <span key={moment}>{moment}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}

function IplHallTimeline({ seasons }) {
  const [hoveredSeason, setHoveredSeason] = useState(seasons[seasons.length - 2])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const trailRef = useRef(null)
  const ballRef = useRef(null)
  const trackRef = useRef(null)
  const milestonesRef = useRef(null)
  const isDraggingTimelineRef = useRef(false)
  const activeSeason = hoveredSeason ?? seasons[seasons.length - 2]
  const activeSeasonIsUndecided = isUndecidedIplSeason(activeSeason)

  const updateTimelineScroll = () => {
    const milestones = milestonesRef.current
    if (!milestones) return

    const maxScroll = milestones.scrollWidth - milestones.clientWidth
    const nextScroll = maxScroll > 0 ? Math.round((milestones.scrollLeft / maxScroll) * 1000) : 0
    gsap.to(trailRef.current, { scaleX: nextScroll / 1000, duration: 0.2, ease: 'power2.out' })
    gsap.to(ballRef.current, {
      left: `calc(${nextScroll / 10}% - ${(nextScroll / 1000) * 32}px)`,
      rotate: (nextScroll / 1000) * 720,
      duration: 0.2,
      ease: 'power2.out',
    })
  }

  const setTimelineScrollPosition = (value) => {
    const milestones = milestonesRef.current
    if (!milestones) return

    const nextValue = Number(value)
    const maxScroll = milestones.scrollWidth - milestones.clientWidth
    milestones.scrollLeft = maxScroll * (nextValue / 1000)
  }

  const setTimelineScrollFromPointer = (clientX) => {
    const track = trackRef.current
    if (!track) return

    const bounds = track.getBoundingClientRect()
    const progress = Math.min(1, Math.max(0, (clientX - bounds.left) / Math.max(bounds.width, 1)))
    setTimelineScrollPosition(Math.round(progress * 1000))
  }

  const startBallDrag = (event) => {
    event.preventDefault()
    isDraggingTimelineRef.current = true
    setTimelineScrollFromPointer(event.clientX)
  }

  const dragBall = (event) => {
    if (!isDraggingTimelineRef.current) return
    setTimelineScrollFromPointer(event.clientX)
  }

  const stopBallDrag = () => {
    isDraggingTimelineRef.current = false
  }

  const startMouseBallDrag = (event) => {
    event.preventDefault()
    isDraggingTimelineRef.current = true
    setTimelineScrollFromPointer(event.clientX)
  }

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isDraggingTimelineRef.current) return
      setTimelineScrollFromPointer(event.clientX)
    }
    const handleMouseMove = (event) => {
      if (!isDraggingTimelineRef.current) return
      setTimelineScrollFromPointer(event.clientX)
    }
    const handleTouchMove = (event) => {
      if (!isDraggingTimelineRef.current) return
      setTimelineScrollFromPointer(event.touches[0]?.clientX ?? 0)
    }
    const handlePointerUp = () => {
      isDraggingTimelineRef.current = false
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handlePointerUp)
    }
  })

  return (
    <section className="ipl-hall" aria-label="IPL Hall of Fame Timeline">
      <div className="ipl-hall-header">
        <span>IPL Hall of Fame Timeline</span>
        <h2>Every season, every crown, every cap race.</h2>
        <p>Drag the ball to move through seasons. Hover a year for the museum display, then click to open the season card.</p>
      </div>

      <div className="season-showcase" style={{ '--season-a': activeSeason.colors[0], '--season-b': activeSeason.colors[1] }}>
        <motion.div animate={{ y: -8, rotateX: 8 }} className="champion-card" key={activeSeason.year}>
          <div className="champion-team-image" aria-hidden="true">
            <IplArchiveImage alt="" imageType="champion" season={activeSeason} />
            {!activeSeasonIsUndecided && <span>{activeSeason.year}</span>}
            {!activeSeasonIsUndecided && <strong>{activeSeason.champion}</strong>}
          </div>
          {!activeSeasonIsUndecided && <span>{activeSeason.year} Champion</span>}
          <strong>{activeSeasonIsUndecided ? 'To be determined' : activeSeason.champion}</strong>
          {!activeSeasonIsUndecided && <small>{activeSeason.finalScore}</small>}
        </motion.div>
        <div className="cap-player orange-cap">
          <IplArchiveImage alt={`${activeSeason.orangeCap.winner} portrait`} imageType="orangeCap" season={activeSeason} />
          <span>Orange Cap</span>
          <strong>{activeSeason.orangeCap.winner}</strong>
          <small>{activeSeason.orangeCap.runs} runs</small>
        </div>
        <div className="trophy-pulse">IPL</div>
        <div className="cap-player purple-cap">
          <IplArchiveImage alt={`${activeSeason.purpleCap.winner} portrait`} imageType="purpleCap" season={activeSeason} />
          <span>Purple Cap</span>
          <strong>{activeSeason.purpleCap.winner}</strong>
          <small>{activeSeason.purpleCap.wickets} wickets</small>
        </div>
        <div className="mini-scoreboard">
          <span>Final</span>
          <strong>{activeSeason.champion} vs {activeSeason.runnerUp}</strong>
          <small>{activeSeason.venue}</small>
        </div>
      </div>

      <div
        className="season-milestones"
        onScroll={updateTimelineScroll}
        ref={milestonesRef}
        style={{ '--season-a': activeSeason.colors[0], '--season-b': activeSeason.colors[1] }}
      >
        {seasons.map((season) => (
          <button
            aria-label={`Open IPL ${season.year} season card`}
            className={activeSeason.year === season.year ? 'active' : ''}
            key={season.year}
            onClick={() => {
              setHoveredSeason(season)
              setSelectedSeason(season)
            }}
            onFocus={() => setHoveredSeason(season)}
            onMouseEnter={() => setHoveredSeason(season)}
            style={{ '--season-a': season.colors[0], '--season-b': season.colors[1] }}
            type="button"
          >
            <span>{season.year}</span>
            <small>{season.champion}</small>
          </button>
        ))}
      </div>

      <div className="timeline-launch-track" ref={trackRef}>
        <div className="timeline-trail" ref={trailRef} />
        <button
          aria-label="Drag to scroll the IPL timeline"
          className="timeline-ball"
          onMouseDown={startMouseBallDrag}
          onPointerDown={startBallDrag}
          onPointerMove={dragBall}
          onPointerUp={stopBallDrag}
          ref={ballRef}
          type="button"
        />
      </div>

      <SeasonModal onClose={() => setSelectedSeason(null)} season={selectedSeason} />
    </section>
  )
}

function HomePage({ onNavigate }) {
  const featuredPlayers = ['Virat Kohli', 'MS Dhoni', 'Rohit Sharma', 'Jasprit Bumrah', 'Ruturaj Gaikwad']
    .map((name) => featuredAnimations[name] ?? getPlayerAnimationProfile(name, 'India', iplTeams[0], 0, 'batter'))

  return (
    <section className="home-page">
      <section className="home-hero ipl-universe-hero" style={{ '--hero-image': `url(${heroImage})` }}>
        <IplMuseumScene />
        <div className="stadium-glow" />
        <div className="floodlight-row" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="home-hero-content">
          <span>IPL Fan Intelligence</span>
          <h1>Enter the IPL Universe</h1>
          <p>
            Relive every champion, every Orange Cap, every Purple Cap, and every unforgettable season.
          </p>
          <div className="home-actions">
            <button
              onClick={() => onNavigate('timeline')}
              type="button"
            >
              Explore IPL Timeline
            </button>
            <button onClick={() => onNavigate('dynasty')} type="button">
              Build Dream Team
            </button>
            <button onClick={() => onNavigate('auction')} type="button">
              Enter Auction Room
            </button>
            <button onClick={() => onNavigate('fan')} type="button">
              Take the Cricketer Personality Quiz
            </button>
            <button onClick={() => onNavigate('visualizations')} type="button">
              View 2026 Teams
            </button>
          </div>
        </div>
      </section>

      <section className="home-band" aria-label="Choose your IPL team">
        <div className="home-section-heading">
          <span>Choose your IPL team</span>
          <h2>Start with a squad, then inspect every player.</h2>
        </div>
        <div className="home-team-grid">
          {iplTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                onNavigate('visualizations')
                window.setTimeout(() => document.getElementById(`${team.id}-team`)?.scrollIntoView(), 80)
              }}
              style={{ '--team-accent': team.colors.accent, '--team-secondary': team.colors.secondary }}
              type="button"
            >
              <span className="home-team-logo">
                <img alt="" aria-hidden="true" src={teamLogoPaths[team.id]} />
              </span>
              <span>{team.shortName}</span>
              <strong>{team.name}</strong>
              <small>Captain: {team.captain}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="home-band split" aria-label="Product paths">
        <div>
          <span>Build a Dream Team</span>
          <h2>Create your all-time IPL Playing 12.</h2>
          <p>Select legends, assign an Impact Substitute, unlock chemistry cores, and reveal your Dream Team Score.</p>
          <button onClick={() => onNavigate('dynasty')} type="button">
            Open Dream Team
          </button>
        </div>
        <div>
          <span>Enter the IPL auction</span>
          <h2>Control a franchise in a live mega auction.</h2>
          <p>Choose one IPL team, battle bot franchises, manage a ₹120Cr purse, and organize your bought squad.</p>
          <button onClick={() => onNavigate('auction')} type="button">
            Open Auction Simulator
          </button>
        </div>
        <div>
          <span>Open the IPL timeline</span>
          <h2>Scrub every season with the cricket ball.</h2>
          <p>Move from the first title to the live-season card, then open champions, caps, venues, and defining moments.</p>
          <button onClick={() => onNavigate('timeline')} type="button">
            Open timeline
          </button>
        </div>
        <div>
          <span>Take the fan quiz</span>
          <h2>Match your pressure style to a cricketer.</h2>
          <p>Answer role, tempo, leadership, and risk questions. Your player is hidden until you submit.</p>
          <button onClick={() => onNavigate('fan')} type="button">
            Start quiz
          </button>
        </div>
        <div>
          <span>Explore player timelines</span>
          <h2>See career moments as living visual networks.</h2>
          <p>Jump into team rosters, switch players, and review debuts, trophies, comebacks, and 2026 squad context.</p>
          <button onClick={() => onNavigate('visualizations')} type="button">
            Open visualizations
          </button>
        </div>
      </section>

      <section className="home-band" aria-label="Featured player carousel">
        <div className="home-section-heading">
          <span>Featured player carousel</span>
          <h2>Fast entry points into recognizable career arcs.</h2>
        </div>
        <div className="featured-carousel">
          {featuredPlayers.map((player) => (
            <button key={player.name} onClick={() => onNavigate('visualizations', { player: player.name })} type="button">
              <span>{player.number}</span>
              <strong>{player.name}</strong>
              <small>{player.range}</small>
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}

function TimelinePage() {
  return (
    <section className="timeline-page">
      <IplHallTimeline seasons={iplSeasonTimeline} />
    </section>
  )
}


function scoreProfiles(answers) {
  const traitNames = ['calm', 'ambition', 'risk', 'creativity', 'resilience', 'leadership', 'flair', 'teamwork']
  const traitSamples = traitNames.reduce((samples, trait) => ({ ...samples, [trait]: [] }), {})
  const selectedAnswers = Object.entries(answers)
    .filter(([, optionIndex]) => optionIndex !== undefined)
    .map(([questionIndex, optionIndex]) => ({
      questionIndex: Number(questionIndex),
      optionIndex,
      option: quizQuestions[Number(questionIndex)].options[optionIndex],
    }))
  const selectedOptions = selectedAnswers.map(({ option }) => option)

  selectedOptions.forEach((option) => {
    Object.entries(option.scores).forEach(([trait, value]) => {
      traitSamples[trait].push(Math.max(0, Math.min(100, 50 + value * 2.75)))
    })
  })

  const userTraits = traitNames.reduce((traits, trait) => {
    const samples = traitSamples[trait]
    const value = samples.length
      ? Math.round(samples.reduce((total, sample) => total + sample, 0) / samples.length)
      : 50

    return { ...traits, [trait]: value }
  }, {})

  const decisiveLane = [...selectedAnswers]
    .reverse()
    .map(({ option }) => Object.entries(option.profileBoosts ?? {}).filter(([, boost]) => boost >= 55).map(([name]) => name))
    .find((names) => names.length > 0)
  const answerSignature = selectedAnswers.map(({ questionIndex, optionIndex }) => `${questionIndex}:${optionIndex}`).join('|')
  const signatureHash = [...answerSignature].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 1000003
  }, 17)
  const laneWinner = decisiveLane?.[signatureHash % decisiveLane.length]

  const optionBoostForProfile = (profile) => {
    const answerBoost = selectedOptions.reduce((boost, option) => {
      const directBoost = option.profileBoosts?.[profile.name] ?? 0
      const countryBoost = option.countryBoosts?.[profile.country] ?? 0
      const roleBoost =
        option.roleBoosts?.some((roleSignal) => profile.role.toLowerCase().includes(roleSignal.toLowerCase())) ? 8 : 0

      return boost + directBoost + countryBoost + roleBoost
    }, 0)

    if (!decisiveLane?.includes(profile.name)) {
      return answerBoost
    }

    return answerBoost + (profile.name === laneWinner ? 190 : 85)
  }

  if (!selectedOptions.length) {
    return cricketerProfiles.map((profile) => ({ ...profile, match: 50 })).sort((a, b) => a.name.localeCompare(b.name))
  }

  return cricketerProfiles
    .map((profile) => {
      const weightedDistance = traitNames.reduce((total, trait) => {
        const difference = Math.abs(userTraits[trait] - profile.traits[trait])
        const answeredWeight = traitSamples[trait].length ? 1.15 : 0.55

        return total + difference * answeredWeight
      }, 0)
      const profileBoost = optionBoostForProfile(profile)
      const score = 100 - weightedDistance / 6 + profileBoost
      const match = Math.max(1, Math.min(99, Math.round(100 - weightedDistance / 7 + Math.min(profileBoost, 40) / 4)))

      return { ...profile, match, score }
    })
    .sort((a, b) => b.match - a.match || b.score - a.score || a.name.localeCompare(b.name))
}

const resultStatConfig = [
  ['Leadership', 'leadership'],
  ['Aggression', 'flair'],
  ['Consistency', 'resilience'],
  ['Risk Taking', 'risk'],
  ['Composure', 'calm'],
]

const traitReasonLabels = {
  calm: 'Composure under pressure',
  ambition: 'High-performance standards',
  risk: 'Calculated risk taking',
  creativity: 'Creative problem solving',
  resilience: 'Consistency and resilience',
  leadership: 'Leadership presence',
  flair: 'Aggressive match-changing style',
  teamwork: 'Team-first loyalty',
}

function getResultStats(player) {
  return resultStatConfig.map(([label, trait]) => ({
    label,
    value: player.traits[trait],
  }))
}

function getBestTeamMatch(player, similarPlayers) {
  const playerNames = new Set([player.name, ...similarPlayers.map((similarPlayer) => similarPlayer.name)])
  const scoredTeams = iplTeams.map((team) => {
    const rosterNames = new Set(team.players.map(([name]) => name))
    const directMatch = rosterNames.has(player.name)
    const similarCount = [...playerNames].filter((name) => rosterNames.has(name)).length
    const captainMatch = team.captain === player.name ? 2 : 0
    const roleCount = team.players.filter(([, , role]) => player.role.toLowerCase().includes(role)).length

    return {
      team,
      score: (directMatch ? 100 : 0) + similarCount * 18 + captainMatch * 16 + roleCount,
    }
  })
  const bestTeam = scoredTeams.sort((left, right) => right.score - left.score || left.team.name.localeCompare(right.team.name))[0].team
  const topReasons = Object.entries(player.traits)
    .sort(([, leftValue], [, rightValue]) => rightValue - leftValue)
    .slice(0, 3)
    .map(([trait]) => traitReasonLabels[trait])

  return {
    team: bestTeam,
    reasons: topReasons,
  }
}

function getShareText(player, stats, teamMatch) {
  const statLines = stats.slice(0, 2).map((stat) => `${stat.label}: ${stat.value}`).join('\n')

  return `IPL Personality Result\n\nYou Are:\n${player.name}\n\n${statLines}\n\nBest Team Match:\n${teamMatch.team.name}`
}

function getWikipediaTitle(wikipediaUrl) {
  try {
    const url = new URL(wikipediaUrl)
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '')
  } catch {
    return ''
  }
}

function ResultPortrait({ player }) {
  const title = useMemo(() => getWikipediaTitle(player.wikipedia), [player.wikipedia])
  const [portrait, setPortrait] = useState({ title: '', imageUrl: '', hasError: false })
  const initials = player.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const imageUrl = portrait.title === title && !portrait.hasError ? portrait.imageUrl : ''

  useEffect(() => {
    const controller = new AbortController()

    if (!title) return () => controller.abort()

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data) => {
        const thumbnail = data?.thumbnail?.source || data?.originalimage?.source
        if (thumbnail) {
          setPortrait({ title, imageUrl: thumbnail, hasError: false })
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setPortrait({ title, imageUrl: '', hasError: true })
        }
      })

    return () => controller.abort()
  }, [title])

  return (
    <div className="result-portrait" aria-label={`${player.name} portrait`}>
      {imageUrl ? (
        <img
          alt={`${player.name} portrait`}
          src={imageUrl}
          onError={() => setPortrait({ title, imageUrl: '', hasError: true })}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

function FanPersonalityTest({ onNavigate }) {
  const { saveUserResult } = useAuth()
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === quizQuestions.length
  const results = useMemo(() => scoreProfiles(answers), [answers])
  const winner = results[0]
  const runnersUp = results.slice(1, 4)
  const resultStats = useMemo(() => getResultStats(winner), [winner])
  const teamMatch = useMemo(() => getBestTeamMatch(winner, runnersUp), [winner, runnersUp])
  const shareText = useMemo(() => getShareText(winner, resultStats, teamMatch), [winner, resultStats, teamMatch])
  const canExploreCareerStory = hasPlayerVisualization(winner.name)
  const progress = Math.round((answeredCount / quizQuestions.length) * 100)
  const revealResult = () => {
    setShowResult(true)
    setShareStatus('')
  }
  const shareResult = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'IPL Personality Result',
          text: shareText,
        })
        setShareStatus('Shared')
        return
      }

      await navigator.clipboard.writeText(shareText)
      setShareStatus('Copied')
    } catch {
      setShareStatus('Ready to copy')
    }
  }
  const saveQuizResult = async () => {
    setShareStatus('')
    try {
      await saveUserResult('quiz', {
        resultPlayer: winner.name,
        traitScores: Object.fromEntries(resultStats.map((stat) => [stat.label, stat.value])),
        bestTeamMatch: teamMatch.team.name,
        similarPlayers: runnersUp.map((player) => player.name),
        match: winner.match,
        archetype: winner.archetype,
      })
      setShareStatus('Saved')
    } catch (error) {
      setShareStatus(error?.code === 'permission-denied' ? 'Firestore blocked save' : 'Save failed')
    }
  }

  return (
    <section className="fan-stage pointer-reactive" aria-label="Cricketer personality test">
      <div className="fan-hero">
        <div>
          <span className="fan-kicker">Fan Quiz</span>
          <h1>Find your cricket twin.</h1>
          <p>Answer every prompt, then submit to reveal your match.</p>
          <div className="fan-hero-stats" aria-label="Fan test stats">
            <span>
              <strong>{cricketerProfiles.length}</strong>
              Player profiles
            </span>
            <span>
              <strong>{quizQuestions.length}</strong>
              Match prompts
            </span>
            <span>
              <strong>{progress}%</strong>
              Signal locked
            </span>
          </div>
        </div>
      </div>

      <div className="quiz-layout">
        <div className="question-stack">
          {quizQuestions.map((question, questionIndex) => (
            <article className="quiz-question" key={question.prompt} style={{ '--question-index': questionIndex }}>
              <div className="question-title">
                <span>{String(questionIndex + 1).padStart(2, '0')}</span>
                <h2>{question.prompt}</h2>
              </div>
              <div className="answer-grid">
                {question.options.map((option, optionIndex) => (
                  <button
                    className={answers[questionIndex] === optionIndex ? 'selected' : ''}
                    key={option.label}
                    onClick={() => {
                      setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))
                      setShowResult(false)
                    }}
                    type="button"
                  >
                    <span className="answer-mark" aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="result-panel">
          <div className="fan-scoreboard" aria-label="Quiz progress" style={{ '--progress': `${progress * 3.6}deg` }}>
            <div className="score-orbit">
              <strong>{answeredCount}</strong>
              <span>/ {quizQuestions.length}</span>
            </div>
            <small>{progress}% answered</small>
          </div>

          <div className="result-card">
            {showResult ? (
              <>
                <ResultPortrait player={winner} />
                <div className="result-reveal">
                  <span>You are</span>
                  <strong>{winner.name}</strong>
                </div>
                <div className="result-card-top">
                  <span>Your Match</span>
                  <a href={winner.wikipedia} rel="noreferrer" target="_blank">
                    Profile
                  </a>
                </div>
                <div className="result-player-lockup">
                  <div>
                    <strong>{winner.name}</strong>
                    <small>
                      {winner.country} · {winner.role}
                    </small>
                  </div>
                  <div className="match-ring" style={{ '--match': `${winner.match * 3.6}deg` }}>
                    <b>{winner.match}%</b>
                  </div>
                </div>
                <h2>{winner.archetype}</h2>
                <p>{winner.matchLine}</p>

                <div className="trait-signal result-stat-bars" aria-label="Result personality stats">
                  {resultStats.map((stat) => (
                    <div className="trait-row" key={stat.label}>
                      <span>{stat.label}</span>
                      <div>
                        <i style={{ width: `${stat.value}%` }} />
                      </div>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="similar-player-section">
                  <span>You are also similar to</span>
                  <div>
                    {runnersUp.map((player) => (
                      <strong key={player.name}>{player.name}</strong>
                    ))}
                  </div>
                </div>

                <div className="best-team-match" style={{ '--team-accent': teamMatch.team.colors.accent, '--team-secondary': teamMatch.team.colors.secondary }}>
                  <span>Best Team Match</span>
                  <strong>{teamMatch.team.name}</strong>
                  <small>Why</small>
                  <ul>
                    {teamMatch.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="evidence-list">
                  {winner.evidence.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                <div className="share-result-card" aria-label="Shareable result card">
                  <span>IPL Personality Result</span>
                  <small>You Are:</small>
                  <strong>{winner.name}</strong>
                  <div>
                    {resultStats.slice(0, 2).map((stat) => (
                      <p key={stat.label}>
                        {stat.label}: {stat.value}
                      </p>
                    ))}
                  </div>
                  <button onClick={shareResult} type="button">
                    {shareStatus || 'Share Result'}
                  </button>
                  <button onClick={saveQuizResult} type="button">
                    Save Quiz Result
                  </button>
                </div>
              </>
            ) : (
              <div className="result-pending">
                <span>Result Locked</span>
                <strong>
                  {answeredCount}/{quizQuestions.length}
                </strong>
                <p>{isComplete ? 'Submit when ready to reveal your cricketer.' : 'Complete every question to unlock your match.'}</p>
              </div>
            )}

            <div className="result-actions">
              <button
                disabled={!isComplete}
                onClick={revealResult}
                type="button"
              >
                Submit Quiz
              </button>
              {showResult && canExploreCareerStory && (
                <button onClick={() => onNavigate('visualizations', { player: winner.name })} type="button">
                  Explore Career Story
                </button>
              )}
              <button
                onClick={() => {
                  setAnswers({})
                  setShowResult(false)
                  setShareStatus('')
                }}
                type="button"
              >
                Reset
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="quiz-submit-dock" aria-label="Quiz submit controls">
        <div>
          <span>{showResult ? `${winner.match}% match` : `${answeredCount}/${quizQuestions.length}`}</span>
          <strong>{showResult ? winner.name : isComplete ? 'Ready to reveal' : `${quizQuestions.length - answeredCount} left`}</strong>
        </div>
        <button disabled={!isComplete} onClick={revealResult} type="button">
          {showResult ? 'Result Shown' : 'Submit Quiz'}
        </button>
      </div>

      <div className="player-cloud" aria-label="Available cricketer match pool">
        <div className="cloud-heading">
          <span>Match Pool</span>
          <strong>{cricketerProfiles.length} cricketers</strong>
        </div>
        <div className="cloud-links">
          {cricketerProfiles.map((profile) => (
            <a href={profile.wikipedia} key={profile.name} rel="noreferrer" target="_blank">
              {profile.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function App() {
  const { toast } = useAuth()
  const backdropRef = useRef(null)
  const pointerTargetRef = useRef(null)
  const pendingPointerRef = useRef(null)
  const pointerFrameRef = useRef(0)
  const getInitialView = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/fan-test') {
      return 'fan'
    }

    if (typeof window !== 'undefined' && window.location.pathname === '/timeline') {
      return 'timeline'
    }

    if (typeof window !== 'undefined' && ['/dynasty', '/dream-team'].includes(window.location.pathname)) {
      return 'dynasty'
    }

    if (typeof window !== 'undefined' && window.location.pathname === '/auction') {
      return 'auction'
    }

    if (typeof window !== 'undefined' && window.location.pathname === '/visualizations') {
      return 'visualizations'
    }

    if (typeof window !== 'undefined' && ['/hub', '/saved-results'].includes(window.location.pathname)) {
      return 'saved'
    }

    if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
      return 'profile'
    }

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/share/')) {
      return 'share'
    }

    return 'home'
  }
  const [activeView, setActiveView] = useState(getInitialView)
  const frame = usePlayback()
  const changeView = (view, options = {}) => {
    const playerQuery = options.player ? `?player=${getPlayerSlug(options.player)}` : ''
    const path =
      view === 'fan'
        ? '/fan-test'
        : view === 'timeline'
          ? '/timeline'
          : view === 'dynasty'
            ? '/dream-team'
            : view === 'auction'
              ? '/auction'
              : view === 'visualizations'
                ? `/visualizations${playerQuery}`
                : view === 'saved'
                  ? '/saved-results'
                  : view === 'profile'
                    ? '/profile'
                    : '/'
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setActiveView(view)
  }

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(
        window.location.pathname === '/fan-test'
          ? 'fan'
          : window.location.pathname === '/timeline'
            ? 'timeline'
            : ['/dynasty', '/dream-team'].includes(window.location.pathname)
              ? 'dynasty'
              : window.location.pathname === '/auction'
                ? 'auction'
                : window.location.pathname === '/visualizations'
                  ? 'visualizations'
                  : ['/hub', '/saved-results'].includes(window.location.pathname)
                    ? 'saved'
                    : window.location.pathname === '/profile'
                      ? 'profile'
                      : window.location.pathname.startsWith('/share/')
                        ? 'share'
                        : 'home',
      )
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current) {
        cancelAnimationFrame(pointerFrameRef.current)
      }
    }
  }, [])

  return (
    <main
      className="app-shell"
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return

        const target = event.target instanceof Element ? event.target.closest('.pointer-reactive') : null
        const viewportPointer = {
          x: Math.round((event.clientX / window.innerWidth) * 100),
          y: Math.round((event.clientY / window.innerHeight) * 100),
        }
        let targetPointer = null

        if (target) {
          const bounds = target.getBoundingClientRect()
          targetPointer = {
            x: Math.round(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100))),
            y: Math.round(Math.min(100, Math.max(0, ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100))),
          }
        }

        pointerTargetRef.current = target
        pendingPointerRef.current = { target: targetPointer, viewport: viewportPointer }

        if (pointerFrameRef.current) return

        pointerFrameRef.current = requestAnimationFrame(() => {
          const pointer = pendingPointerRef.current

          if (pointer?.viewport && backdropRef.current) {
            backdropRef.current.style.setProperty('--pointer-x', `${pointer.viewport.x}%`)
            backdropRef.current.style.setProperty('--pointer-y', `${pointer.viewport.y}%`)
          }

          if (pointer?.target && pointerTargetRef.current) {
            pointerTargetRef.current.style.setProperty('--pointer-x', `${pointer.target.x}%`)
            pointerTargetRef.current.style.setProperty('--pointer-y', `${pointer.target.y}%`)
          }

          pointerFrameRef.current = 0
        })
      }}
    >
      <div className="interactive-backdrop" ref={backdropRef} aria-hidden="true" />
      <nav className="player-switch" aria-label="Primary navigation">
        <button
          className={`home-nav-button${activeView === 'home' ? ' active' : ''}`}
          onClick={() => changeView('home')}
          type="button"
        >
          Home
        </button>
        <button
          className={activeView === 'timeline' ? 'active' : ''}
          onClick={() => changeView('timeline')}
          type="button"
        >
          Timeline
        </button>
        <button
          className={activeView === 'dynasty' ? 'active' : ''}
          onClick={() => changeView('dynasty')}
          type="button"
        >
          Dream Team
        </button>
        <button
          className={activeView === 'auction' ? 'active' : ''}
          onClick={() => changeView('auction')}
          type="button"
        >
          Auction
        </button>
        <button
          className={activeView === 'visualizations' ? 'active' : ''}
          onClick={() => changeView('visualizations')}
          type="button"
        >
          Visualizations
        </button>
        <button
          className={activeView === 'fan' ? 'active' : ''}
          onClick={() => changeView('fan')}
          type="button"
        >
          Fan Test
        </button>
        <AccountNav activeView={activeView} onNavigate={changeView} />
      </nav>

      {activeView === 'home' ? (
        <HomePage onNavigate={changeView} />
      ) : activeView === 'timeline' ? (
        <TimelinePage />
      ) : activeView === 'dynasty' ? (
        <IplDynastyBuilder />
      ) : activeView === 'auction' ? (
        <AuctionSimulator cricketerProfiles={cricketerProfiles} featuredAnimations={featuredAnimations} iplTeams={iplTeams} onNavigate={changeView} />
      ) : activeView === 'fan' ? (
        <FanPersonalityTest onNavigate={changeView} />
      ) : activeView === 'saved' ? (
        <CricketHub onNavigate={changeView} />
      ) : activeView === 'profile' ? (
        <ProfilePage />
      ) : activeView === 'share' ? (
        <SharePage />
      ) : (
        <VisualizationsPage frame={frame} />
      )}
      <AuthModal />
      {toast && <div className="save-toast">{toast}</div>}
    </main>
  )
}

export default App

export function RootApp() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  )
}
