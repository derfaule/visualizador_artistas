export const PERIOD_COLORS = {
  legendary: { bg: "#fef9ec", border: "#c9a227", borderStyle: "dashed" as const, label: "Los Legendarios (1926–1948)" },
  segunda:   { bg: "#f0f4ff", border: "#3a5bbf", borderStyle: "solid"  as const, label: "Segunda Generación (1948–1956)" },
  tercera:   { bg: "#f0fff4", border: "#2a7d4f", borderStyle: "dashed" as const, label: "Tercera Generación (1956–1999)" },
  actual:    { bg: "#fff0f0", border: "#b03030", borderStyle: "solid"  as const, label: "Banda Paniagua Hoy (1999–presente)" },
  colon:     { bg: "#e8e8e8", border: "#555",    borderStyle: "solid"  as const, label: "Banda Colón América" },
} as const;

export type Period = keyof typeof PERIOD_COLORS;

export interface Person {
  id: string;
  name: string;
  period: Period;
  instruments?: string[];
  died?: number;
  activeFrom?: number;
  activeTo?: number;
}

export type RelationType = "parent" | "spouse";

export interface Relation {
  from: string;
  to: string;
  type: RelationType;
  notes?: string;
}

export interface Section {
  title: string | null;
  rootIds: string[];
}

// ── People ────────────────────────────────────────────────────────────────────

export const PEOPLE: Person[] = [
  // Main trunk
  { id: "narciso-paniagua",      name: "Narciso",                   period: "legendary" },
  { id: "jose-maria-paniagua",   name: "José María Paniagua",       period: "legendary" },

  // Faustino branch
  { id: "faustino-sr",           name: "Faustino",                  period: "legendary", instruments: ["bombardino"], died: 1930 },
  { id: "cruz-santa-paniagua",   name: "Cruz Santa Paniagua",       period: "segunda" },
  { id: "faustino-jr",           name: "Faustino",                  period: "colon",    instruments: ["clarinete requinto"], died: 1954 },
  { id: "ma-jesus-ospina",       name: "Ma. de Jesús Ospina",       period: "segunda" },
  { id: "roberto-paniagua",      name: "Roberto",                   period: "colon",    instruments: ["bombardino"] },
  { id: "samuel-faustino",       name: "Samuel",                    period: "colon",    instruments: ["trompeta"], died: 1955 },
  { id: "fortunato-paniagua",    name: "Fortunato",                 period: "colon",    instruments: ["redoblante"], died: 1975 },
  { id: "mercedes-ruiz",         name: "Mercedes Ruiz",             period: "segunda" },
  { id: "ignacio-fortunato",     name: "Ignacio",                   period: "tercera",  instruments: ["trompeta", "director"], activeFrom: 1962 },
  { id: "ramon-fortunato",       name: "Ramón",                     period: "colon",    instruments: ["director", "tuba"], died: 1977 },
  { id: "jose-nato-paniagua",    name: "José \"Nato\"",             period: "colon",    instruments: ["trombón", "trompeta"] },
  { id: "gerardo-fortunato",     name: "Gerardo",                   period: "colon",    instruments: ["saxofón"], died: 1955 },

  // Marceliano branch
  { id: "marceliano-paniagua",   name: "Marceliano",                period: "legendary", instruments: ["platillos"], died: 1976 },
  { id: "ana-jesus-pulgarin",    name: "Ana de Jesús Pulgarín",     period: "segunda" },
  { id: "gonzalo-paniagua",      name: "Gonzalo",                   period: "tercera",  instruments: ["clarinete"], activeFrom: 1956, activeTo: 1998 },
  { id: "ramiro-paniagua",       name: "Ramiro",                    period: "actual",   instruments: ["bombo"] },
  { id: "norberto-paniagua",     name: "Norberto",                  period: "tercera",  instruments: ["bombo"] },
  { id: "gustavo-paniagua",      name: "Gustavo",                   period: "tercera",  instruments: ["clarinete", "director"], activeFrom: 1960 },
  { id: "raul-paniagua",         name: "Raúl",                      period: "tercera",  instruments: ["representante"] },

  // Débora branch
  { id: "debora-paniagua",       name: "Débora",                    period: "segunda" },
  { id: "juan-pablo-alvarez",    name: "Juan Pablo Álvarez",        period: "segunda" },
  { id: "serafin-alvarez",       name: "Serafín Álvarez",           period: "segunda",  instruments: ["trompeta"] },
  { id: "luis-angel-alvarez",    name: "Luis Ángel Álvarez",        period: "tercera",  instruments: ["trompeta", "director"], activeFrom: 1956, activeTo: 1999 },
  { id: "ma-patricia-alvarez",   name: "Ma. Patricia Álvarez",      period: "actual" },
  { id: "leonardo-cano",         name: "Leonardo Cano",             period: "actual" },
  { id: "carlos-mario-cano",     name: "Carlos Mario Cano Álvarez", period: "actual",   instruments: ["bombardino"] },
  { id: "abigail-alvarez",       name: "Abigail Álvarez",           period: "tercera",  instruments: ["bombardino"] },
  { id: "libardo-alvarez-deb",   name: "Libardo Álvarez",           period: "tercera",  instruments: ["tuba"] },

  // Rama Brígido
  { id: "brigido-sr",            name: "Brígido",                   period: "legendary", instruments: ["clarinete"] },
  { id: "isac-paniagua",         name: "Isac",                      period: "segunda" },
  { id: "unknown-alvarez",       name: "¿? Álvarez",                period: "segunda" },
  { id: "libardo-alvarez-isac",  name: "Libardo Álvarez",           period: "tercera",  instruments: ["tuba"] },
  { id: "jesus-alvarez",         name: "Jesús Álvarez",             period: "tercera",  instruments: ["tuba"] },
  { id: "felix-alvarez",         name: "Félix Álvarez",             period: "tercera",  instruments: ["bombardino"] },
  { id: "ramon-alvarez-isac",    name: "Ramón Álvarez",             period: "tercera",  instruments: ["tuba"] },
  { id: "celsa-paniagua",        name: "Celsa",                     period: "segunda" },
  { id: "pedro-angel-ospina",    name: "Pedro Ángel Ospina",        period: "segunda" },
  { id: "joaquin-ospina",        name: "Joaquín",                   period: "tercera",  instruments: ["trompeta"] },
  { id: "miguel-angel-ospina",   name: "Miguel Ángel",              period: "segunda",  instruments: ["flauta", "director"], activeFrom: 1948, activeTo: 1956 },

  // Rama Abelardo
  { id: "abelardo-paniagua",     name: "Abelardo",                  period: "legendary", instruments: ["clarinete"] },
  { id: "antonio-abelardo",      name: "Antonio",                   period: "legendary", died: 1935 },
  { id: "julio-antonio",         name: "Julio",                     period: "legendary", instruments: ["redoblante"], died: 1988 },
  { id: "brigido-jr",            name: "Brígido",                   period: "legendary", instruments: ["clarinete"] },
  { id: "efrain-antonio",        name: "Efraín",                    period: "legendary", instruments: ["clarinete"] },
  { id: "ramon-angel-paniagua",  name: "Ramón Ángel",               period: "legendary", instruments: ["redoblante"] },
  { id: "aldemar-paniagua",      name: "Aldemar",                   period: "legendary", instruments: ["bombardino"] },

  // Rama Alberto
  { id: "alberto-paniagua",      name: "Alberto",                   period: "legendary", instruments: ["clarinete"] },
  { id: "efrain-alvarez",        name: "Efraín Álvarez",            period: "segunda" },
  { id: "margarita-alvarez",     name: "Margarita",                 period: "segunda" },
  { id: "samuel-alvarez",        name: "Samuel Álvarez",            period: "segunda" },
  { id: "elena-alvarez",         name: "Elena Álvarez",             period: "segunda" },
  { id: "eladio-alvarez",        name: "Eladio Álvarez",            period: "segunda",  instruments: ["trompeta"] },
  { id: "rodrigo-alvarez",       name: "Rodrigo Álvarez",           period: "segunda" },
  { id: "alejandro-alvarez",     name: "Alejandro Álvarez",         period: "actual",   instruments: ["trompeta"] },

  // Rama Pedro Pablo / Otros hijos de José María
  { id: "delfin-paniagua",       name: "Delfín",                    period: "legendary", instruments: ["bombo"] },
  { id: "pedro-pablo-paniagua",  name: "Pedro Pablo",               period: "legendary", instruments: ["clarinete requinto", "director"], died: 1948 },
  { id: "martin-paniagua",       name: "Martín",                    period: "segunda",  instruments: ["clarinete", "director"] },
  { id: "jose-maria-jr",         name: "José María",                period: "legendary" },
  { id: "jesus-maria-paniagua",  name: "Jesús María",               period: "legendary", instruments: ["tuba"] },
  { id: "jesusito-paniagua",     name: "\"Jesusito\"",              period: "segunda",  instruments: ["platillos"] },
  { id: "antonio-jm",            name: "Antonio",                   period: "legendary", instruments: ["bombardino"] },
  { id: "crispulo-paniagua",     name: "Crispulo",                  period: "legendary", instruments: ["clarinete"], died: 1966 },
  { id: "israel-paniagua",       name: "Israel",                    period: "segunda",  instruments: ["cornetín", "subdirector"] },
  { id: "hipolito-paniagua",     name: "Hipólito",                  period: "segunda" },

  // Rama Daniel / Cano
  { id: "daniel-paniagua",       name: "Daniel",                    period: "colon",    instruments: ["tuba"], died: 1964 },
  { id: "enriqueta-cano",        name: "Enriqueta",                 period: "segunda" },
  { id: "joaquin-cano",          name: "Joaquín",                   period: "colon",    instruments: ["clarinete", "tuba"] },
  { id: "luis-cano",             name: "Luis",                      period: "colon",    instruments: ["bombardino"] },
  { id: "eraclio-cano",          name: "Eraclio",                   period: "colon",    instruments: ["saxofón", "clarinete"] },
  { id: "danielito-cano",        name: "\"Danielito\"",             period: "colon",    instruments: ["trombón"] },
  { id: "luis-alfonso-cano",     name: "Luis Alfonso",              period: "colon",    instruments: ["trompeta"] },
  { id: "cesar-augusto-cano",    name: "César Augusto",             period: "colon",    instruments: ["trompeta", "dir. artístico"] },
];

// ── Relations ─────────────────────────────────────────────────────────────────

export const RELATIONS: Relation[] = [
  // Main trunk
  { from: "narciso-paniagua",     to: "jose-maria-paniagua",   type: "parent" },

  // José María → main trunk children (others appear as section roots below)
  { from: "jose-maria-paniagua",  to: "faustino-sr",           type: "parent" },
  { from: "jose-maria-paniagua",  to: "marceliano-paniagua",   type: "parent" },
  { from: "jose-maria-paniagua",  to: "debora-paniagua",       type: "parent" },

  // Spouses
  { from: "faustino-sr",          to: "cruz-santa-paniagua",   type: "spouse" },
  { from: "faustino-jr",          to: "ma-jesus-ospina",       type: "spouse" },
  { from: "fortunato-paniagua",   to: "mercedes-ruiz",         type: "spouse" },
  { from: "marceliano-paniagua",  to: "ana-jesus-pulgarin",    type: "spouse" },
  { from: "debora-paniagua",      to: "juan-pablo-alvarez",    type: "spouse" },
  { from: "isac-paniagua",        to: "unknown-alvarez",       type: "spouse" },
  { from: "celsa-paniagua",       to: "pedro-angel-ospina",    type: "spouse" },
  { from: "efrain-alvarez",       to: "margarita-alvarez",     type: "spouse" },
  { from: "samuel-alvarez",       to: "elena-alvarez",         type: "spouse" },
  { from: "ma-patricia-alvarez",  to: "leonardo-cano",         type: "spouse" },
  { from: "daniel-paniagua",      to: "enriqueta-cano",        type: "spouse", notes: "también = Mercedes Cano" },

  // Faustino Sr → children
  { from: "faustino-sr",          to: "faustino-jr",           type: "parent" },
  { from: "faustino-sr",          to: "fortunato-paniagua",    type: "parent" },

  // Faustino Jr → children
  { from: "faustino-jr",          to: "roberto-paniagua",      type: "parent" },
  { from: "faustino-jr",          to: "samuel-faustino",       type: "parent" },

  // Fortunato → children
  { from: "fortunato-paniagua",   to: "ignacio-fortunato",     type: "parent" },
  { from: "fortunato-paniagua",   to: "ramon-fortunato",       type: "parent" },
  { from: "fortunato-paniagua",   to: "jose-nato-paniagua",    type: "parent" },
  { from: "fortunato-paniagua",   to: "gerardo-fortunato",     type: "parent" },

  // Marceliano → children
  { from: "marceliano-paniagua",  to: "gonzalo-paniagua",      type: "parent" },
  { from: "marceliano-paniagua",  to: "norberto-paniagua",     type: "parent" },
  { from: "marceliano-paniagua",  to: "gustavo-paniagua",      type: "parent" },
  { from: "marceliano-paniagua",  to: "raul-paniagua",         type: "parent" },

  // Gonzalo → children
  { from: "gonzalo-paniagua",     to: "ramiro-paniagua",       type: "parent" },

  // Débora → children
  { from: "debora-paniagua",      to: "serafin-alvarez",       type: "parent" },
  { from: "debora-paniagua",      to: "luis-angel-alvarez",    type: "parent" },
  { from: "debora-paniagua",      to: "abigail-alvarez",       type: "parent" },
  { from: "debora-paniagua",      to: "libardo-alvarez-deb",   type: "parent" },

  // Luis Ángel → children
  { from: "luis-angel-alvarez",   to: "ma-patricia-alvarez",   type: "parent" },
  { from: "ma-patricia-alvarez",  to: "carlos-mario-cano",     type: "parent" },

  // Brígido Sr → children
  { from: "brigido-sr",           to: "isac-paniagua",         type: "parent" },
  { from: "brigido-sr",           to: "celsa-paniagua",        type: "parent" },

  // Isac → children
  { from: "isac-paniagua",        to: "libardo-alvarez-isac",  type: "parent" },
  { from: "isac-paniagua",        to: "jesus-alvarez",         type: "parent" },
  { from: "isac-paniagua",        to: "felix-alvarez",         type: "parent" },
  { from: "isac-paniagua",        to: "ramon-alvarez-isac",    type: "parent" },

  // Celsa → children
  { from: "celsa-paniagua",       to: "joaquin-ospina",        type: "parent" },
  { from: "celsa-paniagua",       to: "miguel-angel-ospina",   type: "parent" },

  // Abelardo → children
  { from: "abelardo-paniagua",    to: "antonio-abelardo",      type: "parent" },
  { from: "abelardo-paniagua",    to: "aldemar-paniagua",      type: "parent" },

  // Antonio (son of Abelardo) → children
  { from: "antonio-abelardo",     to: "julio-antonio",         type: "parent" },
  { from: "antonio-abelardo",     to: "brigido-jr",            type: "parent" },
  { from: "antonio-abelardo",     to: "efrain-antonio",        type: "parent" },
  { from: "antonio-abelardo",     to: "ramon-angel-paniagua",  type: "parent" },

  // Alberto → descendants through Álvarez line
  { from: "alberto-paniagua",     to: "efrain-alvarez",        type: "parent" },
  { from: "efrain-alvarez",       to: "samuel-alvarez",        type: "parent" },
  { from: "samuel-alvarez",       to: "eladio-alvarez",        type: "parent" },
  { from: "samuel-alvarez",       to: "rodrigo-alvarez",       type: "parent" },
  { from: "rodrigo-alvarez",      to: "alejandro-alvarez",     type: "parent" },

  // Pedro Pablo → children
  { from: "pedro-pablo-paniagua", to: "martin-paniagua",       type: "parent" },

  // Jesús María → children
  { from: "jesus-maria-paniagua", to: "jesusito-paniagua",     type: "parent" },

  // Crispulo → children
  { from: "crispulo-paniagua",    to: "israel-paniagua",       type: "parent" },
  { from: "crispulo-paniagua",    to: "hipolito-paniagua",     type: "parent" },

  // Daniel → children
  { from: "daniel-paniagua",      to: "joaquin-cano",          type: "parent" },
  { from: "daniel-paniagua",      to: "luis-cano",             type: "parent" },
  { from: "daniel-paniagua",      to: "eraclio-cano",          type: "parent" },
  { from: "daniel-paniagua",      to: "danielito-cano",        type: "parent" },
  { from: "daniel-paniagua",      to: "luis-alfonso-cano",     type: "parent" },
  { from: "daniel-paniagua",      to: "cesar-augusto-cano",    type: "parent" },
];

// ── Section layout config ─────────────────────────────────────────────────────

export const SECTIONS: Section[] = [
  { title: null,                                          rootIds: ["narciso-paniagua"] },
  { title: "Rama Brígido / Álvarez",                     rootIds: ["brigido-sr"] },
  { title: "Rama Abelardo / Alberto / Paniagua",         rootIds: ["abelardo-paniagua", "alberto-paniagua"] },
  { title: "Rama Pedro Pablo / Otros hijos de José María", rootIds: ["delfin-paniagua", "pedro-pablo-paniagua", "jose-maria-jr", "jesus-maria-paniagua", "antonio-jm", "crispulo-paniagua"] },
  { title: "Rama Daniel Paniagua / Cano",                rootIds: ["daniel-paniagua"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function childrenOf(parentId: string): Person[] {
  return RELATIONS
    .filter(r => r.from === parentId && r.type === "parent")
    .map(r => PEOPLE.find(p => p.id === r.to))
    .filter((p): p is Person => p !== undefined);
}

export function spouseOf(personId: string): { person: Person; notes?: string } | null {
  const rel = RELATIONS.find(r => r.from === personId && r.type === "spouse");
  if (!rel) return null;
  const person = PEOPLE.find(p => p.id === rel.to);
  return person ? { person, notes: rel.notes } : null;
}
