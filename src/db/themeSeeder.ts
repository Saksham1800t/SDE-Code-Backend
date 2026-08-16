import Theme from '../models/Theme';

export const defaultThemesData = [
  {
    id: 'slate',
    name: 'Midnight Slate (Default)',
    colors: {
      '--bg-primary': '#0f172a',      // Slate 900
      '--bg-secondary': '#1e293b',    // Slate 800
      '--bg-tertiary': '#334155',     // Slate 700
      '--border-color': '#475569',    // Slate 600
      '--accent-cyan': '#38bdf8',    // Sky 400 (Solid Blue)
      '--accent-cyan-glow': '#34d399',// Emerald 400 (Solid Green)
      '--text-primary': '#f8fafc',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b'
    },
    default: true
  },
  {
    id: 'github',
    name: 'GitHub Dark',
    colors: {
      '--bg-primary': '#0d1117',
      '--bg-secondary': '#161b22',
      '--bg-tertiary': '#21262d',
      '--border-color': '#30363d',
      '--accent-cyan': '#58a6ff',
      '--accent-cyan-glow': '#bc8cff',
      '--text-primary': '#c9d1d9',
      '--text-secondary': '#8b949e',
      '--text-muted': '#484f58'
    },
    default: true
  },
  {
    id: 'onedark',
    name: 'One Dark Pro',
    colors: {
      '--bg-primary': '#282c34',
      '--bg-secondary': '#21252b',
      '--bg-tertiary': '#2c313c',
      '--border-color': '#3e4451',
      '--accent-cyan': '#61afef',
      '--accent-cyan-glow': '#c678dd',
      '--text-primary': '#abb2bf',
      '--text-secondary': '#828997',
      '--text-muted': '#5c6370'
    },
    default: true
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    colors: {
      '--bg-primary': '#2e3440',
      '--bg-secondary': '#3b4252',
      '--bg-tertiary': '#434c5e',
      '--border-color': '#4c566a',
      '--accent-cyan': '#88c0d0',
      '--accent-cyan-glow': '#a3be8c',
      '--text-primary': '#eceff4',
      '--text-secondary': '#d8dee9',
      '--text-muted': '#4c566a'
    },
    default: true
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      '--bg-primary': '#282a36',
      '--bg-secondary': '#1e1f29',
      '--bg-tertiary': '#44475a',
      '--border-color': '#6272a4',
      '--accent-cyan': '#ff79c6',
      '--accent-cyan-glow': '#50fa7b',
      '--text-primary': '#f8f8f2',
      '--text-secondary': '#6272a4',
      '--text-muted': '#44475a'
    },
    default: true
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    colors: {
      '--bg-primary': '#002b36',
      '--bg-secondary': '#073642',
      '--bg-tertiary': '#586e75',
      '--border-color': '#073642',
      '--accent-cyan': '#2aa198',
      '--accent-cyan-glow': '#268bd2',
      '--text-primary': '#93a1a1',
      '--text-secondary': '#586e75',
      '--text-muted': '#073642'
    },
    default: true
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    colors: {
      '--bg-primary': '#2d2a2e',
      '--bg-secondary': '#221f22',
      '--bg-tertiary': '#403e41',
      '--border-color': '#727072',
      '--accent-cyan': '#ffd866',
      '--accent-cyan-glow': '#a9dc76',
      '--text-primary': '#fcfcfa',
      '--text-secondary': '#727072',
      '--text-muted': '#403e41'
    },
    default: true
  },
  // Ports of VS Code's own official built-in themes, using their real hex values.
  {
    id: 'vscode-dark-plus',
    name: 'Visual Studio Dark+',
    colors: {
      '--bg-primary': '#1e1e1e',
      '--bg-secondary': '#252526',
      '--bg-tertiary': '#2d2d30',
      '--border-color': '#3c3c3c',
      '--accent-cyan': '#007acc',
      '--accent-cyan-glow': '#4ec9b0',
      '--text-primary': '#d4d4d4',
      '--text-secondary': '#9cdcfe',
      '--text-muted': '#6a6a6a'
    },
    default: true
  },
  {
    id: 'vscode-light-plus',
    name: 'Visual Studio Light+',
    colors: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f3f3f3',
      '--bg-tertiary': '#e8e8e8',
      '--border-color': '#d4d4d4',
      '--accent-cyan': '#0066b8',
      '--accent-cyan-glow': '#267f99',
      '--text-primary': '#1e1e1e',
      '--text-secondary': '#3b3b3b',
      '--text-muted': '#767676'
    },
    default: true
  },
  {
    id: 'abyss',
    name: 'Abyss',
    colors: {
      '--bg-primary': '#000c18',
      '--bg-secondary': '#011221',
      '--bg-tertiary': '#05233a',
      '--border-color': '#1d3b53',
      '--accent-cyan': '#6688cc',
      '--accent-cyan-glow': '#ffcc66',
      '--text-primary': '#ddeeff',
      '--text-secondary': '#6688cc',
      '--text-muted': '#384887'
    },
    default: true
  },
  {
    id: 'kimbie-dark',
    name: 'Kimbie Dark',
    colors: {
      '--bg-primary': '#221a0f',
      '--bg-secondary': '#2b2211',
      '--bg-tertiary': '#362712',
      '--border-color': '#4a3a1f',
      '--accent-cyan': '#f06431',
      '--accent-cyan-glow': '#d3af86',
      '--text-primary': '#d3af86',
      '--text-secondary': '#a57a4c',
      '--text-muted': '#7a5c3a'
    },
    default: true
  },
  // New original themes, designed for vibrant, attention-grabbing accent
  // colors rather than ports of any existing product's palette.
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    colors: {
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#12173a',
      '--bg-tertiary': '#1b2150',
      '--border-color': '#2d3470',
      '--accent-cyan': '#00fff5',
      '--accent-cyan-glow': '#ff2ec4',
      '--text-primary': '#e8f7ff',
      '--text-secondary': '#7ad9ff',
      '--text-muted': '#5a6ba8'
    },
    default: true
  },
  {
    id: 'sunset-ember',
    name: 'Sunset Ember',
    colors: {
      '--bg-primary': '#241422',
      '--bg-secondary': '#2e1a2b',
      '--bg-tertiary': '#3a2135',
      '--border-color': '#55283f',
      '--accent-cyan': '#ff6b4a',
      '--accent-cyan-glow': '#ffb347',
      '--text-primary': '#ffe8dc',
      '--text-secondary': '#e8a87c',
      '--text-muted': '#a56c7a'
    },
    default: true
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    colors: {
      '--bg-primary': '#0b1e1c',
      '--bg-secondary': '#102a26',
      '--bg-tertiary': '#163a33',
      '--border-color': '#1f5c4f',
      '--accent-cyan': '#4dffb8',
      '--accent-cyan-glow': '#8a6bff',
      '--text-primary': '#e3fff5',
      '--text-secondary': '#7fd9c4',
      '--text-muted': '#4c7a6d'
    },
    default: true
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    colors: {
      '--bg-primary': '#fdf3f7',
      '--bg-secondary': '#fbe8ef',
      '--bg-tertiary': '#f6d9e5',
      '--border-color': '#eabbcf',
      '--accent-cyan': '#d6598c',
      '--accent-cyan-glow': '#9b6bd6',
      '--text-primary': '#4a2438',
      '--text-secondary': '#7a4a63',
      '--text-muted': '#b98aa3'
    },
    default: true
  },
  // More ports of VS Code's own official built-in themes — rounding out light-theme coverage (Solarized/Quiet Light had none) and adding one more well-known dark one.
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    colors: {
      '--bg-primary': '#fdf6e3',
      '--bg-secondary': '#eee8d5',
      '--bg-tertiary': '#e3dbc5',
      '--border-color': '#d3cbb7',
      '--accent-cyan': '#268bd2',
      '--accent-cyan-glow': '#2aa198',
      '--text-primary': '#586e75',
      '--text-secondary': '#657b83',
      '--text-muted': '#93a1a1'
    },
    default: true
  },
  {
    id: 'quiet-light',
    name: 'Quiet Light',
    colors: {
      '--bg-primary': '#f5f5f5',
      '--bg-secondary': '#eeeeee',
      '--bg-tertiary': '#e5e5e5',
      '--border-color': '#d0d0d0',
      '--accent-cyan': '#994cc3',
      '--accent-cyan-glow': '#448c27',
      '--text-primary': '#333333',
      '--text-secondary': '#6a6a6a',
      '--text-muted': '#aaaaaa'
    },
    default: true
  },
  {
    id: 'tomorrow-night-blue',
    name: 'Tomorrow Night Blue',
    colors: {
      '--bg-primary': '#002451',
      '--bg-secondary': '#00346e',
      '--bg-tertiary': '#003f8e',
      '--border-color': '#1e4c8c',
      '--accent-cyan': '#bbdaff',
      '--accent-cyan-glow': '#ffeead',
      '--text-primary': '#ffffff',
      '--text-secondary': '#bbdaff',
      '--text-muted': '#7285b7'
    },
    default: true
  },
  // More original themes — distinct hues from the four above (cyan/pink, orange/amber, teal/violet, pink/purple) so the full set stays visually varied rather than converging on similar palettes.
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    colors: {
      '--bg-primary': '#061621',
      '--bg-secondary': '#0a2233',
      '--bg-tertiary': '#0f2e42',
      '--border-color': '#1a4258',
      '--accent-cyan': '#29d9c2',
      '--accent-cyan-glow': '#4a9eff',
      '--text-primary': '#e0f4ff',
      '--text-secondary': '#7fb8d9',
      '--text-muted': '#4a7691'
    },
    default: true
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    colors: {
      '--bg-primary': '#101c14',
      '--bg-secondary': '#16261a',
      '--bg-tertiary': '#1d3322',
      '--border-color': '#2d4d34',
      '--accent-cyan': '#7ed957',
      '--accent-cyan-glow': '#ffb84d',
      '--text-primary': '#e8f5e0',
      '--text-secondary': '#a8cf9a',
      '--text-muted': '#6b8a5f'
    },
    default: true
  },
  {
    id: 'volcanic-ash',
    name: 'Volcanic Ash',
    colors: {
      '--bg-primary': '#1a1614',
      '--bg-secondary': '#221c19',
      '--bg-tertiary': '#2b2320',
      '--border-color': '#40332c',
      '--accent-cyan': '#ff4d3d',
      '--accent-cyan-glow': '#ffb238',
      '--text-primary': '#f2e9e4',
      '--text-secondary': '#c9b8ae',
      '--text-muted': '#8a7468'
    },
    default: true
  }
];

// Upserts by id (not "seed only if empty") so newly added themes still reach an already-seeded database.
export async function seedDefaultThemes() {
  try {
    for (const t of defaultThemesData) {
      await Theme.findOneAndUpdate({ id: t.id }, t, { upsert: true });
    }
    console.log(`Default themes synced (${defaultThemesData.length} total).`);
  } catch (err) {
    console.error('Failed to seed default themes:', err);
  }
}
