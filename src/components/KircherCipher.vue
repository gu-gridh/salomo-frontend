<script>
/**
 * KircherCipher.vue
 *
 * Athanasius Kircher's "Alphabetum steganographicum musicum"
 * (Musurgia Universalis, Rome 1650, book IX, p. 362).
 *
 * Part 1 – the key: every letter on a staff; each note is a button that sounds.
 * Part 2 – the encoder: type a message, see it and hear it as notes.
 *
 * No dependencies. Engraving is plain SVG; sound is Web Audio.
 * The clef, flat and modern notehead outlines come from the Bravura
 * music font (Steinberg, SIL Open Font License).
 *
 * The cipher, as read from the 1650 figure: soprano C‑clef (C4 on the bottom
 * line) with one flat, so every B sounds as B♭. Square breves rise from a to m,
 * diamond semibreves fall from n to z. Kircher's Latin alphabet has no
 * j, k, v, w – here they borrow i, c, u, u and are shown in brackets.
 */
const BREVES     = { a: 'B3', b: 'C4', c: 'D4', d: 'E4', e: 'F4', f: 'G4', g: 'A4', h: 'B4', i: 'C5', l: 'D5', m: 'E5' }
const SEMIBREVES = { n: 'E5', o: 'D5', p: 'C5', q: 'B4', r: 'A4', s: 'G4', t: 'F4', u: 'E4', x: 'D4', y: 'C4', z: 'B3' }
const BORROWED   = { j: 'i', k: 'c', v: 'u', w: 'u' }
const LIGATURES  = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ð: 'd', þ: 't', ł: 'l' }

export const KIRCHER_TABLE = Object.freeze({ ...BREVES, ...SEMIBREVES })

function lookup(letter) {
  const base = BORROWED[letter] ?? letter
  if (BREVES[base])     return { pitch: BREVES[base],     value: 'breve',     base }
  if (SEMIBREVES[base]) return { pitch: SEMIBREVES[base], value: 'semibreve', base }
  return null
}

/** Reduce one character to plain a–z letters (å → a, é → e, æ → ae …). */
function plain(ch) {
  const lower = ch.toLowerCase()
  if (LIGATURES[lower]) return LIGATURES[lower]
  return lower.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Turn text into tokens: { type: 'note' | 'bar' | 'break' | 'gap' }.
 * Spaces are ignored (or become a small gap), “, ; :” draw a bar line,
 * “. ! ?” and new lines start a new staff. Anything else is skipped.
 */
export function encode(text, { wordGap = false } = {}) {
  const tokens = []
  const skipped = new Set()
  let pendingGap = false
  let n = 0
  for (const ch of text) {
    if (/\s/.test(ch)) { if (wordGap) pendingGap = true; continue }
    if (',;:'.includes(ch)) { tokens.push({ type: 'bar' }); pendingGap = false; continue }
    if ('.!?'.includes(ch)) { tokens.push({ type: 'break' }); pendingGap = false; continue }
    const letters = plain(ch)
    if (!/^[a-z]+$/.test(letters)) { skipped.add(ch); continue }
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]
      const hit = lookup(letter)
      if (pendingGap && tokens.length && tokens[tokens.length - 1].type === 'note') tokens.push({ type: 'gap' })
      pendingGap = false
      tokens.push({
        type: 'note', id: `n${n++}`, letter, shown: letters.length === 1 ? ch : letter,
        pitch: hit.pitch, value: hit.value, borrowed: letter !== hit.base,
      })
    }
  }
  return { tokens, skipped: [...skipped] }
}
</script>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue:  { type: String, default: undefined },   // optional v-model for the message
  initialText: { type: String, default: 'Barley' },
  title:       { type: String, default: 'Kircher’s music cipher' },
  subtitle:    { type: String, default: 'Alphabetum steganographicum musicum, from Musurgia Universalis, Rome 1650' },
  notation:    { type: String, default: 'original' },  // 'original' (breves and semibreves, C clef) | 'modern' (treble clef)
  tempo:       { type: Number, default: 120 },         // beats per minute; one beat = one semibreve
  staffSpace:  { type: Number, default: 12 },          // px between staff lines
  wordGap:     { type: Boolean, default: false },      // leave a small gap between words
  theme:       { type: String, default: 'auto' },      // 'auto' | 'light' | 'dark'
})
const emit = defineEmits(['update:modelValue', 'play', 'encode'])

const innerText = ref(props.modelValue ?? props.initialText)
const text = computed({
  get: () => (props.modelValue !== undefined ? props.modelValue : innerText.value),
  set: (v) => { innerText.value = v; emit('update:modelValue', v) },
})
const notation = ref(props.notation)
const bpm = ref(props.tempo)
watch(() => props.notation, (v) => { notation.value = v })
watch(() => props.tempo, (v) => { bpm.value = v })

const uid = `kc${Math.random().toString(36).slice(2, 8)}`

/* ── Engraving ───────────────────────────────────────────────── */
const GLYPHS = {
  gClef: 'M1.504 -1.66C1.496 -1.708 1.504 -1.712 1.528 -1.736C1.592 -1.796 1.676 -1.88 1.752 -1.964C2.088 -2.332 2.288 -2.808 2.288 -3.26C2.288 -3.608 2.192 -3.952 2.028 -4.192C1.968 -4.28 1.864 -4.392 1.82 -4.392C1.764 -4.392 1.64 -4.288 1.56 -4.2C1.264 -3.872 1.168 -3.372 1.168 -2.956C1.168 -2.724 1.196 -2.464 1.224 -2.3C1.232 -2.252 1.236 -2.244 1.188 -2.204C0.932 -1.992 0.656 -1.748 0.448 -1.492C0.172 -1.148 0 -0.776 0 -0.348C0 0.348 0.476 1.008 1.456 1.008C1.548 1.008 1.652 1 1.732 0.984C1.776 0.976 1.784 0.972 1.792 1.02C1.84 1.288 1.9 1.636 1.9 1.824C1.9 2.416 1.5 2.488 1.264 2.488C1.048 2.488 0.944 2.424 0.944 2.372C0.944 2.344 0.98 2.332 1.072 2.304C1.196 2.268 1.34 2.16 1.34 1.928C1.34 1.708 1.2 1.52 0.956 1.52C0.688 1.52 0.528 1.732 0.528 1.98C0.528 2.24 0.684 2.632 1.288 2.632C1.556 2.632 2.076 2.512 2.076 1.832C2.076 1.604 2.004 1.224 1.96 0.976C1.952 0.928 1.956 0.932 2.012 0.908C2.416 0.748 2.684 0.408 2.684 -0.044C2.684 -0.556 2.308 -1.008 1.72 -1.008C1.616 -1.008 1.616 -1.008 1.604 -1.08ZM1.88 -3.772C2.012 -3.772 2.12 -3.664 2.12 -3.444C2.12 -3.168 1.988 -2.912 1.676 -2.6C1.612 -2.536 1.516 -2.444 1.424 -2.364C1.396 -2.34 1.38 -2.344 1.372 -2.396C1.356 -2.5 1.348 -2.636 1.348 -2.764C1.348 -3.388 1.636 -3.772 1.88 -3.772ZM1.444 -1.048C1.456 -0.972 1.456 -0.976 1.384 -0.952C1.032 -0.832 0.804 -0.516 0.804 -0.176C0.804 0.184 0.992 0.44 1.264 0.532C1.296 0.544 1.344 0.556 1.372 0.556C1.404 0.556 1.42 0.536 1.42 0.512C1.42 0.484 1.388 0.472 1.36 0.46C1.192 0.388 1.072 0.216 1.072 0.032C1.072 -0.196 1.228 -0.368 1.472 -0.436C1.536 -0.452 1.544 -0.448 1.552 -0.404L1.752 0.788C1.76 0.832 1.756 0.832 1.696 0.844C1.632 0.856 1.552 0.864 1.472 0.864C0.772 0.864 0.32 0.476 0.32 -0.08C0.32 -0.316 0.36 -0.632 0.692 -1.008C0.932 -1.276 1.116 -1.424 1.304 -1.576C1.344 -1.608 1.352 -1.604 1.36 -1.56ZM1.72 -0.412C1.712 -0.46 1.716 -0.472 1.764 -0.468C2.088 -0.44 2.356 -0.168 2.356 0.184C2.356 0.436 2.204 0.64 1.98 0.752C1.932 0.776 1.924 0.776 1.916 0.728Z',
  cClef: 'M0.92 -1.928C0.92 -1.984 0.892 -2.012 0.836 -2.012H0.832C0.776 -2.012 0.748 -1.984 0.748 -1.928V1.928C0.748 1.984 0.776 2.012 0.832 2.012H0.836C0.892 2.012 0.92 1.984 0.92 1.928V0.176C0.92 0.144 0.94 0.148 0.956 0.152C1.06 0.18 1.228 0.284 1.312 0.736C1.324 0.8 1.348 0.836 1.388 0.836C1.432 0.836 1.452 0.796 1.472 0.728C1.524 0.552 1.616 0.356 1.9 0.356C2.16 0.356 2.232 0.612 2.232 1.136C2.232 1.66 2.14 1.896 1.808 1.896C1.72 1.896 1.64 1.884 1.576 1.864C1.508 1.844 1.468 1.816 1.468 1.788C1.468 1.768 1.532 1.744 1.576 1.728C1.656 1.7 1.736 1.62 1.736 1.468C1.736 1.292 1.62 1.192 1.464 1.192C1.292 1.192 1.156 1.308 1.156 1.52C1.156 1.772 1.376 2.024 1.852 2.024C2.508 2.024 2.796 1.564 2.796 1.148C2.796 0.596 2.492 0.212 1.96 0.212C1.844 0.212 1.768 0.232 1.716 0.248C1.696 0.256 1.672 0.26 1.652 0.26C1.636 0.26 1.616 0.256 1.6 0.244C1.544 0.208 1.456 0.08 1.456 0C1.456 -0.08 1.544 -0.208 1.6 -0.244C1.616 -0.256 1.636 -0.26 1.652 -0.26C1.672 -0.26 1.696 -0.256 1.716 -0.248C1.768 -0.232 1.844 -0.212 1.96 -0.212C2.492 -0.212 2.796 -0.596 2.796 -1.148C2.796 -1.564 2.508 -2.024 1.852 -2.024C1.376 -2.024 1.156 -1.772 1.156 -1.52C1.156 -1.308 1.292 -1.192 1.464 -1.192C1.62 -1.192 1.736 -1.292 1.736 -1.468C1.736 -1.62 1.656 -1.7 1.576 -1.728C1.532 -1.744 1.468 -1.768 1.468 -1.788C1.468 -1.816 1.508 -1.844 1.576 -1.864C1.64 -1.884 1.72 -1.896 1.808 -1.896C2.14 -1.896 2.232 -1.66 2.232 -1.136C2.232 -0.612 2.16 -0.356 1.9 -0.356C1.616 -0.356 1.524 -0.552 1.472 -0.728C1.452 -0.796 1.432 -0.836 1.388 -0.836C1.348 -0.836 1.324 -0.8 1.312 -0.736C1.228 -0.284 1.06 -0.18 0.956 -0.152C0.94 -0.148 0.92 -0.144 0.92 -0.176ZM0.084 -2.012C0.028 -2.012 0 -1.984 0 -1.928V1.928C0 1.984 0.028 2.012 0.084 2.012H0.428C0.484 2.012 0.512 1.984 0.512 1.928V-1.928C0.512 -1.984 0.484 -2.012 0.428 -2.012Z',
  flat: 'M0.048 0.68C0.06 0.696 0.072 0.7 0.084 0.7C0.096 0.7 0.108 0.692 0.108 0.692C0.228 0.624 0.324 0.516 0.424 0.448C0.78 0.2 0.904 -0.044 0.904 -0.228C0.904 -0.456 0.728 -0.6 0.544 -0.612C0.516 -0.612 0.488 -0.608 0.46 -0.6C0.416 -0.588 0.368 -0.572 0.324 -0.544C0.3 -0.524 0.256 -0.488 0.236 -0.488C0.228 -0.488 0.224 -0.488 0.216 -0.492C0.188 -0.504 0.172 -0.532 0.172 -0.56C0.176 -0.648 0.2 -1.608 0.2 -1.688C0.2 -1.732 0.164 -1.756 0.124 -1.756C0.068 -1.756 0.004 -1.716 0 -1.644C0 -1.644 0.016 0.64 0.048 0.68ZM0.188 0.324C0.188 0.324 0.176 0.084 0.176 -0.076C0.176 -0.14 0.18 -0.188 0.184 -0.204C0.2 -0.252 0.304 -0.34 0.36 -0.372C0.396 -0.392 0.432 -0.4 0.464 -0.4C0.504 -0.4 0.54 -0.384 0.564 -0.356C0.604 -0.312 0.628 -0.244 0.628 -0.168C0.628 -0.096 0.608 -0.012 0.56 0.072C0.508 0.168 0.392 0.296 0.272 0.372C0.256 0.38 0.244 0.384 0.232 0.384C0.196 0.384 0.188 0.344 0.188 0.324Z',
  noteheadHalf: 'M0.388 0.5C1.048 0.5 1.18 -0.036 1.18 -0.168C1.18 -0.372 1.016 -0.5 0.784 -0.5C0.188 -0.5 0 -0.04 0 0.168C0 0.38 0.168 0.5 0.388 0.5ZM0.692 0.184C0.512 0.304 0.388 0.348 0.3 0.348C0.216 0.348 0.168 0.304 0.14 0.256C0.128 0.232 0.116 0.204 0.116 0.176C0.116 0.088 0.204 -0.02 0.48 -0.18C0.68 -0.296 0.804 -0.336 0.884 -0.336C0.96 -0.336 1.004 -0.3 1.032 -0.252C1.044 -0.228 1.056 -0.204 1.056 -0.176C1.056 -0.096 0.972 0 0.692 0.184Z',
  noteheadBlack: 'M0.388 0.5C0.744 0.5 1.18 0.172 1.18 -0.168C1.18 -0.372 1.02 -0.5 0.792 -0.5C0.352 -0.5 0 -0.176 0 0.168C0 0.376 0.172 0.5 0.388 0.5Z',
}

const width = ref(720)
// Staff space in px. On narrow screens it shrinks (down to 8px) so that each
// half of the alphabet – 11 notes – still fits on one line of the key.
const S     = computed(() => Math.max(8, Math.min(props.staffSpace, (width.value - 4) / (11 * 2.5 + 5.6 + 1.6))))
const COL   = computed(() => 2.5 * S.value)   // horizontal room per note
const LEAD  = computed(() => 5.6 * S.value)   // clef + flat
const PAD_R = computed(() => 1.6 * S.value)
const BAR_W = computed(() => 1.1 * S.value)
const GAP_W = computed(() => 0.9 * S.value)
const FONT  = computed(() => Math.max(11, 1.15 * S.value))

const STEPS = 'CDEFGAB'
const diatonic = (pitch) => Number(pitch[1]) * 7 + STEPS.indexOf(pitch[0])

const geo = computed(() => notation.value === 'modern'
  ? { clef: 'gClef', clefPos: 2, bottom: diatonic('E4'), flatPos: 4, above: 2.2, below: 2.6 }
  : { clef: 'cClef', clefPos: 0, bottom: diatonic('C4'), flatPos: 6, above: 2.1, below: 2.4 })

const measureEl = ref(null)
let ro = null
onMounted(() => {
  const measure = () => { if (measureEl.value) width.value = Math.max(240, measureEl.value.clientWidth) }
  measure()
  if ('ResizeObserver' in window) { ro = new ResizeObserver(measure); ro.observe(measureEl.value) }
  else window.addEventListener('resize', measure)
})
onBeforeUnmount(() => { ro?.disconnect(); stop() })

/** Break tokens into systems that fit the width and place every token. */
function layout(tokens, { keepTogether = false } = {}) {
  const s = S.value, g = geo.value
  const sysH = (g.above + 4 + g.below + 2.4) * s
  const maxX = width.value - PAD_R.value
  const tokenW = (t) => t.type === 'note' ? COL.value : t.type === 'bar' ? BAR_W.value : t.type === 'gap' ? GAP_W.value : 0

  // the key prefers one break, between the rising and the falling half
  if (keepTogether) {
    const total = LEAD.value + tokens.reduce((w, t) => w + tokenW(t), 0)
    tokens = tokens.map((t) => (t.type === 'softbreak' ? (total > maxX ? { type: 'break' } : null) : t)).filter(Boolean)
  }

  const systems = []
  let cur = null
  const open = () => { cur = { x: LEAD.value, items: [] }; systems.push(cur) }
  open()
  for (const t of tokens) {
    if (t.type === 'break') { if (cur.items.length) open(); continue }
    const w = tokenW(t)
    if (t.type === 'note' && cur.x + w > maxX && cur.items.length) open()
    if (t.type !== 'note' && !cur.items.length) continue        // no bar line or gap at the start of a system
    const item = { ...t, x: cur.x + w / 2, w }
    if (t.type === 'note') item.pos = diatonic(t.pitch) - g.bottom
    cur.items.push(item)
    cur.x += w
  }
  if (systems.length > 1 && !systems[systems.length - 1].items.length) systems.pop()
  return {
    sysH,
    height: systems.length * sysH,
    systems: systems.map((sys, i) => ({
      items: sys.items,
      top: i * sysH,
      last: i === systems.length - 1,
      endX: Math.max(sys.x, LEAD.value + COL.value),
      yLine: (p) => i * sysH + (g.above + 4) * s - (p * s) / 2,   // y of a diatonic position (0 = bottom line)
    })),
  }
}

const keyTokens = computed(() => {
  const out = []
  for (const l of Object.keys(BREVES)) out.push({ type: 'note', id: `k${l}`, letter: l, shown: l, pitch: BREVES[l], value: 'breve', borrowed: false })
  out.push({ type: 'softbreak' })
  for (const l of Object.keys(SEMIBREVES)) out.push({ type: 'note', id: `k${l}`, letter: l, shown: l, pitch: SEMIBREVES[l], value: 'semibreve', borrowed: false })
  return out
})
const standsIn = { i: 'j', c: 'k', u: 'v w' }   // shown under the key
const legend = computed(() => notation.value === 'modern'
  ? [{ swatch: 'half', text: 'Half notes rise from a to m' }, { swatch: 'quarter', text: 'Quarter notes fall from n to z' }]
  : [{ swatch: 'breve', text: 'Breves rise from a to m' }, { swatch: 'semibreve', text: 'Semibreves fall from n to z' }])

const encoded = computed(() => encode(text.value, { wordGap: props.wordGap }))
watch(encoded, (e) => emit('encode', e.tokens), { immediate: true })

const keyLayout = computed(() => layout(keyTokens.value, { keepTogether: true }))
const msgLayout = computed(() => layout(encoded.value.tokens))
const hasNotes  = computed(() => encoded.value.tokens.some((t) => t.type === 'note'))

const stemUp = (pos) => pos < 4
function ledgers(pos) {
  const out = []
  for (let p = -2; p >= pos; p -= 2) out.push(p)
  for (let p = 10; p <= pos; p += 2) out.push(p)
  return out
}
const stemX = (t) => t.x + (stemUp(t.pos) ? 0.53 : -0.53) * S.value
const dotY = (t, sys) => notation.value === 'modern' && stemUp(t.pos)
  ? sys.yLine(t.pos) + 0.95 * S.value
  : sys.yLine(Math.max(t.pos, 8)) - 1.0 * S.value
const letterY = (sys) => sys.yLine(0) + (geo.value.below + 1.15) * S.value
const diamond = (t, sys) => {
  const s = S.value, y = sys.yLine(t.pos)
  return `M${t.x} ${y - 0.55 * s} L${t.x + 0.62 * s} ${y} L${t.x} ${y + 0.55 * s} L${t.x - 0.62 * s} ${y} Z`
}
const noteLabel = (t) =>
  `${t.shown}${t.borrowed ? ' (stands in for ' + BORROWED[t.letter] + ')' : ''}: ${t.pitch[0]}${t.pitch[0] === 'B' ? ' flat' : ''} ${t.pitch[1]}, ${t.value}`

/* ── Sound ───────────────────────────────────────────────────── */
let ctx = null
let live = []
let raf = 0
const playing = ref(false)
const activeId = ref(null)

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
const SEMIS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 1 /* B♭ */ }
const freqOf = (pitch) => 440 * 2 ** ((SEMIS[pitch[0]] + 12 * (Number(pitch[1]) - 4)) / 12)
const beat = () => 60 / bpm.value
const beatsOf = (t) => (t.value === 'breve' ? 2 : 1)
const soundingSeconds = (t) => beatsOf(t) * beat() * (t.borrowed ? 0.6 : 1)

function voice(freq, at, dur) {
  const ac = audio()
  const out = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'; filter.frequency.value = 1800; filter.Q.value = 0.6
  const o1 = ac.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq
  const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2
  const g2 = ac.createGain(); g2.gain.value = 0.18
  o1.connect(filter); o2.connect(g2).connect(filter); filter.connect(out).connect(ac.destination)

  const end = at + dur
  const atk = Math.min(0.015, dur * 0.2), dec = Math.min(0.25, dur * 0.5), rel = Math.min(0.12, dur * 0.3)
  out.gain.setValueAtTime(0.0001, at)
  out.gain.exponentialRampToValueAtTime(0.32, at + atk)
  out.gain.exponentialRampToValueAtTime(0.22, at + atk + dec)
  out.gain.setValueAtTime(0.22, end - rel)
  out.gain.exponentialRampToValueAtTime(0.0001, end)
  o1.start(at); o2.start(at); o1.stop(end + 0.05); o2.stop(end + 0.05)

  const v = {
    kill() {
      try {
        const now = ac.currentTime
        out.gain.cancelScheduledValues(now)
        out.gain.setTargetAtTime(0.0001, now, 0.02)
        o1.stop(now + 0.1); o2.stop(now + 0.1)
      } catch { /* already stopped */ }
    },
  }
  o1.onended = () => { live = live.filter((x) => x !== v) }
  live.push(v)
  return v
}

function stop() {
  live.forEach((v) => v.kill()); live = []
  cancelAnimationFrame(raf)
  playing.value = false
  activeId.value = null
}

/** Sound one note (a click on the key or on the message). */
function playOne(t) {
  stop()
  const ac = audio()
  const dur = soundingSeconds(t)
  voice(freqOf(t.pitch), ac.currentTime, dur)
  activeId.value = t.id
  emit('play', { letter: t.letter, pitch: t.pitch, value: t.value })
  const until = ac.currentTime + dur
  const tick = () => { if (ac.currentTime < until) raf = requestAnimationFrame(tick); else activeId.value = null }
  raf = requestAnimationFrame(tick)
}

/** Play the whole message (or stop it). */
function play() {
  if (playing.value) return stop()
  const notes = []
  let t = 0
  for (const tok of encoded.value.tokens) {
    if (tok.type === 'note') {
      const full = beatsOf(tok) * beat()
      notes.push({ id: tok.id, start: t, end: t + full, dur: soundingSeconds(tok), pitch: tok.pitch })
      t += full
    } else if (tok.type === 'bar') t += beat() * 0.5
    else if (tok.type === 'break') t += beat()
  }
  if (!notes.length) return
  stop()
  const ac = audio()
  const t0 = ac.currentTime + 0.05
  notes.forEach((n) => voice(freqOf(n.pitch), t0 + n.start, n.dur))
  playing.value = true
  const tick = () => {
    const now = ac.currentTime - t0
    const cur = notes.find((n) => now >= n.start && now < n.end)
    activeId.value = cur ? cur.id : null
    if (now < notes[notes.length - 1].end) raf = requestAnimationFrame(tick)
    else { playing.value = false; activeId.value = null }
  }
  raf = requestAnimationFrame(tick)
}

defineExpose({ play, stop })
</script>

<template>
  <section class="kc" :class="[`kc--${theme}`, { 'kc--modern': notation === 'modern' }]">
    <header v-if="title" class="kc-head">
      <h2 class="kc-title">{{ title }}</h2>
      <p v-if="subtitle" class="kc-sub">{{ subtitle }}</p>
    </header>

    <!-- Part 1: the key -->
    <div ref="measureEl" class="kc-part">
      <p class="kc-hint">Tap a note to hear it.</p>
      <svg
        class="kc-staff" :width="width" :height="keyLayout.height" :viewBox="`0 0 ${width} ${keyLayout.height}`"
        role="group" aria-label="The cipher key: one note for every letter"
      >
        <g v-for="(sys, si) in keyLayout.systems" :key="si">
          <line v-for="l in 5" :key="l" class="kc-line" x1="0" :x2="sys.last ? sys.endX + PAD_R * 0.6 : width" :y1="sys.yLine((l - 1) * 2)" :y2="sys.yLine((l - 1) * 2)" />
          <path class="kc-glyph" :d="GLYPHS[geo.clef]" :transform="`translate(${0.6 * S} ${sys.yLine(geo.clefPos)}) scale(${S})`" />
          <path class="kc-glyph" :d="GLYPHS.flat" :transform="`translate(${3.8 * S} ${sys.yLine(geo.flatPos)}) scale(${S})`" />
          <g v-if="sys.last" class="kc-end">
            <line :x1="sys.endX + PAD_R * 0.1" :x2="sys.endX + PAD_R * 0.1" :y1="sys.yLine(8)" :y2="sys.yLine(0)" />
            <line :x1="sys.endX + PAD_R * 0.6" :x2="sys.endX + PAD_R * 0.6" :y1="sys.yLine(8)" :y2="sys.yLine(0)" />
          </g>

          <g
            v-for="t in sys.items" :key="t.id"
            class="kc-note" :class="{ 'is-active': activeId === t.id }"
            tabindex="0" role="button" :aria-label="noteLabel(t)"
            @click="playOne(t)" @keydown.enter.prevent="playOne(t)" @keydown.space.prevent="playOne(t)"
          >
            <rect class="kc-hit" :x="t.x - COL / 2" :y="sys.top + 0.4 * S" :width="COL" :height="keyLayout.sysH - 0.8 * S" rx="6" />
            <template v-if="notation === 'modern'">
              <line v-for="p in ledgers(t.pos)" :key="p" class="kc-ledger" :x1="t.x - 0.95 * S" :x2="t.x + 0.95 * S" :y1="sys.yLine(p)" :y2="sys.yLine(p)" />
              <line class="kc-stem" :x1="stemX(t)" :x2="stemX(t)" :y1="sys.yLine(t.pos)" :y2="sys.yLine(t.pos) + (stemUp(t.pos) ? -3.4 : 3.4) * S" />
              <path class="kc-head" :d="t.value === 'breve' ? GLYPHS.noteheadHalf : GLYPHS.noteheadBlack" :transform="`translate(${t.x - 0.59 * S} ${sys.yLine(t.pos)}) scale(${S})`" />
            </template>
            <template v-else>
              <rect v-if="t.value === 'breve'" class="kc-head kc-head--shape" :x="t.x - 0.72 * S" :y="sys.yLine(t.pos) - 0.46 * S" :width="1.44 * S" :height="0.92 * S" rx="1.5" />
              <path v-else class="kc-head kc-head--shape" :d="diamond(t, sys)" />
            </template>
            <text class="kc-letter" :x="t.x" :y="letterY(sys)" :font-size="FONT">{{ t.shown }}</text>
            <text v-if="standsIn[t.letter]" class="kc-stands" :x="t.x" :y="letterY(sys) + 1.05 * S" :font-size="FONT * 0.8">{{ standsIn[t.letter] }}</text>
          </g>
        </g>
      </svg>
      <ul class="kc-legend">
        <li v-for="item in legend" :key="item.swatch">
          <svg class="kc-sw" viewBox="-11 -11 22 22" aria-hidden="true">
            <rect v-if="item.swatch === 'breve'" x="-8" y="-5" width="16" height="10" rx="1.5" />
            <path v-else-if="item.swatch === 'semibreve'" d="M0 -7 L7 0 L0 7 L-7 0 Z" />
            <g v-else :transform="`translate(-6.5 4) scale(10)`">
              <path :d="item.swatch === 'half' ? GLYPHS.noteheadHalf : GLYPHS.noteheadBlack" />
              <line x1="1.13" x2="1.13" y1="0" y2="-1.4" stroke="currentColor" stroke-width="0.12" />
            </g>
          </svg>
          {{ item.text }}
        </li>
        <li><svg class="kc-sw" viewBox="-11 -11 22 22" aria-hidden="true"><path :d="GLYPHS.flat" transform="translate(-4 3) scale(9)" /></svg>Every B is a B flat</li>
        <li>No j, k, v or w in 1650: they borrow i, c, u and u</li>
      </ul>
    </div>

    <!-- Part 2: the encoder -->
    <div class="kc-part">
      <label class="kc-label" :for="uid + '-in'">Your message</label>
      <div class="kc-row">
        <input
          :id="uid + '-in'" v-model="text" class="kc-input" type="text" autocomplete="off" spellcheck="false"
          placeholder="Type something to encipher" @keydown.enter="hasNotes && play()"
        />
        <button class="kc-play" type="button" :disabled="!hasNotes" @click="play">
          <svg v-if="!playing" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>
          <svg v-else viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5" /></svg>
          {{ playing ? 'Stop' : 'Play' }}
        </button>
      </div>

      <svg
        class="kc-staff kc-staff--message" :width="width" :height="msgLayout.height" :viewBox="`0 0 ${width} ${msgLayout.height}`"
        role="group" aria-label="Your message as notes"
      >
        <g v-for="(sys, si) in msgLayout.systems" :key="si">
          <line v-for="l in 5" :key="l" class="kc-line" x1="0" :x2="sys.last && hasNotes ? sys.endX + PAD_R * 0.6 : width" :y1="sys.yLine((l - 1) * 2)" :y2="sys.yLine((l - 1) * 2)" />
          <path class="kc-glyph" :d="GLYPHS[geo.clef]" :transform="`translate(${0.6 * S} ${sys.yLine(geo.clefPos)}) scale(${S})`" />
          <path class="kc-glyph" :d="GLYPHS.flat" :transform="`translate(${3.8 * S} ${sys.yLine(geo.flatPos)}) scale(${S})`" />
          <g v-if="sys.last && hasNotes" class="kc-end">
            <line :x1="sys.endX + PAD_R * 0.1" :x2="sys.endX + PAD_R * 0.1" :y1="sys.yLine(8)" :y2="sys.yLine(0)" />
            <line :x1="sys.endX + PAD_R * 0.6" :x2="sys.endX + PAD_R * 0.6" :y1="sys.yLine(8)" :y2="sys.yLine(0)" />
          </g>
          <text v-if="!hasNotes" class="kc-empty" :x="LEAD + S" :y="sys.yLine(4)" :font-size="FONT">Your message will appear here as notes.</text>

          <template v-for="(t, ti) in sys.items" :key="t.id ?? `${si}-${ti}`">
            <line v-if="t.type === 'bar'" class="kc-bar" :x1="t.x" :x2="t.x" :y1="sys.yLine(8)" :y2="sys.yLine(0)" />
            <g
              v-else-if="t.type === 'note'"
              class="kc-note" :class="{ 'is-active': activeId === t.id, 'is-borrowed': t.borrowed }"
              tabindex="0" role="button" :aria-label="noteLabel(t)"
              @click="playOne(t)" @keydown.enter.prevent="playOne(t)" @keydown.space.prevent="playOne(t)"
            >
              <rect class="kc-hit" :x="t.x - COL / 2" :y="sys.top + 0.4 * S" :width="COL" :height="msgLayout.sysH - 0.8 * S" rx="6" />
              <template v-if="notation === 'modern'">
                <line v-for="p in ledgers(t.pos)" :key="p" class="kc-ledger" :x1="t.x - 0.95 * S" :x2="t.x + 0.95 * S" :y1="sys.yLine(p)" :y2="sys.yLine(p)" />
                <line class="kc-stem" :x1="stemX(t)" :x2="stemX(t)" :y1="sys.yLine(t.pos)" :y2="sys.yLine(t.pos) + (stemUp(t.pos) ? -3.4 : 3.4) * S" />
                <path class="kc-head" :d="t.value === 'breve' ? GLYPHS.noteheadHalf : GLYPHS.noteheadBlack" :transform="`translate(${t.x - 0.59 * S} ${sys.yLine(t.pos)}) scale(${S})`" />
              </template>
              <template v-else>
                <rect v-if="t.value === 'breve'" class="kc-head kc-head--shape" :x="t.x - 0.72 * S" :y="sys.yLine(t.pos) - 0.46 * S" :width="1.44 * S" :height="0.92 * S" rx="1.5" />
                <path v-else class="kc-head kc-head--shape" :d="diamond(t, sys)" />
              </template>
              <circle v-if="t.borrowed" class="kc-dot" :cx="t.x" :cy="dotY(t, sys)" :r="0.17 * S" />
              <text class="kc-letter" :x="t.x" :y="letterY(sys)" :font-size="FONT">{{ t.borrowed ? `(${t.shown})` : t.shown }}</text>
            </g>
          </template>
        </g>
      </svg>
      <p v-if="encoded.skipped.length" class="kc-skipped">Only letters become notes. Skipped: {{ encoded.skipped.join(', ') }}</p>

      <div class="kc-controls">
        <div class="kc-seg" role="group" aria-label="Notation">
          <button type="button" :class="{ 'is-on': notation === 'original' }" :aria-pressed="notation === 'original'" @click="notation = 'original'">Original</button>
          <button type="button" :class="{ 'is-on': notation === 'modern' }" :aria-pressed="notation === 'modern'" @click="notation = 'modern'">Modern</button>
        </div>
        <label class="kc-tempo">
          <span>Tempo</span>
          <input v-model.number="bpm" type="range" min="50" max="240" step="5" />
          <output>{{ bpm }}</output>
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.kc {
  --kc-bg: #fff;
  --kc-ink: #121a1a;
  --kc-muted: #5c6763;
  --kc-line: #a9b1ab;
  --kc-rule: #d7dbd6;
  --kc-field: #ffffff;
  --kc-accent: #0e7c86;
  --kc-accent-ink: #ffffff;
  --kc-accent-soft: rgba(14, 124, 134, 0.14);
  --kc-radius: 10px;
  --kc-font: inherit;

  box-sizing: border-box;
  container-type: inline-size;
  font-family: var(--kc-font);
  color: var(--kc-ink);
  background: var(--kc-bg);
  border-radius: var(--kc-radius);
  padding: clamp(16px, 3vw, 28px);
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
.kc--dark {
  --kc-bg: #141918;
  --kc-ink: #eaeeea;
  --kc-muted: #98a39e;
  --kc-line: #4e5955;
  --kc-rule: #2b3330;
  --kc-field: #1d2422;
  --kc-accent: #3fc1c9;
  --kc-accent-ink: #0b1414;
  --kc-accent-soft: rgba(63, 193, 201, 0.18);
}
@media (prefers-color-scheme: dark) {
  .kc--auto {
    --kc-bg: #141918;
    --kc-ink: #eaeeea;
    --kc-muted: #98a39e;
    --kc-line: #4e5955;
    --kc-rule: #2b3330;
    --kc-field: #1d2422;
    --kc-accent: #3fc1c9;
    --kc-accent-ink: #0b1414;
    --kc-accent-soft: rgba(63, 193, 201, 0.18);
  }
}
.kc *, .kc *::before, .kc *::after { box-sizing: inherit; }

.kc-head { margin: 0 0 16px; }
.kc-title { margin: 0; font-size: clamp(20px, 2.6vw, 26px); font-weight: 650; letter-spacing: -0.015em; line-height: 1.15; }
.kc-sub { margin: 4px 0 0; color: var(--kc-muted); font-size: 14px; }

.kc-part + .kc-part { border-top: 1px solid var(--kc-rule); margin-top: 22px; padding-top: 22px; }
.kc-hint { margin: 0 0 2px; color: var(--kc-muted); font-size: 14px; }

/* staff */
.kc-staff { display: block; max-width: 100%; overflow: visible; }
.kc-line { stroke: var(--kc-line); stroke-width: 1; shape-rendering: crispEdges; }
.kc-glyph { fill: var(--kc-ink); }
.kc-bar { stroke: var(--kc-ink); stroke-width: 1.2; }
.kc-end line { stroke: var(--kc-ink); stroke-width: 1.2; }
.kc-end line:last-child { stroke-width: 3; }
.kc-empty { fill: var(--kc-muted); dominant-baseline: middle; }

.kc-note { cursor: pointer; outline: none; }
.kc-hit { fill: transparent; pointer-events: all; stroke: transparent; stroke-width: 1.5; transition: fill 120ms ease, stroke 120ms ease; }
.kc-note:hover .kc-hit, .kc-note:focus-visible .kc-hit { fill: var(--kc-accent-soft); }
.kc-note:focus-visible .kc-hit { stroke: var(--kc-accent); }
.kc-head { fill: var(--kc-ink); transition: fill 120ms ease; pointer-events: none; }
.kc-head--shape { stroke: var(--kc-bg); stroke-width: 1.2; paint-order: stroke; }
.kc-stem { stroke: var(--kc-ink); stroke-width: 1.3; pointer-events: none; transition: stroke 120ms ease; }
.kc-ledger { stroke: var(--kc-line); stroke-width: 1.2; pointer-events: none; }
.kc-dot { fill: var(--kc-muted); pointer-events: none; }
.kc-letter { fill: var(--kc-ink); font-weight: 550; text-anchor: middle; pointer-events: none; transition: fill 120ms ease; }
.kc-note.is-borrowed .kc-letter { fill: var(--kc-muted); font-weight: 500; }
.kc-stands { fill: var(--kc-muted); text-anchor: middle; pointer-events: none; }

.kc-note.is-active .kc-head { fill: var(--kc-accent); }
.kc-note.is-active .kc-stem { stroke: var(--kc-accent); }
.kc-note.is-active .kc-letter { fill: var(--kc-accent); }
.kc-note.is-active .kc-hit { fill: var(--kc-accent-soft); }
@media (prefers-reduced-motion: reduce) { .kc-hit, .kc-head, .kc-stem, .kc-letter { transition: none; } }

/* legend */
.kc-legend { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 22px; color: var(--kc-muted); font-size: 13.5px; }
.kc-legend li { display: inline-flex; align-items: center; gap: 8px; }
.kc-sw { flex: none; width: 20px; height: 20px; fill: var(--kc-ink); color: var(--kc-ink); }

/* encoder */
.kc-label { display: block; font-size: 14px; color: var(--kc-muted); margin-bottom: 6px; }
.kc-row { display: flex; gap: 10px; align-items: stretch; }
.kc-input {
  flex: 1; min-width: 0; font: inherit; font-size: 17px; color: var(--kc-ink);
  background: var(--kc-field); border: 1px solid var(--kc-rule); border-radius: 8px; padding: 10px 14px;
  outline: none; transition: border-color 120ms ease, box-shadow 120ms ease;
}
.kc-input::placeholder { color: var(--kc-muted); opacity: 0.8; }
.kc-input:focus-visible { border-color: var(--kc-accent); box-shadow: 0 0 0 3px var(--kc-accent-soft); }
.kc-play {
  display: inline-flex; align-items: center; gap: 8px; font: inherit; font-size: 15px; font-weight: 600;
  color: var(--kc-accent-ink); background: var(--kc-accent); border: 0; border-radius: 8px; padding: 0 18px 0 14px;
  cursor: pointer; transition: filter 120ms ease, transform 80ms ease;
}
.kc-play svg { width: 14px; height: 14px; fill: currentColor; }
.kc-play:hover { filter: brightness(1.08); }
.kc-play:active { transform: translateY(1px); }
.kc-play:disabled { opacity: 0.45; cursor: default; filter: none; transform: none; }
.kc-play:focus-visible { outline: 2px solid var(--kc-ink); outline-offset: 2px; }
.kc-staff--message { margin-top: 6px; }
.kc-skipped { margin: 0; color: var(--kc-muted); font-size: 13.5px; }

.kc-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 28px; margin-top: 14px; }
.kc-seg { display: inline-flex; border: 1px solid var(--kc-rule); border-radius: 8px; padding: 3px; background: var(--kc-field); }
.kc-seg button {
  font: inherit; font-size: 14px; font-weight: 550; color: var(--kc-muted); background: transparent; border: 0;
  border-radius: 6px; padding: 5px 12px; cursor: pointer; transition: background 120ms ease, color 120ms ease;
}
.kc-seg button.is-on { background: var(--kc-ink); color: var(--kc-bg); }
.kc-seg button:focus-visible { outline: 2px solid var(--kc-accent); outline-offset: 1px; }
.kc-tempo { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--kc-muted); }
.kc-tempo input { width: 140px; accent-color: var(--kc-accent); }
.kc-tempo output { min-width: 3ch; color: var(--kc-ink); font-variant-numeric: tabular-nums; }

@container (max-width: 480px) {
  .kc-row { flex-direction: column; }
  .kc-play { justify-content: center; padding: 10px 14px; }
}
</style>
