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

const dynastyPlayers = [
  { name: 'MS Dhoni', nationality: 'India', overseas: false, teams: ['CSK', 'RPS'], roles: ['Wicketkeeper', 'Finisher', 'Captain'], wicketkeeper: true, runs: 5243, wickets: 0, strikeRate: 137.5, economy: null, championships: 5, awards: 8, leadership: 99, legacy: 99, accent: '#f7c948' },
  { name: 'Virat Kohli', nationality: 'India', overseas: false, teams: ['RCB'], roles: ['Batter', 'Captain'], wicketkeeper: false, runs: 8661, wickets: 4, strikeRate: 132.9, economy: 8.8, championships: 1, awards: 13, leadership: 92, legacy: 99, accent: '#da1818' },
  { name: 'Rohit Sharma', nationality: 'India', overseas: false, teams: ['DCG', 'MI'], roles: ['Batter', 'Captain'], wicketkeeper: false, runs: 6628, wickets: 15, strikeRate: 131.1, economy: 7.9, championships: 6, awards: 9, leadership: 97, legacy: 97, accent: '#2563eb' },
  { name: 'AB de Villiers', nationality: 'South Africa', overseas: true, teams: ['DD', 'RCB'], roles: ['Batter', 'Wicketkeeper'], wicketkeeper: true, runs: 5162, wickets: 0, strikeRate: 151.7, economy: null, championships: 0, awards: 9, leadership: 78, legacy: 96, accent: '#ef4444' },
  { name: 'Chris Gayle', nationality: 'West Indies', overseas: true, teams: ['KKR', 'RCB', 'PBKS'], roles: ['Batter'], wicketkeeper: false, runs: 4965, wickets: 18, strikeRate: 148.9, economy: 7.9, championships: 0, awards: 10, leadership: 70, legacy: 95, accent: '#8b5cf6' },
  { name: 'David Warner', nationality: 'Australia', overseas: true, teams: ['DD', 'SRH'], roles: ['Batter', 'Captain'], wicketkeeper: false, runs: 6565, wickets: 0, strikeRate: 139.8, economy: null, championships: 1, awards: 10, leadership: 88, legacy: 94, accent: '#f97316' },
  { name: 'Andre Russell', nationality: 'West Indies', overseas: true, teams: ['DD', 'KKR'], roles: ['All-rounder'], wicketkeeper: false, runs: 2484, wickets: 115, strikeRate: 174.0, economy: 9.3, championships: 2, awards: 8, leadership: 74, legacy: 92, accent: '#7c3aed' },
  { name: 'Sunil Narine', nationality: 'West Indies', overseas: true, teams: ['KKR'], roles: ['All-rounder', 'Spinner'], wicketkeeper: false, runs: 1534, wickets: 180, strikeRate: 165.8, economy: 6.7, championships: 3, awards: 9, leadership: 76, legacy: 94, accent: '#4b1f73' },
  { name: 'Rashid Khan', nationality: 'Afghanistan', overseas: true, teams: ['SRH', 'GT'], roles: ['Spinner', 'All-rounder'], wicketkeeper: false, runs: 545, wickets: 149, strikeRate: 165.2, economy: 6.8, championships: 1, awards: 7, leadership: 78, legacy: 91, accent: '#22d3ee' },
  { name: 'Jasprit Bumrah', nationality: 'India', overseas: false, teams: ['MI'], roles: ['Fast bowler'], wicketkeeper: false, runs: 69, wickets: 165, strikeRate: 90.8, economy: 7.3, championships: 5, awards: 8, leadership: 82, legacy: 95, accent: '#38bdf8' },
  { name: 'Lasith Malinga', nationality: 'Sri Lanka', overseas: true, teams: ['MI'], roles: ['Fast bowler'], wicketkeeper: false, runs: 88, wickets: 170, strikeRate: 88.0, economy: 7.1, championships: 4, awards: 8, leadership: 80, legacy: 96, accent: '#2563eb' },
  { name: 'Kieron Pollard', nationality: 'West Indies', overseas: true, teams: ['MI'], roles: ['All-rounder', 'Finisher'], wicketkeeper: false, runs: 3412, wickets: 69, strikeRate: 147.3, economy: 8.8, championships: 5, awards: 7, leadership: 82, legacy: 93, accent: '#1d4ed8' },
  { name: 'Hardik Pandya', nationality: 'India', overseas: false, teams: ['MI', 'GT'], roles: ['All-rounder', 'Captain'], wicketkeeper: false, runs: 2525, wickets: 64, strikeRate: 145.6, economy: 9.0, championships: 5, awards: 7, leadership: 88, legacy: 90, accent: '#60a5fa' },
  { name: 'Shane Watson', nationality: 'Australia', overseas: true, teams: ['RR', 'RCB', 'CSK'], roles: ['All-rounder'], wicketkeeper: false, runs: 3874, wickets: 92, strikeRate: 137.9, economy: 7.9, championships: 2, awards: 8, leadership: 84, legacy: 92, accent: '#facc15' },
  { name: 'Suresh Raina', nationality: 'India', overseas: false, teams: ['CSK', 'GL'], roles: ['Batter'], wicketkeeper: false, runs: 5528, wickets: 25, strikeRate: 136.7, economy: 7.4, championships: 4, awards: 8, leadership: 84, legacy: 94, accent: '#f7c948' },
  { name: 'Ravindra Jadeja', nationality: 'India', overseas: false, teams: ['RR', 'KTK', 'CSK', 'GL'], roles: ['All-rounder'], wicketkeeper: false, runs: 2959, wickets: 160, strikeRate: 129.7, economy: 7.6, championships: 5, awards: 8, leadership: 82, legacy: 92, accent: '#16a34a' },
  { name: 'Yusuf Pathan', nationality: 'India', overseas: false, teams: ['RR', 'KKR', 'SRH'], roles: ['All-rounder'], wicketkeeper: false, runs: 3204, wickets: 42, strikeRate: 142.9, economy: 7.4, championships: 3, awards: 6, leadership: 70, legacy: 86, accent: '#ec4899' },
  { name: 'KL Rahul', nationality: 'India', overseas: false, teams: ['RCB', 'SRH', 'PBKS', 'LSG', 'DC'], roles: ['Batter', 'Wicketkeeper', 'Captain'], wicketkeeper: true, runs: 4683, wickets: 0, strikeRate: 134.6, economy: null, championships: 0, awards: 6, leadership: 83, legacy: 87, accent: '#38bdf8' },
  { name: 'Jos Buttler', nationality: 'England', overseas: true, teams: ['MI', 'RR', 'GT'], roles: ['Batter', 'Wicketkeeper'], wicketkeeper: true, runs: 3582, wickets: 0, strikeRate: 147.5, economy: null, championships: 0, awards: 7, leadership: 76, legacy: 90, accent: '#fb7185' },
  { name: 'Shubman Gill', nationality: 'India', overseas: false, teams: ['KKR', 'GT'], roles: ['Batter', 'Captain'], wicketkeeper: false, runs: 3216, wickets: 0, strikeRate: 135.7, economy: null, championships: 1, awards: 6, leadership: 82, legacy: 86, accent: '#22d3ee' },
  { name: 'Ruturaj Gaikwad', nationality: 'India', overseas: false, teams: ['CSK'], roles: ['Batter', 'Captain'], wicketkeeper: false, runs: 2380, wickets: 0, strikeRate: 136.9, economy: null, championships: 2, awards: 5, leadership: 80, legacy: 84, accent: '#facc15' },
  { name: 'Yuzvendra Chahal', nationality: 'India', overseas: false, teams: ['MI', 'RCB', 'RR', 'PBKS'], roles: ['Spinner'], wicketkeeper: false, runs: 37, wickets: 221, strikeRate: 43.5, economy: 7.8, championships: 0, awards: 7, leadership: 68, legacy: 90, accent: '#ef4444' },
  { name: 'Dwayne Bravo', nationality: 'West Indies', overseas: true, teams: ['MI', 'CSK', 'GL'], roles: ['All-rounder'], wicketkeeper: false, runs: 1560, wickets: 183, strikeRate: 129.6, economy: 8.4, championships: 4, awards: 8, leadership: 82, legacy: 93, accent: '#f59e0b' },
  { name: 'Gautam Gambhir', nationality: 'India', overseas: false, teams: ['DD', 'KKR'], roles: ['Batter', 'Captain'], wicketkeeper: false, runs: 4217, wickets: 0, strikeRate: 123.9, economy: null, championships: 2, awards: 7, leadership: 94, legacy: 91, accent: '#7c3aed' },
  { name: 'Harbhajan Singh', nationality: 'India', overseas: false, teams: ['MI', 'CSK', 'KKR'], roles: ['Spinner'], wicketkeeper: false, runs: 833, wickets: 150, strikeRate: 137.9, economy: 7.1, championships: 4, awards: 6, leadership: 78, legacy: 89, accent: '#38bdf8' },
  { name: 'Bhuvneshwar Kumar', nationality: 'India', overseas: false, teams: ['PWI', 'SRH', 'RCB'], roles: ['Fast bowler'], wicketkeeper: false, runs: 321, wickets: 200, strikeRate: 94.1, economy: 7.6, championships: 1, awards: 8, leadership: 74, legacy: 90, accent: '#f97316' },
  { name: 'Suryakumar Yadav', nationality: 'India', overseas: false, teams: ['MI', 'KKR'], roles: ['Batter'], wicketkeeper: false, runs: 3594, wickets: 0, strikeRate: 145.3, economy: null, championships: 4, awards: 6, leadership: 78, legacy: 88, accent: '#60a5fa' },
  { name: 'Glenn Maxwell', nationality: 'Australia', overseas: true, teams: ['DD', 'MI', 'PBKS', 'RCB'], roles: ['All-rounder'], wicketkeeper: false, runs: 2771, wickets: 37, strikeRate: 156.7, economy: 8.3, championships: 0, awards: 6, leadership: 76, legacy: 86, accent: '#ef4444' },
]

const dynastySupplementalPlayers = [
  ['Sanju Samson', 'India', false, ['RR', 'DD'], ['Wicketkeeper', 'Batter', 'Captain'], true, 4704, 0, 139.0, null, 0, 6, 82, 88, '#ec4899'],
  ['Ishan Kishan', 'India', false, ['GL', 'MI', 'SRH'], ['Wicketkeeper', 'Batter'], true, 2644, 0, 135.9, null, 2, 5, 70, 84, '#38bdf8'],
  ['Dinesh Karthik', 'India', false, ['DD', 'PBKS', 'MI', 'RCB', 'KKR', 'GT'], ['Wicketkeeper', 'Finisher'], true, 4842, 0, 135.4, null, 1, 6, 78, 88, '#ef4444'],
  ['Robin Uthappa', 'India', false, ['MI', 'RCB', 'PWI', 'KKR', 'RR', 'CSK'], ['Wicketkeeper', 'Batter'], true, 4952, 0, 130.4, null, 2, 6, 76, 88, '#7c3aed'],
  ['Quinton de Kock', 'South Africa', true, ['SRH', 'DD', 'RCB', 'MI', 'LSG', 'KKR'], ['Wicketkeeper', 'Batter'], true, 3157, 0, 134.2, null, 1, 5, 74, 86, '#2563eb'],
  ['Rishabh Pant', 'India', false, ['DC', 'LSG'], ['Wicketkeeper', 'Batter', 'Captain'], true, 3284, 0, 148.9, null, 0, 6, 80, 87, '#38bdf8'],
  ['Jitesh Sharma', 'India', false, ['PBKS', 'RCB'], ['Wicketkeeper', 'Finisher'], true, 730, 0, 151.1, null, 0, 3, 66, 76, '#ef4444'],
  ['Dhruv Jurel', 'India', false, ['RR'], ['Wicketkeeper', 'Batter'], true, 347, 0, 151.5, null, 0, 2, 66, 74, '#ec4899'],
  ['Wriddhiman Saha', 'India', false, ['KKR', 'CSK', 'PBKS', 'SRH', 'GT'], ['Wicketkeeper', 'Batter'], true, 2934, 0, 127.9, null, 2, 4, 72, 82, '#22d3ee'],
  ['Adam Gilchrist', 'Australia', true, ['DCG', 'PBKS'], ['Wicketkeeper', 'Batter', 'Captain'], true, 2069, 0, 138.4, null, 1, 5, 88, 89, '#94a3b8'],
  ['Brendon McCullum', 'New Zealand', true, ['KKR', 'KTK', 'CSK', 'GL', 'RCB'], ['Wicketkeeper', 'Batter'], true, 2880, 0, 131.7, null, 0, 5, 82, 88, '#4b1f73'],
  ['Parthiv Patel', 'India', false, ['CSK', 'KTK', 'DCG', 'SRH', 'RCB', 'MI'], ['Wicketkeeper', 'Batter'], true, 2848, 0, 120.8, null, 3, 4, 70, 80, '#2563eb'],
  ['Yashasvi Jaiswal', 'India', false, ['RR'], ['Batter'], false, 1607, 0, 150.6, null, 0, 5, 72, 84, '#ec4899'],
  ['Abhishek Sharma', 'India', false, ['DD', 'SRH'], ['Batter', 'All-rounder'], false, 1816, 11, 155.2, 8.9, 0, 5, 70, 84, '#f97316'],
  ['Tilak Varma', 'India', false, ['MI'], ['Batter'], false, 1156, 0, 145.0, null, 0, 4, 72, 82, '#2563eb'],
  ['Sai Sudharsan', 'India', false, ['GT'], ['Batter'], false, 1507, 0, 139.2, null, 0, 5, 70, 84, '#22d3ee'],
  ['Rinku Singh', 'India', false, ['KKR'], ['Batter', 'Finisher'], false, 1099, 0, 143.3, null, 1, 5, 72, 84, '#7c3aed'],
  ['Shivam Dube', 'India', false, ['RCB', 'RR', 'CSK'], ['All-rounder', 'Batter'], false, 1859, 5, 146.7, 9.5, 2, 5, 70, 84, '#facc15'],
  ['Nitish Kumar Reddy', 'India', false, ['SRH'], ['All-rounder'], false, 388, 3, 142.9, 9.1, 0, 3, 68, 76, '#f97316'],
  ['Rahul Tewatia', 'India', false, ['RR', 'PBKS', 'DC', 'GT'], ['All-rounder', 'Finisher'], false, 1110, 32, 135.0, 7.9, 1, 4, 70, 82, '#22d3ee'],
  ['Washington Sundar', 'India', false, ['RPS', 'RCB', 'SRH', 'GT'], ['All-rounder', 'Spinner'], false, 511, 39, 120.0, 7.5, 0, 4, 70, 80, '#22d3ee'],
  ['Axar Patel', 'India', false, ['PBKS', 'DC'], ['All-rounder', 'Spinner'], false, 1653, 123, 130.9, 7.3, 0, 6, 80, 86, '#38bdf8'],
  ['Krunal Pandya', 'India', false, ['MI', 'LSG', 'RCB'], ['All-rounder', 'Spinner'], false, 1647, 76, 132.8, 7.4, 4, 5, 76, 84, '#ef4444'],
  ['Ravichandran Ashwin', 'India', false, ['CSK', 'RPS', 'PBKS', 'DC', 'RR'], ['All-rounder', 'Spinner'], false, 833, 187, 118.8, 7.1, 2, 7, 82, 90, '#facc15'],
  ['Marcus Stoinis', 'Australia', true, ['PBKS', 'RCB', 'DC', 'LSG'], ['All-rounder'], false, 1866, 43, 142.0, 9.7, 0, 5, 74, 84, '#38bdf8'],
  ['Moeen Ali', 'England', true, ['RCB', 'CSK'], ['All-rounder', 'Spinner'], false, 1162, 35, 141.5, 7.1, 2, 4, 72, 82, '#facc15'],
  ['Ben Stokes', 'England', true, ['RPS', 'RR', 'CSK'], ['All-rounder'], false, 935, 28, 123.0, 8.6, 1, 5, 86, 86, '#facc15'],
  ['Jacques Kallis', 'South Africa', true, ['RCB', 'KKR'], ['All-rounder'], false, 2427, 65, 109.2, 7.9, 2, 5, 82, 88, '#7c3aed'],
  ['Shaun Marsh', 'Australia', true, ['PBKS'], ['Batter'], false, 2477, 0, 132.7, null, 0, 4, 70, 84, '#ef4444'],
  ['Faf du Plessis', 'South Africa', true, ['CSK', 'RPS', 'RCB'], ['Batter', 'Captain'], false, 4571, 0, 136.4, null, 2, 7, 88, 90, '#ef4444'],
  ['Ajinkya Rahane', 'India', false, ['MI', 'RR', 'RPS', 'DC', 'KKR', 'CSK'], ['Batter'], false, 4642, 1, 123.4, 5.0, 2, 5, 78, 84, '#7c3aed'],
  ['Mayank Agarwal', 'India', false, ['RCB', 'DD', 'RPS', 'PBKS', 'SRH'], ['Batter'], false, 2661, 0, 133.1, null, 0, 4, 72, 80, '#f97316'],
  ['Devdutt Padikkal', 'India', false, ['RCB', 'RR', 'LSG'], ['Batter'], false, 1565, 0, 123.6, null, 0, 3, 68, 78, '#ef4444'],
  ['Prithvi Shaw', 'India', false, ['DC'], ['Batter'], false, 1892, 0, 147.5, null, 0, 4, 66, 80, '#38bdf8'],
  ['Manish Pandey', 'India', false, ['MI', 'RCB', 'PWI', 'KKR', 'SRH', 'LSG', 'DC'], ['Batter'], false, 3850, 0, 121.4, null, 1, 5, 74, 82, '#7c3aed'],
  ['Ambati Rayudu', 'India', false, ['MI', 'CSK'], ['Batter', 'Wicketkeeper'], true, 4348, 0, 127.5, null, 6, 6, 78, 88, '#facc15'],
  ['Murali Vijay', 'India', false, ['CSK', 'DD', 'PBKS'], ['Batter'], false, 2619, 0, 121.9, null, 3, 4, 70, 82, '#facc15'],
  ['Michael Hussey', 'Australia', true, ['CSK', 'MI'], ['Batter'], false, 1977, 0, 122.6, null, 2, 4, 78, 84, '#facc15'],
  ['Matthew Hayden', 'Australia', true, ['CSK'], ['Batter'], false, 1107, 0, 137.5, null, 0, 4, 76, 82, '#facc15'],
  ['Mahela Jayawardene', 'Sri Lanka', true, ['PBKS', 'KTK', 'DD'], ['Batter', 'Captain'], false, 1802, 0, 123.3, null, 0, 4, 82, 84, '#94a3b8'],
  ['Kumar Sangakkara', 'Sri Lanka', true, ['PBKS', 'DCG', 'SRH'], ['Wicketkeeper', 'Batter', 'Captain'], true, 1687, 0, 121.2, null, 0, 4, 84, 86, '#f97316'],
  ['Eoin Morgan', 'England', true, ['RCB', 'KKR', 'SRH', 'PBKS'], ['Batter', 'Captain'], false, 1405, 0, 122.6, null, 0, 4, 86, 82, '#7c3aed'],
  ['Steve Smith', 'Australia', true, ['PWI', 'RR', 'RPS', 'DC'], ['Batter', 'Captain'], false, 2485, 0, 128.1, null, 0, 4, 82, 84, '#ec4899'],
  ['Kane Williamson', 'New Zealand', true, ['SRH', 'GT'], ['Batter', 'Captain'], false, 2128, 0, 125.6, null, 0, 5, 90, 86, '#f97316'],
  ['Aiden Markram', 'South Africa', true, ['PBKS', 'SRH', 'LSG'], ['Batter', 'All-rounder'], false, 995, 2, 129.4, 8.2, 0, 3, 76, 78, '#f97316'],
  ['Nicholas Pooran', 'West Indies', true, ['MI', 'PBKS', 'SRH', 'LSG'], ['Wicketkeeper', 'Batter'], true, 1769, 0, 162.3, null, 0, 5, 74, 86, '#38bdf8'],
  ['Travis Head', 'Australia', true, ['RCB', 'SRH'], ['Batter'], false, 772, 2, 173.5, 9.5, 0, 5, 72, 82, '#f97316'],
  ['Heinrich Klaasen', 'South Africa', true, ['RR', 'RCB', 'SRH'], ['Wicketkeeper', 'Batter'], true, 997, 0, 168.3, null, 0, 5, 72, 84, '#f97316'],
  ['Phil Salt', 'England', true, ['DC', 'KKR', 'RCB'], ['Wicketkeeper', 'Batter'], true, 653, 0, 175.5, null, 1, 4, 70, 80, '#7c3aed'],
  ['Venkatesh Iyer', 'India', false, ['KKR'], ['All-rounder', 'Batter'], false, 1326, 3, 137.1, 8.8, 1, 4, 72, 82, '#7c3aed'],
  ['Riyan Parag', 'India', false, ['RR'], ['Batter', 'All-rounder'], false, 1173, 4, 135.1, 9.0, 0, 4, 72, 80, '#ec4899'],
  ['Sam Curran', 'England', true, ['PBKS', 'CSK'], ['All-rounder', 'Fast bowler'], false, 883, 59, 135.1, 9.5, 1, 4, 76, 82, '#facc15'],
  ['Cameron Green', 'Australia', true, ['MI', 'RCB'], ['All-rounder'], false, 707, 16, 153.7, 9.0, 0, 3, 74, 80, '#ef4444'],
  ['Pat Cummins', 'Australia', true, ['KKR', 'DC', 'SRH'], ['Fast bowler', 'Captain'], false, 515, 63, 152.4, 8.8, 0, 5, 88, 86, '#f97316'],
  ['Mitchell Starc', 'Australia', true, ['RCB', 'KKR', 'DC'], ['Fast bowler'], false, 103, 51, 104.0, 8.1, 1, 5, 76, 86, '#7c3aed'],
  ['Trent Boult', 'New Zealand', true, ['SRH', 'KKR', 'MI', 'RR'], ['Fast bowler'], false, 78, 121, 88.6, 8.3, 1, 5, 74, 86, '#ec4899'],
  ['Kagiso Rabada', 'South Africa', true, ['DC', 'PBKS', 'GT'], ['Fast bowler'], false, 191, 117, 103.8, 8.5, 0, 5, 72, 86, '#38bdf8'],
  ['Anrich Nortje', 'South Africa', true, ['DC', 'KKR'], ['Fast bowler'], false, 49, 60, 92.5, 8.9, 0, 3, 68, 78, '#38bdf8'],
  ['Lockie Ferguson', 'New Zealand', true, ['RPS', 'KKR', 'GT', 'RCB', 'PBKS'], ['Fast bowler'], false, 76, 46, 98.7, 8.9, 1, 3, 68, 78, '#22d3ee'],
  ['Jofra Archer', 'England', true, ['RR', 'MI'], ['Fast bowler'], false, 195, 48, 157.3, 7.4, 0, 4, 70, 82, '#ec4899'],
  ['Dale Steyn', 'South Africa', true, ['RCB', 'DCG', 'SRH', 'GL'], ['Fast bowler'], false, 167, 97, 109.1, 6.9, 0, 5, 74, 86, '#f97316'],
  ['Zaheer Khan', 'India', false, ['RCB', 'MI', 'DD'], ['Fast bowler', 'Captain'], false, 117, 102, 91.4, 7.6, 1, 5, 80, 86, '#2563eb'],
  ['Ashish Nehra', 'India', false, ['MI', 'DD', 'PWI', 'CSK', 'SRH'], ['Fast bowler'], false, 41, 106, 80.4, 7.8, 1, 4, 76, 84, '#f97316'],
  ['Mohit Sharma', 'India', false, ['CSK', 'PBKS', 'DC', 'GT'], ['Fast bowler'], false, 124, 132, 105.0, 8.7, 1, 5, 70, 82, '#22d3ee'],
  ['Mohammed Shami', 'India', false, ['KKR', 'DD', 'PBKS', 'GT', 'SRH'], ['Fast bowler'], false, 79, 127, 94.0, 8.6, 1, 5, 72, 86, '#22d3ee'],
  ['Arshdeep Singh', 'India', false, ['PBKS'], ['Fast bowler'], false, 25, 76, 78.1, 8.9, 0, 4, 68, 80, '#ef4444'],
  ['Prasidh Krishna', 'India', false, ['KKR', 'RR', 'GT'], ['Fast bowler'], false, 8, 74, 61.5, 8.7, 0, 4, 68, 80, '#22d3ee'],
  ['Harshit Rana', 'India', false, ['KKR'], ['Fast bowler'], false, 2, 25, 50.0, 9.0, 1, 3, 66, 76, '#7c3aed'],
  ['Mukesh Kumar', 'India', false, ['DC'], ['Fast bowler'], false, 7, 24, 58.3, 10.1, 0, 3, 66, 76, '#38bdf8'],
  ['Avesh Khan', 'India', false, ['RCB', 'DC', 'LSG', 'RR'], ['Fast bowler'], false, 39, 74, 111.4, 8.8, 0, 4, 68, 80, '#ec4899'],
  ['T Natarajan', 'India', false, ['PBKS', 'SRH', 'DC'], ['Fast bowler'], false, 3, 67, 37.5, 8.8, 0, 4, 68, 80, '#f97316'],
  ['Deepak Chahar', 'India', false, ['RPS', 'CSK', 'MI'], ['Fast bowler', 'All-rounder'], false, 320, 77, 135.6, 7.9, 3, 4, 70, 82, '#facc15'],
  ['Khaleel Ahmed', 'India', false, ['SRH', 'DC', 'CSK'], ['Fast bowler'], false, 1, 74, 25.0, 8.8, 0, 3, 66, 78, '#facc15'],
  ['Umesh Yadav', 'India', false, ['DD', 'KKR', 'RCB', 'DC', 'GT'], ['Fast bowler'], false, 208, 144, 108.9, 8.5, 0, 5, 70, 84, '#7c3aed'],
  ['Ishant Sharma', 'India', false, ['KKR', 'DCG', 'SRH', 'RPS', 'PBKS', 'DC'], ['Fast bowler'], false, 58, 94, 92.1, 8.1, 0, 4, 72, 82, '#38bdf8'],
  ['Sandeep Sharma', 'India', false, ['PBKS', 'SRH', 'RR'], ['Fast bowler'], false, 54, 137, 82.0, 7.9, 0, 4, 68, 82, '#ec4899'],
  ['Ravi Bishnoi', 'India', false, ['PBKS', 'LSG'], ['Spinner'], false, 34, 63, 87.2, 7.8, 0, 4, 68, 80, '#38bdf8'],
  ['Kuldeep Yadav', 'India', false, ['KKR', 'DC'], ['Spinner'], false, 183, 87, 113.0, 8.2, 0, 5, 72, 84, '#38bdf8'],
  ['Varun Chakravarthy', 'India', false, ['PBKS', 'KKR'], ['Spinner'], false, 55, 83, 90.1, 7.6, 1, 5, 70, 84, '#7c3aed'],
  ['Piyush Chawla', 'India', false, ['PBKS', 'KKR', 'CSK', 'MI'], ['Spinner'], false, 609, 192, 111.7, 7.9, 3, 5, 72, 86, '#2563eb'],
  ['Amit Mishra', 'India', false, ['DD', 'DCG', 'SRH', 'LSG'], ['Spinner'], false, 381, 174, 91.4, 7.4, 0, 5, 70, 86, '#38bdf8'],
  ['Imran Tahir', 'South Africa', true, ['DD', 'RPS', 'CSK'], ['Spinner'], false, 33, 82, 89.2, 7.8, 1, 5, 70, 84, '#facc15'],
  ['Muttiah Muralitharan', 'Sri Lanka', true, ['CSK', 'KTK', 'RCB'], ['Spinner'], false, 21, 63, 70.0, 6.7, 1, 4, 74, 86, '#facc15'],
  ['Pragyan Ojha', 'India', false, ['DCG', 'MI'], ['Spinner'], false, 89, 89, 91.7, 7.4, 2, 4, 68, 82, '#2563eb'],
  ['Sohail Tanvir', 'Pakistan', true, ['RR'], ['Fast bowler'], false, 36, 22, 124.1, 6.5, 1, 4, 68, 82, '#ec4899'],
  ['Morne Morkel', 'South Africa', true, ['RR', 'DD', 'KKR'], ['Fast bowler'], false, 91, 77, 86.7, 7.7, 0, 4, 70, 82, '#7c3aed'],
  ['Andrew Tye', 'Australia', true, ['CSK', 'GL', 'PBKS', 'RR', 'LSG'], ['Fast bowler'], false, 91, 42, 110.9, 8.6, 0, 3, 66, 78, '#ef4444'],
  ['Jaydev Unadkat', 'India', false, ['KKR', 'RCB', 'DD', 'RPS', 'RR', 'MI', 'LSG', 'SRH'], ['Fast bowler'], false, 205, 99, 119.2, 8.9, 0, 4, 68, 78, '#f97316'],
  ['Shardul Thakur', 'India', false, ['PBKS', 'RPS', 'CSK', 'DC', 'KKR', 'LSG'], ['Fast bowler', 'All-rounder'], false, 307, 94, 139.5, 9.2, 2, 4, 70, 82, '#facc15'],
  ['Lendl Simmons', 'West Indies', true, ['MI'], ['Batter'], false, 1079, 0, 126.6, null, 2, 3, 68, 78, '#2563eb'],
  ['Dwayne Smith', 'West Indies', true, ['MI', 'DCG', 'CSK', 'GL'], ['All-rounder', 'Batter'], false, 2385, 26, 135.2, 8.4, 2, 4, 70, 82, '#facc15'],
  ['Evin Lewis', 'West Indies', true, ['MI', 'RR', 'LSG'], ['Batter'], false, 654, 0, 138.0, null, 0, 3, 66, 76, '#ec4899'],
  ['Rahul Tripathi', 'India', false, ['RPS', 'RR', 'KKR', 'SRH', 'CSK'], ['Batter'], false, 2236, 0, 138.5, null, 0, 4, 70, 80, '#facc15'],
  ['Shreyas Iyer', 'India', false, ['DC', 'KKR', 'PBKS'], ['Batter', 'Captain'], false, 3127, 0, 127.5, null, 1, 6, 84, 86, '#ef4444'],
  ['Nitish Rana', 'India', false, ['MI', 'KKR', 'RR'], ['Batter'], false, 2636, 10, 135.0, 8.8, 2, 4, 72, 82, '#7c3aed'],
  ['Shikhar Dhawan', 'India', false, ['DD', 'MI', 'DCG', 'SRH', 'PBKS'], ['Batter', 'Captain'], false, 6769, 4, 127.1, 8.5, 1, 8, 82, 92, '#f97316'],
  ['Ajit Agarkar', 'India', false, ['KKR', 'DD'], ['Fast bowler'], false, 179, 29, 120.0, 8.8, 0, 2, 66, 74, '#7c3aed'],
  ['Albie Morkel', 'South Africa', true, ['CSK', 'RCB', 'DD', 'RPS'], ['All-rounder'], false, 974, 85, 141.9, 8.1, 2, 4, 72, 84, '#facc15'],
  ['Doug Bollinger', 'Australia', true, ['CSK'], ['Fast bowler'], false, 21, 37, 84.0, 7.2, 2, 3, 66, 78, '#facc15'],
  ['RP Singh', 'India', false, ['DCG', 'KTK', 'MI', 'RCB', 'RPS'], ['Fast bowler'], false, 52, 90, 89.7, 7.9, 1, 4, 68, 82, '#94a3b8'],
  ['Parthiv Singh', 'India', false, ['RR'], ['Batter'], false, 150, 0, 120.0, null, 1, 1, 55, 64, '#ec4899'],
].map(([name, nationality, overseas, teams, roles, wicketkeeper, runs, wickets, strikeRate, economy, championships, awards, leadership, legacy, accent]) => ({
  name,
  nationality,
  overseas,
  teams,
  roles,
  wicketkeeper,
  runs,
  wickets,
  strikeRate,
  economy,
  championships,
  awards,
  leadership,
  legacy,
  accent,
}))

const dynastyPlayerPool = [...dynastyPlayers, ...dynastySupplementalPlayers]

const dynastyChemistryRules = [
  { players: ['MS Dhoni', 'Suresh Raina'], name: 'CSK Core', description: 'Dhoni and Raina bring the original Chennai title spine.' },
  { players: ['Virat Kohli', 'AB de Villiers'], name: 'RCB Firepower', description: 'Kohli and AB unlock elite chase pressure and 360-degree scoring.' },
  { players: ['Rohit Sharma', 'Jasprit Bumrah'], name: 'MI Dynasty', description: 'Rohit leadership plus Bumrah control mirrors Mumbai peak years.' },
  { players: ['Sunil Narine', 'Andre Russell'], name: 'KKR X-Factor', description: 'Narine and Russell give mystery spin and late-over destruction.' },
  { players: ['MS Dhoni', 'Ravindra Jadeja'], name: 'CSK Finishers', description: 'Dhoni and Jadeja add finishing nerve, fielding, and title memory.' },
  { players: ['David Warner', 'Rashid Khan'], name: 'SRH Golden Era', description: 'Warner tempo and Rashid control recreate Hyderabad balance.' },
  { players: ['Shubman Gill', 'Rashid Khan'], name: 'GT Rise', description: 'Gill and Rashid connect modern Gujarat structure and star power.' },
]

const dynastyBenchmarks = [
  { name: 'Chennai Super Kings 2011', batting: 82, bowling: 78, titles: 84, legacy: 90 },
  { name: 'Mumbai Indians 2020', batting: 90, bowling: 92, titles: 96, legacy: 95 },
  { name: 'Rajasthan Royals 2008', batting: 76, bowling: 74, titles: 74, legacy: 88 },
  { name: 'Gujarat Titans 2022', batting: 79, bowling: 84, titles: 76, legacy: 82 },
  { name: 'Kolkata Knight Riders 2024', batting: 88, bowling: 86, titles: 88, legacy: 87 },
]

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
          <span>{team.shortName}</span>
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

function clampScore(value) {
  return Math.max(0, Math.min(99, Math.round(value)))
}

function getDynastyStats(selectedPlayers) {
  if (!selectedPlayers.length) {
    return {
      battingPower: 0,
      bowlingThreat: 0,
      leadership: 0,
      experience: 0,
      championshipDna: 0,
      flexibility: 0,
      legacy: 0,
      overseasPower: 0,
      matchWinning: 0,
      dynastyScore: 0,
      identity: 'Dream Team Loading',
      chemistry: [],
      totals: { runs: 0, wickets: 0, titles: 0, awards: 0 },
      comparisons: [],
    }
  }

  const selectedNames = new Set(selectedPlayers.map((player) => player.name))
  const totals = selectedPlayers.reduce(
    (total, player) => ({
      runs: total.runs + player.runs,
      wickets: total.wickets + player.wickets,
      titles: total.titles + player.championships,
      awards: total.awards + player.awards,
    }),
    { runs: 0, wickets: 0, titles: 0, awards: 0 },
  )
  const avg = (selector) => selectedPlayers.reduce((total, player) => total + selector(player), 0) / selectedPlayers.length
  const battingPower = clampScore(avg((player) => Math.min(99, player.runs / 85 + player.strikeRate / 2.4)))
  const bowlingThreat = clampScore(avg((player) => Math.min(99, player.wickets / 2.2 + (player.economy ? Math.max(0, 9.8 - player.economy) * 7 : 0))))
  const leadership = clampScore(avg((player) => player.leadership))
  const experience = clampScore(avg((player) => Math.min(99, player.runs / 110 + player.wickets / 3 + player.awards * 5)))
  const championshipDna = clampScore(Math.min(99, totals.titles * 4.2 + avg((player) => player.championships * 9)))
  const flexibility = clampScore(avg((player) => player.roles.length * 22 + (player.wicketkeeper ? 10 : 0)))
  const legacy = clampScore(avg((player) => player.legacy))
  const overseasPlayers = selectedPlayers.filter((player) => player.overseas)
  const overseasPower = clampScore(overseasPlayers.length ? avg((player) => (player.overseas ? player.legacy + player.strikeRate / 8 : 55)) : 42)
  const matchWinning = clampScore(avg((player) => player.legacy * 0.42 + player.awards * 4.2 + player.championships * 4.8))
  const chemistry = dynastyChemistryRules.filter((rule) => rule.players.every((playerName) => selectedNames.has(playerName)))
  const roleCounts = selectedPlayers.reduce((counts, player) => {
    player.roles.forEach((role) => {
      const key = role.toLowerCase()
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, {})
  const wicketkeepers = selectedPlayers.filter((player) => player.wicketkeeper).length
  const dynastyScore = clampScore(
    battingPower * 0.16 +
      bowlingThreat * 0.15 +
      leadership * 0.11 +
      experience * 0.11 +
      championshipDna * 0.14 +
      flexibility * 0.09 +
      legacy * 0.13 +
      overseasPower * 0.05 +
      matchWinning * 0.12 +
      chemistry.length * 2.5,
  )
  let identity = 'IPL Legends XI'
  if (wicketkeepers >= 4) identity = 'Keeper Chaos XI'
  else if ((roleCounts['all-rounder'] ?? 0) >= 5) identity = 'All-Rounder Army'
  else if ((roleCounts['spinner'] ?? 0) >= 3) identity = 'Spin Web XI'
  else if ((roleCounts['fast bowler'] ?? 0) >= 3) identity = 'Pace Attack XI'
  else if (overseasPlayers.length === 4 && overseasPower >= 86) identity = 'Overseas Powerhouse'
  else if (battingPower >= 86 && bowlingThreat < 78) identity = 'Batting Superteam'
  else if (bowlingThreat >= 86 && battingPower < 82) identity = 'Bowling Fortress'
  else if (leadership >= 88) identity = 'Captaincy Dynasty'
  else if (selectedPlayers.filter((player) => player.name.includes('Gill') || player.name.includes('Ruturaj') || player.name.includes('Rashid')).length >= 3) identity = 'Modern Era Superteam'

  const closest = dynastyBenchmarks
    .map((team) => ({
      ...team,
      distance:
        Math.abs(team.batting - battingPower) +
        Math.abs(team.bowling - bowlingThreat) +
        Math.abs(team.titles - championshipDna) +
        Math.abs(team.legacy - legacy),
    }))
    .sort((left, right) => left.distance - right.distance)[0]
  const weakerBatting = dynastyBenchmarks.filter((team) => battingPower > team.batting).sort((left, right) => right.batting - left.batting)[0]
  const weakerTitles = dynastyBenchmarks.filter((team) => championshipDna > team.titles).sort((left, right) => right.titles - left.titles)[0]

  return {
    battingPower,
    bowlingThreat,
    leadership,
    experience,
    championshipDna,
    flexibility,
    legacy,
    overseasPower,
    matchWinning,
    dynastyScore,
    identity,
    chemistry,
    totals,
    comparisons: [
      ['Comparable To', closest.name],
      ['Stronger Batting Than', weakerBatting?.name ?? 'Elite IPL benchmark'],
      ['More Championship DNA Than', weakerTitles?.name ?? 'Modern title challengers'],
    ],
  }
}

const dynastyCategories = [
  ['all', 'All'],
  ['wicketkeepers', 'Wicketkeepers'],
  ['batters', 'Batters'],
  ['allrounders', 'All-Rounders'],
  ['bowlers', 'Bowlers'],
]

const dynastySortOptions = [
  ['dynasty', 'Dream Team Score'],
  ['runs', 'IPL Runs'],
  ['wickets', 'IPL Wickets'],
  ['championships', 'Championships'],
  ['alpha', 'Alphabetical'],
]

const quickDynastyBuilds = {
  'Build CSK Dream Team': ['MS Dhoni', 'Suresh Raina', 'Ravindra Jadeja', 'Ruturaj Gaikwad', 'Shane Watson', 'Dwayne Bravo', 'Faf du Plessis', 'Michael Hussey', 'Deepak Chahar', 'Harbhajan Singh', 'Ravichandran Ashwin', 'Shivam Dube'],
  'Build MI Dream Team': ['Rohit Sharma', 'Jasprit Bumrah', 'Kieron Pollard', 'Hardik Pandya', 'Suryakumar Yadav', 'Ishan Kishan', 'Lasith Malinga', 'Trent Boult', 'Harbhajan Singh', 'Ambati Rayudu', 'Lendl Simmons', 'Krunal Pandya'],
  'Build RCB Legends': ['Virat Kohli', 'AB de Villiers', 'Chris Gayle', 'KL Rahul', 'Faf du Plessis', 'Glenn Maxwell', 'Yuzvendra Chahal', 'Dinesh Karthik', 'Bhuvneshwar Kumar', 'Washington Sundar', 'Mayank Agarwal', 'Devdutt Padikkal'],
  'Build KKR Core': ['Gautam Gambhir', 'Sunil Narine', 'Andre Russell', 'Shreyas Iyer', 'Rinku Singh', 'Venkatesh Iyer', 'Varun Chakravarthy', 'Harshit Rana', 'Dwayne Bravo', 'Robin Uthappa', 'Jacques Kallis', 'Manish Pandey'],
  'Build Modern IPL XI': ['Shubman Gill', 'Yashasvi Jaiswal', 'Sai Sudharsan', 'Suryakumar Yadav', 'Rishabh Pant', 'Hardik Pandya', 'Ravindra Jadeja', 'Rashid Khan', 'Jasprit Bumrah', 'Arshdeep Singh', 'Kuldeep Yadav', 'Rinku Singh'],
}

function getDynastyPlayerScore(player) {
  return clampScore(
    Math.min(30, player.runs / 260) +
      Math.min(30, player.wickets / 7) +
      player.championships * 4 +
      player.awards * 2 +
      player.leadership * 0.12 +
      player.legacy * 0.2 +
      (player.wicketkeeper ? 3 : 0),
  )
}

function getDynastyCategory(player) {
  const roleText = player.roles.join(' ').toLowerCase()
  if (player.wicketkeeper) return 'wicketkeepers'
  if (roleText.includes('all-rounder')) return 'allrounders'
  if (roleText.includes('bowler') || roleText.includes('spinner')) return 'bowlers'
  return 'batters'
}

function IplDynastyBuilder() {
  const [lineupNames, setLineupNames] = useState(Array(12).fill(''))
  const [selectedCardName, setSelectedCardName] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('dynasty')
  const [shareStatus, setShareStatus] = useState('')
  const selectedNames = lineupNames.filter(Boolean)
  const selectedPlayers = useMemo(
    () => selectedNames.map((name) => dynastyPlayerPool.find((player) => player.name === name)).filter(Boolean),
    [lineupNames],
  )
  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const sortedPlayers = [...dynastyPlayerPool]
      .filter((player) => category === 'all' || getDynastyCategory(player) === category)
      .filter((player) => {
        if (!normalizedQuery) return true
        return [player.name, player.nationality, player.teams.join(' '), player.roles.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .sort((left, right) => {
        if (sortBy === 'runs') return right.runs - left.runs || left.name.localeCompare(right.name)
        if (sortBy === 'wickets') return right.wickets - left.wickets || left.name.localeCompare(right.name)
        if (sortBy === 'championships') return right.championships - left.championships || left.name.localeCompare(right.name)
        if (sortBy === 'alpha') return left.name.localeCompare(right.name)
        return getDynastyPlayerScore(right) - getDynastyPlayerScore(left) || left.name.localeCompare(right.name)
      })

    return sortedPlayers
  }, [category, query, sortBy])
  const overseasCount = selectedPlayers.filter((player) => player.overseas).length
  const wicketkeeperCount = selectedPlayers.filter((player) => player.wicketkeeper).length
  const impactName = lineupNames[11]
  const isValid = selectedPlayers.length === 12 && overseasCount <= 4 && wicketkeeperCount >= 1 && Boolean(impactName)
  const dynastyStats = useMemo(() => getDynastyStats(selectedPlayers), [selectedPlayers])
  const startingXi = lineupNames.slice(0, 11).map((name) => dynastyPlayerPool.find((player) => player.name === name)).filter(Boolean)
  const impactPlayer = dynastyPlayerPool.find((player) => player.name === impactName)
  const validationMessages = [
    selectedPlayers.length < 12 ? `Select ${12 - selectedPlayers.length} more player${12 - selectedPlayers.length === 1 ? '' : 's'} to complete your Dream Team.` : '',
    selectedPlayers.length > 12 ? 'Remove players until the squad has exactly 12.' : '',
    overseasCount > 4 ? 'Maximum 4 overseas players allowed.' : '',
    wicketkeeperCount < 1 ? 'Add at least one wicketkeeper.' : '',
    !impactName ? 'Choose one player as the Impact Substitute.' : '',
  ].filter(Boolean)

  const selectPlayerCard = (player) => {
    setShareStatus('')
    setSelectedCardName((current) => (current === player.name ? '' : player.name))
  }

  const assignSlot = (slotIndex) => {
    setShareStatus('')
    setLineupNames((current) => {
      const existingName = current[slotIndex]

      if (!selectedCardName) {
        const next = [...current]
        next[slotIndex] = ''
        return next
      }

      if (current.includes(selectedCardName) && existingName !== selectedCardName) return current

      if (existingName && existingName !== selectedCardName) {
        const shouldReplace = window.confirm(`Replace ${existingName} with ${selectedCardName}?`)
        if (!shouldReplace) return current
      }

      const next = current.map((name) => (name === selectedCardName ? '' : name))
      next[slotIndex] = selectedCardName
      return next
    })
    setSelectedCardName('')
  }

  const assignSlotWithName = (slotIndex, playerName) => {
    setShareStatus('')
    setLineupNames((current) => {
      if (!playerName || (current.includes(playerName) && current[slotIndex] !== playerName)) return current
      const next = current.map((name) => (name === playerName ? '' : name))
      next[slotIndex] = playerName
      return next
    })
    setSelectedCardName('')
  }

  const applyQuickBuild = (names) => {
    const availableNames = names.filter((name) => dynastyPlayerPool.some((player) => player.name === name)).slice(0, 12)
    setLineupNames([...availableNames, ...Array(12 - availableNames.length).fill('')])
    setSelectedCardName('')
    setShareStatus('')
  }

  const shareText = `IPL Dream Team Builder\n\nTeam: My IPL Dream Team\nScore: ${dynastyStats.dynastyScore}\nIdentity: ${dynastyStats.identity}\nChemistry: ${dynastyStats.chemistry.length}\nTitles Represented: ${dynastyStats.totals.titles}`

  const shareDynasty = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My IPL Dream Team', text: shareText })
        setShareStatus('Shared')
        return
      }
      await navigator.clipboard.writeText(shareText)
      setShareStatus('Copied')
    } catch {
      setShareStatus('Ready')
    }
  }

  const downloadDynastyCard = () => {
    const blob = new Blob([shareText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-ipl-dream-team.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="dynasty-page pointer-reactive" aria-label="IPL Dream Team Builder">
      <div className="dynasty-hero">
        <span>IPL Dream Team Builder</span>
        <h1>Assemble the greatest IPL Playing 12 of all time.</h1>
        <p>No batting-order rules. No role locks. Build a legendary dream team, assign one Impact Substitute, and let the score reveal the team identity.</p>
      </div>

      <div className="dynasty-layout">
        <aside className="dynasty-board">
          <div className="dynasty-score-card">
            <span>Dream Team Score</span>
            <strong>{isValid ? dynastyStats.dynastyScore : '--'}</strong>
            <small>{isValid ? dynastyStats.identity : 'Complete a valid Playing 12'}</small>
          </div>

          <div className="dynasty-validation">
            <div><span>Players Selected</span><strong>{selectedPlayers.length}/12</strong></div>
            <div><span>Overseas Players</span><strong>{overseasCount}/4</strong></div>
            <div><span>Wicketkeepers</span><strong>{wicketkeeperCount}</strong></div>
          </div>

          <div className="dynasty-messages">
            {validationMessages.length ? validationMessages.map((message) => <span key={message}>{message}</span>) : <strong>Dream Team valid. Reveal the result below.</strong>}
          </div>

          <div className="lineup-board">
            <div className="lineup-heading">
              <span>Starting XI</span>
              <small>{startingXi.length}/11</small>
            </div>
            <div className="lineup-slots">
              {lineupNames.slice(0, 11).map((name, index) => {
                const player = dynastyPlayerPool.find((poolPlayer) => poolPlayer.name === name)
                return (
                  <button
                    className={[player ? 'filled' : '', selectedCardName ? 'assignable' : '', player?.name === selectedCardName ? 'selected-slot' : ''].filter(Boolean).join(' ')}
                    key={index}
                    onClick={() => assignSlot(index)}
                    draggable={Boolean(player)}
                    onDragStart={(event) => player && event.dataTransfer.setData('text/plain', player.name)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      {player && <em>{player.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</em>}
                      <strong>{player?.name ?? 'Assign'}</strong>
                      {player && <small>{player.teams.join(' · ')} · {player.championships}x titles</small>}
                    </div>
                  </button>
                )
              })}
            </div>
            <div
              className={`impact-zone ${impactPlayer ? 'filled' : ''} ${selectedCardName ? 'assignable' : ''}`}
              onClick={() => assignSlot(11)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const droppedName = event.dataTransfer.getData('text/plain')
                assignSlotWithName(11, droppedName)
              }}
            >
              <span>Impact Substitute</span>
              <div>
                {impactPlayer && <em>{impactPlayer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</em>}
                <strong>{impactPlayer?.name ?? 'Assign Impact Substitute'}</strong>
                {impactPlayer && <small>{impactPlayer.teams.join(' · ')} · {impactPlayer.championships}x titles</small>}
              </div>
            </div>
          </div>
        </aside>

        <div className="dynasty-player-market">
          <div className="dynasty-toolbar">
            <div>
              <span>Legend Market</span>
              <strong>{filteredPlayers.length} of {dynastyPlayerPool.length} players</strong>
            </div>
            <input aria-label="Search IPL legends" onChange={(event) => setQuery(event.target.value)} placeholder="Search players, roles, teams" value={query} />
          </div>

          <div className="dynasty-controls" aria-label="Dream Team filters">
            <div className="dynasty-tabs">
              {dynastyCategories.map(([value, label]) => (
                <button className={category === value ? 'active' : ''} key={value} onClick={() => setCategory(value)} type="button">
                  {label}
                </button>
              ))}
            </div>
            <label>
              Sort
              <select aria-label="Sort dynasty players" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
                {dynastySortOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="quick-builds" aria-label="Quick Dream Team builds">
            {Object.entries(quickDynastyBuilds).map(([label, names]) => (
              <button key={label} onClick={() => applyQuickBuild(names)} type="button">
                {label}
              </button>
            ))}
          </div>

          {selectedCardName && (
            <div className="assignment-hint">
              <strong>{selectedCardName}</strong>
              <span>selected. Click any glowing lineup slot to assign or replace.</span>
            </div>
          )}

          <div className="dynasty-player-grid">
            {filteredPlayers.map((player) => {
              const selected = selectedNames.includes(player.name)
              const pending = selectedCardName === player.name
              return (
                <button
                  className={[selected ? 'selected' : '', pending ? 'pending' : '', 'dynasty-player-card'].filter(Boolean).join(' ')}
                  key={player.name}
                  onClick={() => selectPlayerCard(player)}
                  style={{ '--player-accent': player.accent }}
                  type="button"
                >
                  <div className="dynasty-player-image" aria-hidden="true">
                    <span>{player.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="dynasty-card-copy">
                    <span>{player.overseas ? 'Overseas' : 'Indian'} · {player.nationality}</span>
                    <strong>{player.name}</strong>
                    <small>{player.teams.join(' · ')}</small>
                  </div>
                  <div className="dynasty-card-badges">
                    {player.championships > 0 && <span>{player.championships}x IPL</span>}
                    {player.wicketkeeper && <span>WK</span>}
                    <span>{getDynastyPlayerScore(player)} DS</span>
                  </div>
                  <dl>
                    <div><dt>Runs</dt><dd>{player.runs.toLocaleString()}</dd></div>
                    <div><dt>Wkts</dt><dd>{player.wickets}</dd></div>
                    <div><dt>SR</dt><dd>{player.strikeRate}</dd></div>
                    <div><dt>Legacy</dt><dd>{player.legacy}</dd></div>
                  </dl>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {isValid && (
        <section className="dynasty-results" aria-label="My IPL Dream Team results">
          <div className="dynasty-results-header">
            <span>My IPL Dream Team</span>
            <h2>{dynastyStats.identity}</h2>
            <strong>{dynastyStats.dynastyScore}</strong>
          </div>
          <div className="dynasty-result-grid">
            <div>
              <span>Starting XI</span>
              <p>{startingXi.map((player) => player.name).join(', ')}</p>
            </div>
            <div>
              <span>Impact Substitute</span>
            <p>{impactPlayer.name}</p>
            </div>
            <div className="dynasty-meters">
              {[
                ['Batting Power', dynastyStats.battingPower],
                ['Bowling Threat', dynastyStats.bowlingThreat],
                ['Leadership', dynastyStats.leadership],
                ['Championship DNA', dynastyStats.championshipDna],
                ['Chemistry Rating', clampScore(dynastyStats.chemistry.length * 18 + dynastyStats.flexibility * 0.45)],
              ].map(([label, value]) => (
                <div className="dynasty-meter" key={label}>
                  <span>{label}</span>
                  <i><b style={{ width: `${value}%` }} /></i>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="dynasty-totals">
              <div><span>Combined IPL Runs</span><strong>{dynastyStats.totals.runs.toLocaleString()}</strong></div>
              <div><span>Combined IPL Wickets</span><strong>{dynastyStats.totals.wickets}</strong></div>
              <div><span>Combined IPL Titles</span><strong>{dynastyStats.totals.titles}</strong></div>
              <div><span>Combined Awards</span><strong>{dynastyStats.totals.awards}</strong></div>
            </div>
          </div>

          <div className="chemistry-panel">
            <span>Chemistry Bonuses</span>
            {dynastyStats.chemistry.length ? (
              dynastyStats.chemistry.map((bonus) => (
                <div key={bonus.name}>
                  <strong>Chemistry Activated: {bonus.name}</strong>
                  <p>{bonus.description}</p>
                </div>
              ))
            ) : (
            <p>No famous core activated yet, but the Dream Team is still valid.</p>
            )}
          </div>

          <div className="comparison-panel">
            {dynastyStats.comparisons.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="dynasty-share-card">
            <span>Shareable Dream Team Card</span>
            <h2>My IPL Dream Team</h2>
            <strong>{dynastyStats.dynastyScore}</strong>
            <p>{dynastyStats.identity}</p>
            <small>{dynastyStats.chemistry.length} chemistry bonuses · {dynastyStats.totals.titles} championships represented</small>
            <div>
              <button onClick={shareDynasty} type="button">{shareStatus || 'Share Result'}</button>
              <button onClick={downloadDynastyCard} type="button">Download Card</button>
            </div>
          </div>
        </section>
      )}
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

    if (typeof window !== 'undefined' && window.location.pathname === '/visualizations') {
      return 'visualizations'
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
            : view === 'visualizations'
              ? `/visualizations${playerQuery}`
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
              : window.location.pathname === '/visualizations'
                ? 'visualizations'
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
      </nav>

      {activeView === 'home' ? (
        <HomePage onNavigate={changeView} />
      ) : activeView === 'timeline' ? (
        <TimelinePage />
      ) : activeView === 'dynasty' ? (
        <IplDynastyBuilder />
      ) : activeView === 'fan' ? (
        <FanPersonalityTest onNavigate={changeView} />
      ) : (
        <VisualizationsPage frame={frame} />
      )}
    </main>
  )
}

export default App

export function RootApp() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  )
}
