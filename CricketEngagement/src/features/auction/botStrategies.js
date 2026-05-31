export const franchiseProfiles = {
  csk: {
    stadium: 'M. A. Chidambaram Stadium',
    identity: 'Experience, leadership, and multi-skill balance',
    strategy: 'Prioritize senior decision makers, all-rounders, and spin-friendly depth.',
    priorities: { experience: 1.28, allrounder: 1.22, bowler: 1.05, indianCore: 1.04, youth: 0.88, risk: 0.82 },
  },
  mi: {
    stadium: 'Wankhede Stadium',
    identity: 'Elite Indian core, pace power, and future stars',
    strategy: 'Spend aggressively on Indian stars, fast bowlers, and high-ceiling young players.',
    priorities: { indianCore: 1.24, bowler: 1.2, youth: 1.12, batter: 1.06, risk: 1.0 },
  },
  rcb: {
    stadium: 'M. Chinnaswamy Stadium',
    identity: 'Star batting, aggressive spending, and marquee names',
    strategy: 'Attack superstar batters, wicketkeeper-batters, and proven fan favorites.',
    priorities: { batter: 1.28, keeper: 1.12, legacy: 1.18, overseas: 1.06, risk: 1.12 },
  },
  kkr: {
    stadium: 'Eden Gardens',
    identity: 'Mystery, power, and match-winning all-rounders',
    strategy: 'Target X-factor all-rounders, spin options, and high-impact finishers.',
    priorities: { allrounder: 1.28, bowler: 1.12, overseas: 1.12, risk: 1.08 },
  },
  srh: {
    stadium: 'Rajiv Gandhi International Stadium',
    identity: 'Explosive overseas batting and high-tempo bowling',
    strategy: 'Pay for overseas hitters, powerplay aggression, and strike bowlers.',
    priorities: { overseas: 1.24, batter: 1.18, bowler: 1.1, risk: 1.12 },
  },
  rr: {
    stadium: 'Sawai Mansingh Stadium',
    identity: 'Undervalued talent, youth development, and flexible roles',
    strategy: 'Find emerging Indian players and value picks before the market notices.',
    priorities: { youth: 1.25, value: 1.18, allrounder: 1.08, indianCore: 1.08, risk: 0.92 },
  },
  dc: {
    stadium: 'Arun Jaitley Stadium',
    identity: 'Youth-heavy cricket with modern Indian depth',
    strategy: 'Build around younger Indian players, wicketkeeper-batters, and pace upside.',
    priorities: { youth: 1.28, indianCore: 1.14, keeper: 1.1, bowler: 1.08, risk: 0.96 },
  },
  pbks: {
    stadium: 'PCA New Stadium, Mullanpur',
    identity: 'High-risk bidding and explosive squad swings',
    strategy: 'Take bold shots at scarce roles and do not fear premium prices.',
    priorities: { risk: 1.26, batter: 1.12, bowler: 1.1, overseas: 1.1, value: 0.94 },
  },
  gt: {
    stadium: 'Narendra Modi Stadium',
    identity: 'Balanced squad building and calm role coverage',
    strategy: 'Keep the purse flexible while filling every role with reliable options.',
    priorities: { value: 1.15, allrounder: 1.12, bowler: 1.1, batter: 1.08, risk: 0.88 },
  },
  lsg: {
    stadium: 'BRSABV Ekana Cricket Stadium',
    identity: 'Value-focused spending and deep squad construction',
    strategy: 'Avoid overpays, buy depth, and win with role coverage.',
    priorities: { value: 1.24, keeper: 1.1, allrounder: 1.08, indianCore: 1.06, risk: 0.82 },
  },
}

export function getFranchiseProfile(teamId) {
  return franchiseProfiles[teamId] ?? franchiseProfiles.gt
}

