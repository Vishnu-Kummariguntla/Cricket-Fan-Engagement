import { Component, useEffect, useMemo, useState } from 'react'
import './App.css'
import { cricketerProfiles, quizQuestions } from './cricketerProfiles'

const players = {
  kohli: {
    name: 'Virat Kohli',
    number: '18',
    subtitle: 'Career, influence, legacy',
    theme: 'kohli',
    range: '2008-2024',
    nodes: [
      { title: 'Delhi early life', year: '1988', tag: 'Origin', x: 17, y: 56, frame: 40 },
      { title: 'U19 World Cup', year: '2008', tag: 'Launch', x: 13, y: 30, frame: 80 },
      { title: 'India national team', year: '2008', tag: 'India', x: 31, y: 16, frame: 120 },
      { title: 'ODI World Cup', year: '2011', tag: 'Champion', x: 45, y: 11, frame: 170 },
      { title: 'Champions Trophy', year: '2013', tag: 'Champion', x: 56, y: 13, frame: 210 },
      { title: 'RCB captain era', year: '2013', tag: 'Franchise', x: 73, y: 24, frame: 250 },
      { title: 'AB partnership', year: '2016', tag: 'Network', x: 82, y: 47, frame: 300 },
      { title: 'Pressure knocks', year: '2022', tag: 'Rivalry', x: 76, y: 70, frame: 350 },
      { title: 'Records and consistency', year: '2023', tag: 'Data', x: 54, y: 82, frame: 400 },
      { title: 'Global influence', year: '2023', tag: 'Fans', x: 32, y: 79, frame: 450 },
      { title: 'T20 WC legacy moment', year: '2024', tag: 'Legacy', x: 50, y: 38, frame: 500 },
    ],
    bars: [
      { year: '2008', label: 'U19', value: 31, frame: 60 },
      { year: '2011', label: 'WC', value: 48, frame: 105 },
      { year: '2013', label: 'CT', value: 58, frame: 150 },
      { year: '2016', label: 'RCB peak', value: 82, frame: 195 },
      { year: '2018', label: 'Awards', value: 92, frame: 240 },
      { year: '2022', label: '82* Pak', value: 77, frame: 285 },
      { year: '2023', label: 'ODI 100s', value: 96, frame: 330 },
      { year: '2024', label: 'T20 WC', value: 90, frame: 375 },
    ],
    portals: [
      'Sports documentary',
      'Hall of fame',
      'ESPN visualization',
      'Legacy analysis',
      'Fan engagement',
      'AI storytelling',
    ],
  },
  pandey: {
    name: 'Manish Pandey',
    number: '37',
    subtitle: 'Influential events timeline',
    theme: 'pandey',
    range: '2004-2024',
    nodes: [
      { title: 'Bangalore pathway', year: '2004', tag: 'Foundation', x: 18, y: 57, frame: 40 },
      { title: 'India U19 World Cup', year: '2008', tag: 'Launch', x: 14, y: 32, frame: 80 },
      { title: 'First Indian IPL 100', year: '2009', tag: 'Breakthrough', x: 29, y: 17, frame: 120 },
      { title: 'Karnataka run machine', year: '2010', tag: 'Domestic', x: 44, y: 12, frame: 160 },
      { title: 'KKR final 94', year: '2014', tag: 'Title', x: 59, y: 15, frame: 205 },
      { title: 'India debut', year: '2015', tag: 'International', x: 74, y: 27, frame: 250 },
      { title: 'Sydney 104*', year: '2016', tag: 'Signature', x: 82, y: 50, frame: 295 },
      { title: 'Asia Cup squad', year: '2018', tag: 'India', x: 73, y: 71, frame: 340 },
      { title: 'Karnataka captain', year: '2021', tag: 'Leadership', x: 55, y: 82, frame: 390 },
      { title: 'KKR return', year: '2024', tag: 'Return', x: 35, y: 78, frame: 440 },
      { title: 'Veteran T20 value', year: '2024', tag: 'Legacy', x: 50, y: 39, frame: 490 },
    ],
    bars: [
      { year: '2008', label: 'U19', value: 38, frame: 60 },
      { year: '2009', label: 'IPL 100', value: 82, frame: 105 },
      { year: '2014', label: 'KKR 94', value: 94, frame: 150 },
      { year: '2015', label: 'Debut', value: 58, frame: 195 },
      { year: '2016', label: '104*', value: 88, frame: 240 },
      { year: '2018', label: 'Asia Cup', value: 63, frame: 285 },
      { year: '2021', label: 'Captain', value: 66, frame: 330 },
      { year: '2024', label: 'KKR', value: 70, frame: 375 },
    ],
    portals: [
      'U19 pathway',
      'IPL breakthrough',
      'Domestic strength',
      'Middle-order role',
      'Leadership arc',
      'Franchise return',
    ],
  },
}

const comparison = {
  similarities: [
    {
      title: 'India U19 platform',
      detail: 'Both careers gained early visibility through India’s 2008 Under-19 World Cup generation.',
    },
    {
      title: 'IPL as a reputation engine',
      detail: 'Both became widely recognizable through franchise cricket moments that shaped public memory.',
    },
    {
      title: 'Top-order batting identity',
      detail: 'Both are associated with technically strong batting and responsibility in the upper or middle order.',
    },
    {
      title: 'Pressure-match landmarks',
      detail: 'Kohli owns repeated global pressure innings; Pandey’s 2014 IPL final 94 and Sydney 104* anchor his profile.',
    },
  ],
  perception: [
    {
      label: 'Virat Kohli',
      value: 96,
      title: 'Global superstar narrative',
      detail: 'Media coverage frames Kohli through dominance, intensity, records, fitness, rivalry, and commercial influence.',
    },
    {
      label: 'Manish Pandey',
      value: 58,
      title: 'Skilled but selective spotlight',
      detail: 'Pandey is usually covered through milestone knocks, IPL utility, domestic consistency, and unfulfilled India-team continuity.',
    },
  ],
  contrasts: [
    'Kohli is treated as a central protagonist in modern cricket history; Pandey is usually a strong supporting figure in specific chapters.',
    'Kohli’s media image is continuous and global; Pandey’s is event-driven and often tied to IPL or domestic cricket.',
    'Both are respected batters, but the scale of public expectation around Kohli is much larger.',
  ],
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
      setFrame((current) => (current >= 720 ? 1 : current + 6))
    }, 45)

    return () => window.clearInterval(timer)
  }, [])

  return [frame, setFrame]
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

function KnowledgeNetwork({ player, frame }) {
  const currentNode = useMemo(() => {
    return player.nodes.reduce((latest, node) => {
      if (frame >= node.frame && node.frame >= latest.frame) {
        return node
      }
      return latest
    }, player.nodes[0])
  }, [frame, player.nodes])

  return (
    <section className={`network-stage ${player.theme}`} aria-label={`${player.name} animated knowledge network`}>
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

      <div className="network-map">
        <div className="aura aura-one" />
        <div className="aura aura-two" />

        {player.nodes.map((node) => (
          <NetworkLine node={node} visible={frame >= node.frame} key={`line-${node.title}`} />
        ))}

        <div className="core-node">
          <span>{player.number}</span>
          <strong>{player.name}</strong>
        </div>

        {player.nodes.map((node) => (
          <article
            className={frame >= node.frame ? 'career-node visible' : 'career-node'}
            key={node.title}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <span>{node.year}</span>
            <strong>{node.title}</strong>
            <small>{node.tag}</small>
          </article>
        ))}

        <div className="spotlight-card" key={`${player.name}-${currentNode.title}`}>
          <span>{currentNode.year}</span>
          <strong>{currentNode.title}</strong>
          <small>{currentNode.tag}</small>
        </div>

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
          <h2>Career Momentum</h2>
          <div className="bar-row">
            {player.bars.map((bar) => (
              <div className="bar-item" key={`${bar.year}-${bar.label}`}>
                <div className="bar-shell">
                  <span
                    style={{
                      height: frame >= bar.frame ? `${bar.value}%` : '2%',
                    }}
                  />
                </div>
                <strong>{bar.year}</strong>
                <small>{bar.label}</small>
              </div>
            ))}
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

function ComparisonView() {
  return (
    <section className="comparison-stage" aria-label="Career and media comparison">
      <div className="comparison-header">
        <span>Career Lens</span>
        <h1>Similar roots, different spotlights</h1>
        <p>
          Kohli and Pandey share youth-era, IPL, and Indian cricket pathways, but media coverage places them in very different
          narrative roles.
        </p>
      </div>

      <div className="comparison-grid">
        <div className="similarity-map">
          <div className="comparison-core">
            <strong>Shared Career DNA</strong>
            <small>U19 • IPL • India pathway • pressure innings</small>
          </div>

          {comparison.similarities.map((item, index) => (
            <article className={`similarity-node node-${index + 1}`} key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="media-panel">
          <h2>Media Perception Index</h2>
          {comparison.perception.map((item) => (
            <article className="perception-row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <span>{item.title}</span>
              </div>
              <div className="perception-meter">
                <span style={{ width: `${item.value}%` }} />
              </div>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="contrast-strip">
        {comparison.contrasts.map((contrast) => (
          <p key={contrast}>{contrast}</p>
        ))}
      </div>
    </section>
  )
}

function scoreProfiles(answers) {
  const userTraits = {
    calm: 50,
    ambition: 50,
    risk: 50,
    creativity: 50,
    resilience: 50,
    leadership: 50,
    flair: 50,
    teamwork: 50,
  }

  Object.entries(answers).forEach(([questionIndex, optionIndex]) => {
    if (optionIndex === undefined) {
      return
    }

    const option = quizQuestions[Number(questionIndex)].options[optionIndex]
    Object.entries(option.scores).forEach(([trait, value]) => {
      userTraits[trait] = Math.max(0, Math.min(100, userTraits[trait] + value))
    })
  })

  return cricketerProfiles
    .map((profile) => {
      const distance = Object.entries(userTraits).reduce((total, [trait, value]) => {
        return total + Math.abs(value - profile.traits[trait])
      }, 0)
      const match = Math.max(1, Math.round(100 - distance / 8))

      return { ...profile, match }
    })
    .sort((a, b) => b.match - a.match)
}

function FanPersonalityTest() {
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const answeredCount = Object.keys(answers).length
  const results = useMemo(() => scoreProfiles(answers), [answers])
  const winner = results[0]
  const runnersUp = results.slice(1, 4)

  return (
    <section className="fan-stage" aria-label="Cricketer personality test">
      <div className="fan-hero">
        <div>
          <span>Fan Match Lab</span>
          <h1>Which cricketer are you?</h1>
          <p>
            Answer eight life-based questions and get matched against 50 cricketer profiles built from career roles,
            leadership patterns, playing styles, and Wikipedia-backed summaries.
          </p>
        </div>
        <div className="fan-scoreboard" aria-label="Quiz progress">
          <strong>{answeredCount}</strong>
          <span>/ {quizQuestions.length}</span>
          <small>Answered</small>
        </div>
      </div>

      <div className="quiz-layout">
        <div className="question-stack">
          {quizQuestions.map((question, questionIndex) => (
            <article className="quiz-question" key={question.prompt}>
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
                    {option.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="result-panel">
          <div className="result-card">
            <span>Current Match</span>
            <strong>{winner.name}</strong>
            <small>
              {winner.country} • {winner.role}
            </small>
            <div className="match-ring" style={{ '--match': `${winner.match * 3.6}deg` }}>
              <b>{winner.match}%</b>
            </div>
            <h2>{winner.archetype}</h2>
            <p>{winner.matchLine}</p>

            {showResult && (
              <div className="evidence-list">
                {winner.evidence.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}

            <div className="result-actions">
              <button
                disabled={answeredCount < quizQuestions.length}
                onClick={() => setShowResult(true)}
                type="button"
              >
                Reveal Profile
              </button>
              <button
                onClick={() => {
                  setAnswers({})
                  setShowResult(false)
                }}
                type="button"
              >
                Reset
              </button>
            </div>

            <a href={winner.wikipedia} rel="noreferrer" target="_blank">
              Wikipedia profile
            </a>
          </div>

          <div className="runner-panel">
            <h2>Also Close</h2>
            {runnersUp.map((player) => (
              <div className="runner-row" key={player.name}>
                <span>{player.match}%</span>
                <div>
                  <strong>{player.name}</strong>
                  <small>{player.archetype}</small>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="player-cloud" aria-label="Available cricketer match pool">
        {cricketerProfiles.map((profile) => (
          <a href={profile.wikipedia} key={profile.name} rel="noreferrer" target="_blank">
            {profile.name}
          </a>
        ))}
      </div>
    </section>
  )
}

function App() {
  const getInitialView = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/fan-test') {
      return 'fan'
    }

    return 'kohli'
  }
  const [activeView, setActiveView] = useState(getInitialView)
  const [frame, setFrame] = usePlayback()
  const player = players[activeView] ?? players.kohli
  const changeView = (view) => {
    const path = view === 'fan' ? '/fan-test' : '/'
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path)
    }
    setActiveView(view)
  }

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(window.location.pathname === '/fan-test' ? 'fan' : 'kohli')
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <main className="app-shell">
      <nav className="player-switch" aria-label="Choose animation">
        {Object.entries(players).map(([key, item]) => (
          <button
            className={key === activeView ? 'active' : ''}
            key={key}
            onClick={() => {
              changeView(key)
              setFrame(1)
            }}
            type="button"
          >
            <span>{item.number}</span>
            {item.name}
          </button>
        ))}
        <button
          className={activeView === 'comparison' ? 'active' : ''}
          onClick={() => changeView('comparison')}
          type="button"
        >
          <span>VS</span>
          Similarities
        </button>
        <button
          className={activeView === 'fan' ? 'active' : ''}
          onClick={() => changeView('fan')}
          type="button"
        >
          <span>50</span>
          Fan Test
        </button>
      </nav>

      {activeView === 'comparison' ? (
        <ComparisonView />
      ) : activeView === 'fan' ? (
        <FanPersonalityTest />
      ) : (
        <KnowledgeNetwork player={player} frame={frame} />
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
