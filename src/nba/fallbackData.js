export const fallbackPlayers = [
  { id: 2544, name: 'LeBron James', fromYear: 2003, toYear: 2026, team: 'LAL' },
  { id: 893, name: 'Michael Jordan', fromYear: 1984, toYear: 2003, team: 'CHI' },
  { id: 201939, name: 'Stephen Curry', fromYear: 2009, toYear: 2026, team: 'GSW' },
  { id: 1628983, name: 'Shai Gilgeous-Alexander', fromYear: 2018, toYear: 2026, team: 'OKC' },
  { id: 203999, name: 'Nikola Jokic', fromYear: 2015, toYear: 2026, team: 'DEN' },
  { id: 203507, name: 'Giannis Antetokounmpo', fromYear: 2013, toYear: 2026, team: 'MIL' },
  { id: 1629029, name: 'Luka Doncic', fromYear: 2018, toYear: 2026, team: 'LAL' },
  { id: 1628369, name: 'Jayson Tatum', fromYear: 2017, toYear: 2026, team: 'BOS' },
  { id: 201142, name: 'Kevin Durant', fromYear: 2007, toYear: 2026, team: 'PHX' },
  { id: 977, name: 'Kobe Bryant', fromYear: 1996, toYear: 2016, team: 'LAL' },
  { id: 406, name: 'Shaquille ONeal', fromYear: 1992, toYear: 2011, team: 'LAL' },
  { id: 76003, name: 'Kareem Abdul-Jabbar', fromYear: 1969, toYear: 1989, team: 'LAL' },
  { id: 787, name: 'Charles Barkley', fromYear: 1984, toYear: 1999, team: 'HOU' },
  { id: 1717, name: 'Dirk Nowitzki', fromYear: 1998, toYear: 2019, team: 'DAL' },
  { id: 708, name: 'Kevin Garnett', fromYear: 1995, toYear: 2016, team: 'BOS' },
  { id: 1495, name: 'Tim Duncan', fromYear: 1997, toYear: 2016, team: 'SAS' },
  { id: 1718, name: 'Paul Pierce', fromYear: 1998, toYear: 2017, team: 'BOS' },
  { id: 947, name: 'Allen Iverson', fromYear: 1996, toYear: 2010, team: 'PHI' },
  { id: 959, name: 'Steve Nash', fromYear: 1996, toYear: 2014, team: 'PHX' },
  { id: 951, name: 'Ray Allen', fromYear: 1996, toYear: 2014, team: 'MIA' }
];

export const fallbackStats = {
  2544: [
    season('2012-13', 'MIA', 76, 76, 37.9, 10.1, 17.8, 0.565, 1.4, 3.3, 0.406, 5.3, 7.0, 0.753, 1.3, 6.8, 8.0, 7.3, 1.7, 0.9, 3.0, 1.4, 26.8),
    season('2017-18', 'CLE', 82, 82, 36.9, 10.5, 19.3, 0.542, 1.8, 5.0, 0.367, 4.7, 6.5, 0.731, 1.2, 7.5, 8.6, 9.1, 1.4, 0.9, 4.2, 1.7, 27.5),
    season('2019-20', 'LAL', 67, 67, 34.6, 9.6, 19.4, 0.493, 2.2, 6.3, 0.348, 3.9, 5.7, 0.693, 1.0, 6.8, 7.8, 10.2, 1.2, 0.5, 3.9, 1.8, 25.3)
  ],
  893: [
    season('1987-88', 'CHI', 82, 82, 40.4, 13.0, 24.4, 0.535, 0.1, 0.6, 0.132, 8.8, 10.5, 0.841, 1.7, 3.8, 5.5, 5.9, 3.2, 1.6, 3.1, 3.3, 35.0),
    season('1990-91', 'CHI', 82, 82, 37.0, 12.1, 22.4, 0.539, 0.4, 1.1, 0.312, 7.0, 8.2, 0.851, 1.4, 4.6, 6.0, 5.5, 2.7, 1.0, 2.5, 2.8, 31.5),
    season('1995-96', 'CHI', 82, 82, 37.7, 11.2, 22.6, 0.495, 1.4, 3.2, 0.427, 6.7, 8.0, 0.834, 1.8, 4.8, 6.6, 4.3, 2.2, 0.5, 2.4, 2.4, 30.4)
  ],
  201939: [
    season('2015-16', 'GSW', 79, 79, 34.2, 10.2, 20.2, 0.504, 5.1, 11.2, 0.454, 4.6, 5.1, 0.908, 0.9, 4.6, 5.4, 6.7, 2.1, 0.2, 3.3, 2.0, 30.1),
    season('2020-21', 'GSW', 63, 63, 34.2, 10.4, 21.7, 0.482, 5.3, 12.7, 0.421, 5.7, 6.3, 0.916, 0.5, 5.0, 5.5, 5.8, 1.2, 0.1, 3.4, 1.9, 32.0)
  ],
  1628983: [
    season('2018-19', 'LAC', 62, 15, 26.6, 4.1, 9.0, 0.455, 1.0, 3.0, 0.327, 1.5, 1.9, 0.810, 0.4, 1.9, 2.3, 2.2, 1.0, 0.2, 1.0, 2.0, 10.8),
    season('2019-20', 'OKC', 35, 34, 35.3, 7.3, 15.3, 0.476, 1.3, 3.9, 0.340, 4.5, 5.5, 0.817, 0.5, 3.5, 4.0, 3.3, 1.0, 0.5, 2.0, 2.3, 20.4),
    season('2020-21', 'OKC', 35, 35, 33.8, 8.4, 17.2, 0.488, 1.6, 4.4, 0.360, 5.3, 6.7, 0.793, 0.5, 3.9, 4.4, 6.2, 1.8, 0.7, 2.8, 2.9, 23.7),
    season('2021-22', 'OKC', 56, 56, 35.4, 8.5, 18.0, 0.472, 1.5, 4.5, 0.342, 6.0, 7.5, 0.804, 0.5, 4.0, 4.5, 5.9, 1.7, 0.8, 2.5, 2.7, 24.5),
    season('2022-23', 'OKC', 68, 68, 35.4, 10.6, 20.0, 0.530, 1.7, 4.5, 0.382, 8.5, 9.7, 0.876, 0.6, 4.0, 4.6, 6.3, 1.6, 0.9, 2.7, 2.6, 31.4),
    season('2023-24', 'OKC', 75, 75, 34.7, 10.4, 19.3, 0.537, 1.5, 4.2, 0.359, 7.8, 8.9, 0.874, 0.5, 3.4, 3.9, 6.2, 1.5, 0.9, 2.3, 2.1, 30.1),
    season('2024-25', 'OKC', 74, 74, 33.5, 11.0, 19.4, 0.566, 1.7, 4.4, 0.386, 8.3, 9.4, 0.885, 0.5, 3.9, 4.4, 6.4, 1.6, 0.9, 2.2, 2.0, 32.7),
    season('2025-26', 'OKC', 68, 68, 33.2, 10.8, 19.4, 0.553, 1.7, 4.4, 0.386, 7.9, 9.0, 0.879, 0.6, 3.7, 4.3, 6.6, 1.4, 0.8, 2.2, 2.0, 31.1)
  ],
  203999: [
    season('2015-16', 'DEN', 80, 43, 27.1, 4.0, 7.5, 0.534, 0.3, 1.1, 0.333, 1.2, 1.6, 0.819, 1.7, 4.4, 6.1, 2.4, 0.8, 0.8, 1.8, 2.2, 10.0),
    season('2016-17', 'DEN', 73, 72, 32.8, 6.0, 11.3, 0.530, 0.9, 2.7, 0.323, 3.8, 4.8, 0.793, 2.4, 7.0, 9.4, 4.9, 1.2, 0.8, 3.0, 3.2, 16.7),
    season('2017-18', 'DEN', 75, 73, 33.0, 6.8, 13.1, 0.499, 1.2, 3.3, 0.399, 3.7, 5.0, 0.838, 2.6, 7.9, 10.7, 6.1, 1.4, 0.8, 3.0, 3.2, 18.5),
    season('2018-19', 'DEN', 80, 80, 31.0, 7.9, 14.5, 0.511, 0.9, 2.6, 0.305, 3.5, 4.2, 0.822, 2.7, 7.8, 10.8, 7.3, 1.4, 0.7, 3.5, 3.2, 20.2),
    season('2019-20', 'DEN', 73, 73, 32.0, 8.3, 15.5, 0.528, 1.4, 4.0, 0.314, 4.0, 5.1, 0.817, 2.3, 8.0, 10.2, 6.9, 1.2, 0.6, 3.1, 3.0, 20.2),
    season('2020-21', 'DEN', 72, 72, 32.0, 9.6, 16.6, 0.577, 0.8, 2.5, 0.303, 6.4, 7.7, 0.868, 2.6, 8.3, 10.8, 8.3, 1.3, 0.7, 3.1, 2.7, 26.4),
    season('2021-22', 'DEN', 74, 74, 33.5, 10.3, 17.7, 0.583, 1.3, 3.9, 0.337, 5.1, 6.3, 0.810, 2.8, 11.0, 13.8, 7.9, 1.5, 0.9, 3.8, 2.6, 27.1),
    season('2022-23', 'DEN', 69, 69, 33.7, 9.4, 14.8, 0.632, 0.8, 2.2, 0.383, 4.9, 6.0, 0.822, 2.4, 9.4, 11.8, 9.8, 1.3, 0.7, 3.6, 2.5, 24.5),
    season('2023-24', 'DEN', 79, 79, 34.6, 10.4, 17.5, 0.583, 1.3, 3.7, 0.359, 5.2, 6.3, 0.820, 2.8, 9.9, 12.4, 9.0, 1.4, 0.7, 3.0, 2.6, 26.4),
    season('2024-25', 'DEN', 77, 77, 34.0, 10.2, 17.3, 0.573, 1.5, 4.1, 0.352, 5.0, 6.2, 0.813, 2.7, 10.1, 13.0, 10.5, 1.4, 0.8, 3.6, 2.7, 26.6),
    season('2025-26', 'DEN', 65, 65, 34.8, 9.9, 17.4, 0.569, 1.7, 4.5, 0.380, 6.1, 7.4, 0.831, 3.0, 9.9, 12.9, 10.7, 1.4, 0.8, 3.7, 2.7, 27.7)
  ],
  203507: [
    season('2019-20', 'MIL', 63, 63, 30.4, 10.9, 19.7, 0.553, 1.4, 4.7, 0.304, 6.3, 10.0, 0.633, 2.2, 11.4, 13.6, 5.6, 1.0, 1.0, 3.7, 3.1, 29.5),
    season('2022-23', 'MIL', 63, 63, 32.1, 11.2, 20.3, 0.553, 0.7, 2.7, 0.275, 7.9, 12.3, 0.645, 2.2, 9.6, 11.8, 5.7, 0.8, 0.8, 3.9, 3.1, 31.1)
  ],
  1629029: [
    season('2019-20', 'DAL', 61, 61, 33.6, 9.5, 20.6, 0.463, 2.8, 8.9, 0.316, 7.0, 9.2, 0.758, 1.3, 8.1, 9.4, 8.8, 1.0, 0.2, 4.3, 2.5, 28.8),
    season('2023-24', 'DAL', 70, 70, 37.5, 11.5, 23.6, 0.487, 4.1, 10.6, 0.382, 6.8, 8.7, 0.786, 0.8, 8.4, 9.2, 9.8, 1.4, 0.5, 4.0, 2.1, 33.9)
  ]
};

export const fallbackAwards = {
  2544: awards([
    ['Most Valuable Player', 4],
    ['Finals Most Valuable Player', 4],
    ['All-NBA', 20],
    ['All-Defensive Team', 6],
    ['All-Star', 21]
  ]),
  893: awards([
    ['Most Valuable Player', 5],
    ['Finals Most Valuable Player', 6],
    ['Defensive Player of the Year', 1],
    ['All-NBA', 11],
    ['All-Defensive Team', 9],
    ['All-Star', 14]
  ]),
  201939: awards([
    ['Most Valuable Player', 2],
    ['Finals Most Valuable Player', 1],
    ['All-NBA', 10],
    ['All-Star', 10]
  ]),
  1628983: awardEntries([
    ['All-NBA', '2022-23', 'Oklahoma City Thunder', '1'],
    ['All-NBA', '2023-24', 'Oklahoma City Thunder', '1'],
    ['All-NBA', '2024-25', 'Oklahoma City Thunder', '1'],
    ['NBA All-Star', '2022-23'],
    ['NBA All-Star', '2023-24'],
    ['NBA All-Star', '2024-25'],
    ['NBA All-Star', '2025-26'],
    ['NBA Finals Most Valuable Player', '2024-25', 'Oklahoma City Thunder'],
    ['NBA Most Valuable Player', '2024-25', 'Oklahoma City Thunder']
  ]),
  203999: awardEntries([
    ['NBA All-Star', '2018-19'],
    ['NBA All-Star', '2019-20'],
    ['NBA All-Star', '2020-21'],
    ['NBA All-Star', '2021-22'],
    ['NBA All-Star', '2022-23'],
    ['NBA All-Star', '2023-24'],
    ['NBA All-Star', '2024-25'],
    ['NBA All-Star', '2025-26'],
    ['NBA Most Valuable Player', '2020-21', 'Denver Nuggets'],
    ['NBA Most Valuable Player', '2021-22', 'Denver Nuggets'],
    ['NBA Most Valuable Player', '2023-24', 'Denver Nuggets'],
    ['NBA Finals Most Valuable Player', '2022-23', 'Denver Nuggets']
  ]),
  203507: awards([
    ['Most Valuable Player', 2],
    ['Finals Most Valuable Player', 1],
    ['Defensive Player of the Year', 1],
    ['All-NBA', 8],
    ['All-Star', 8]
  ]),
  1629029: awards([
    ['All-NBA', 5],
    ['All-Star', 5],
    ['Rookie of the Year', 1]
  ])
};

function season(
  SEASON_ID,
  TEAM_ABBREVIATION,
  GP,
  GS,
  MIN,
  FGM,
  FGA,
  FG_PCT,
  FG3M,
  FG3A,
  FG3_PCT,
  FTM,
  FTA,
  FT_PCT,
  OREB,
  DREB,
  REB,
  AST,
  STL,
  BLK,
  TOV,
  PF,
  PTS
) {
  return {
    SEASON_ID,
    TEAM_ABBREVIATION,
    GP,
    GS,
    MIN,
    FGM,
    FGA,
    FG_PCT,
    FG3M,
    FG3A,
    FG3_PCT,
    FTM,
    FTA,
    FT_PCT,
    OREB,
    DREB,
    REB,
    AST,
    STL,
    BLK,
    TOV,
    PF,
    PTS
  };
}

function awards(entries) {
  return entries.flatMap(([DESCRIPTION, count]) =>
    Array.from({ length: count }, (_, index) => ({
      DESCRIPTION,
      SEASON: String(index + 1)
    }))
  );
}

function awardEntries(entries) {
  return entries.map(([DESCRIPTION, SEASON, TEAM = '', ALL_NBA_TEAM_NUMBER = null]) => ({
    DESCRIPTION,
    SEASON,
    TEAM,
    ALL_NBA_TEAM_NUMBER
  }));
}
