import { ContentRegistry, getCampaignIndex } from '../content/registry';
import { createInitialState, deserializeState, serializeState } from '../engine/state';
import { EventBus } from '../engine/eventBus';
import {
  enterScene,
  filterChoices,
  renderSceneBody,
  resolveSkillCheck,
  type LoadedScene,
} from '../engine/sceneRuntime';
import { applyEffects } from '../engine/effects';
import type { Choice, GameState } from '../engine/schema';
import { executePlayerTurn, fleeCombat } from '../engine/combat';
import type { Stance } from '../engine/schema';
import { canWalk, renderMap } from '../campaigns/calvario/maps';
import { SCENE_ART } from '../campaigns/calvario/ascii/art';
import { formatDiceAscii } from './diceAscii';
import { GameAudio } from './sound';
import './styles.css';

const SAVE_KEY = 'calvario_save_v1';
const SIDEBAR_KEY = 'calvario_sidebar_sections_v1';

export class GameApp {
  private registry: ContentRegistry;
  private bus = new EventBus();
  private audio = new GameAudio();
  private state: GameState;
  private root: HTMLElement;
  private timedTimer: ReturnType<typeof setTimeout> | null = null;
  private menuOpen = false;
  /** Secções colapsáveis (recursos, faccoes, diario) — persistido em sessionStorage */
  private sidebarSections: Record<string, boolean> = {};

  constructor(root: HTMLElement) {
    this.root = root;
    this.registry = new ContentRegistry();
    const idx = getCampaignIndex();
    this.state = createInitialState(idx.entryScene);
    this.state = this.stabilize(this.state);
    this.sidebarSections = this.loadSidebarSections();
    this.bus.subscribe((ev) => {
      if (ev.type === 'combat.end' && ev.victory) {
        this.audio.playVictory();
      }
    });
    window.addEventListener('keydown', (e) => this.onMapKey(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.menuOpen = false;
        this.closeMenu();
      }
    });
    this.render();
  }

  private loadSidebarSections(): Record<string, boolean> {
    try {
      const raw = sessionStorage.getItem(SIDEBAR_KEY);
      if (!raw) return {};
      const o = JSON.parse(raw) as unknown;
      return typeof o === 'object' && o !== null ? (o as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private saveSidebarSections(): void {
    try {
      sessionStorage.setItem(SIDEBAR_KEY, JSON.stringify(this.sidebarSections));
    } catch {
      /* noop */
    }
  }

  private unlockAudio(): void {
    this.audio.ensureContext();
    if (!this.audio.isMuted()) {
      this.audio.playAmbient();
    }
  }

  private ctx(): { sceneId: string; data: import('../engine/gameData').GameData; bus: EventBus } {
    return { sceneId: this.state.sceneId, data: this.registry.data, bus: this.bus };
  }

  /** Não reentrar em cenas narrativas enquanto o combate está ativo (evita sobrescrever mode). */
  private stabilize(state: GameState): GameState {
    if (state.mode === 'combat') return state;
    let s = state;
    for (let i = 0; i < 14; i++) {
      const sc = this.registry.getScene(s.sceneId);
      if (!sc) return s;
      const before = s.sceneId;
      s = enterScene(s, sc, this.registry.data, this.bus);
      if (s.sceneId === before) return s;
    }
    return s;
  }

  private applyChoice(choice: Choice): void {
    this.unlockAudio();
    this.audio.playUiClick();
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    let s = applyEffects(this.state, choice.effects, this.ctx());
    if (choice.next && s.mode === 'story') {
      s = { ...s, sceneId: choice.next };
    }
    this.state = this.stabilize(s);
    this.render();
  }

  private onSkillRoll(scene: LoadedScene): void {
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveSkillCheck(this.state, scene);
    this.state = this.stabilize(r.state);
    this.render();
  }

  private onMapKey(e: KeyboardEvent): void {
    const m = this.state.asciiMap;
    if (!m || this.state.mode !== 'story') return;
    const mapId = m.mapId;
    let { playerX: x, playerY: y } = m;
    let nx = x;
    let ny = y;
    if (e.key === 'ArrowUp') ny -= 1;
    else if (e.key === 'ArrowDown') ny += 1;
    else if (e.key === 'ArrowLeft') nx -= 1;
    else if (e.key === 'ArrowRight') nx += 1;
    else return;
    e.preventDefault();
    if (!canWalk(mapId, x, y, nx, ny)) {
      this.audio.playBlocked();
      return;
    }
    let s: GameState = { ...this.state, asciiMap: { ...m, playerX: nx, playerY: ny } };
    if (this.state.resources.supply > 0) {
      const next = applyEffects(s, [{ op: 'addResource', resource: 'supply', delta: -1 }], this.ctx());
      s = { ...next, asciiMap: s.asciiMap };
    }
    this.audio.playUiClick();
    this.state = s;
    this.render();
  }

  private save(): void {
    this.unlockAudio();
    try {
      localStorage.setItem(SAVE_KEY, serializeState(this.state));
    } catch {
      /* noop */
    }
    this.closeMenu();
  }

  private load(): void {
    this.unlockAudio();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      this.state = deserializeState(raw);
      this.state = this.stabilize(this.state);
      this.render();
    } catch {
      /* noop */
    }
    this.closeMenu();
  }

  private closeMenu(): void {
    this.menuOpen = false;
    const drawer = this.root.querySelector('.menu-drawer');
    const backdrop = this.root.querySelector('.menu-backdrop');
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  private toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    const drawer = this.root.querySelector('.menu-drawer');
    const backdrop = this.root.querySelector('.menu-backdrop');
    if (this.menuOpen) {
      drawer?.classList.add('open');
      backdrop?.classList.add('open');
      this.unlockAudio();
    } else {
      drawer?.classList.remove('open');
      backdrop?.classList.remove('open');
    }
  }

  private resolveArt(scene: LoadedScene): string | undefined {
    const fm = scene.frontmatter;
    const inline = fm.art?.trim();
    if (inline) return inline;
    const key = fm.artKey;
    if (key && SCENE_ART[key]) return SCENE_ART[key];
    return undefined;
  }

  private render(): void {
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    this.root.innerHTML = '';

    const frame = document.createElement('div');
    frame.className = 'app-frame';

    const header = document.createElement('header');
    header.className = 'app-top';
    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = 'Calvário Subterrâneo';
    const hBtn = document.createElement('button');
    hBtn.type = 'button';
    hBtn.className = 'hamburger';
    hBtn.setAttribute('aria-label', 'Menu');
    hBtn.setAttribute('aria-expanded', 'false');
    hBtn.innerHTML = '☰';
    hBtn.addEventListener('click', () => {
      this.toggleMenu();
      hBtn.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
    });
    header.appendChild(title);
    header.appendChild(hBtn);
    frame.appendChild(header);

    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.addEventListener('click', () => {
      this.closeMenu();
      hBtn.setAttribute('aria-expanded', 'false');
    });
    frame.appendChild(backdrop);

    const drawer = document.createElement('aside');
    drawer.className = 'menu-drawer';
    drawer.setAttribute('aria-hidden', 'true');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'menu-item';
    saveBtn.textContent = 'Salvar jogo';
    saveBtn.addEventListener('click', () => this.save());

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'menu-item';
    loadBtn.textContent = 'Carregar jogo';
    loadBtn.addEventListener('click', () => this.load());

    const soundRow = document.createElement('label');
    soundRow.className = 'menu-item menu-sound';
    const soundCb = document.createElement('input');
    soundCb.type = 'checkbox';
    soundCb.checked = !this.audio.isMuted();
    soundCb.addEventListener('change', () => {
      this.audio.setMuted(!soundCb.checked);
      if (soundCb.checked) {
        this.unlockAudio();
      } else {
        this.audio.stopAmbient();
      }
    });
    soundRow.appendChild(soundCb);
    soundRow.appendChild(document.createTextNode(' Som ligado'));

    drawer.appendChild(saveBtn);
    drawer.appendChild(loadBtn);
    drawer.appendChild(soundRow);
    frame.appendChild(drawer);

    const bodyRow = document.createElement('div');
    bodyRow.className = 'app-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'player-sidebar';
    sidebar.appendChild(this.buildSidebar());

    const main = document.createElement('main');
    main.className = 'story-shell';

    if (this.state.mode === 'combat') {
      this.renderCombatInto(main);
    } else {
      const scene = this.registry.getScene(this.state.sceneId);
      if (!scene) {
        main.innerHTML = `<div class="shell error">Cena não encontrada: <code>${this.state.sceneId}</code></div>`;
      } else {
        this.renderStoryInto(main, scene);
      }
    }

    bodyRow.appendChild(sidebar);
    bodyRow.appendChild(main);
    frame.appendChild(bodyRow);

    this.root.appendChild(frame);
  }

  private hpBarMarkup(cur: number, max: number): string {
    if (max <= 0) return '<div class="hp-bar-track empty"></div>';
    const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));
    return `<div class="hp-bar-track" title="HP ${cur} / ${max}">
      <div class="hp-bar-fill" style="width:${pct}%"></div>
    </div>`;
  }

  private wireSidebarDetails(hud: HTMLElement): void {
    hud.querySelectorAll('details[data-section]').forEach((el) => {
      const d = el as HTMLDetailsElement;
      const key = d.dataset.section;
      if (!key) return;
      if (this.sidebarSections[key] !== undefined) {
        d.open = this.sidebarSections[key]!;
      }
      d.addEventListener('toggle', () => {
        this.sidebarSections[key] = d.open;
        this.saveSidebarSections();
      });
    });
  }

  private buildSidebar(): HTMLElement {
    const hud = document.createElement('div');
    hud.className = 'sidebar-inner';
    const r = this.state.resources;
    const p = this.state.party[0];
    const rep = this.state.reputation;

    const openRec = this.sidebarSections['recursos'] ? ' open' : '';
    const openFac = this.sidebarSections['faccoes'] ? ' open' : '';
    const openDiary = this.sidebarSections['diario'] ? ' open' : '';

    hud.innerHTML = `
      <h2 class="sidebar-title">Herói</h2>
      <div class="sidebar-static">
        <div class="sidebar-static-title">Progresso</div>
        <div class="sidebar-static-body">
          <div class="sidebar-line">Capítulo <strong>${this.state.chapter}</strong></div>
          <div class="sidebar-line">Tier <strong>${this.state.narrativeTier}</strong></div>
        </div>
      </div>
      <details class="sidebar-collapse"${openRec} data-section="recursos">
        <summary class="sidebar-collapse-trigger">Recursos</summary>
        <div class="sidebar-collapse-body">
          <div class="sidebar-line">Suprimento <strong>${r.supply}</strong></div>
          <div class="sidebar-line">Fé <strong>${r.faith}</strong></div>
          <div class="sidebar-line">Corrupção <strong>${r.corruption}</strong></div>
        </div>
      </details>
      <details class="sidebar-collapse"${openFac} data-section="faccoes">
        <summary class="sidebar-collapse-trigger">Facções</summary>
        <div class="sidebar-collapse-body">
          <div class="sidebar-line">Vigília <strong>${rep.vigilia}</strong></div>
          <div class="sidebar-line">Círculo <strong>${rep.circulo}</strong></div>
          <div class="sidebar-line">Culto <strong>${rep.culto}</strong></div>
        </div>
      </details>
      <div class="sidebar-static">
        <div class="sidebar-static-title">Personagem</div>
        <div class="sidebar-static-body sidebar-stats">
          ${
            p
              ? `<div class="sidebar-line">Nome <strong>${p.name}</strong></div>
                 <div class="sidebar-line">HP <strong>${p.hp}/${p.maxHp}</strong> · Stress <strong>${p.stress}</strong></div>
                 ${this.hpBarMarkup(p.hp, p.maxHp)}
                 <div class="sidebar-line attrs">STR <strong>${p.str}</strong> · AGI <strong>${p.agi}</strong> · MEN <strong>${p.mind}</strong></div>`
              : '<div class="sidebar-line">Escolha uma classe na narrativa.</div>'
          }
        </div>
      </div>
    `;

    if (this.state.diary.length) {
      const diary = document.createElement('details');
      diary.className = 'sidebar-collapse';
      if (openDiary) diary.setAttribute('open', '');
      diary.dataset.section = 'diario';
      diary.innerHTML = `
        <summary class="sidebar-collapse-trigger">Diário</summary>
        <div class="sidebar-collapse-body diary-box">
          ${this.state.diary.map((x) => `<p>“${x}”</p>`).join('')}
        </div>
      `;
      hud.appendChild(diary);
    }

    this.wireSidebarDetails(hud);
    return hud;
  }

  private renderStoryInto(shell: HTMLElement, scene: LoadedScene): void {
    const inner = document.createElement('div');
    inner.className = 'shell';

    const bc = document.createElement('div');
    bc.className = 'breadcrumb';
    bc.textContent = `📁 campaigns/calvario/scenes/${scene.id}.md`;
    inner.appendChild(bc);

    const h1 = document.createElement('h1');
    h1.textContent = scene.frontmatter.title ?? scene.id;
    inner.appendChild(h1);

    const artText = this.resolveArt(scene);
    if (artText) {
      const pre = document.createElement('pre');
      pre.className = 'scene-art';
      pre.textContent = artText.trim();
      inner.appendChild(pre);
    }

    const body = document.createElement('div');
    body.className = 'story-body';
    body.innerHTML = renderSceneBody(scene.bodyRaw, this.state);
    inner.appendChild(body);

    if (this.state.asciiMap) {
      const rm = renderMap(
        this.state.asciiMap.mapId,
        this.state.asciiMap.playerX,
        this.state.asciiMap.playerY
      );
      if (rm) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `<div class="map-hint">Mapa (setas; −1 suprimento por passo)</div>`;
        const pre = document.createElement('pre');
        pre.className = 'ascii-map';
        pre.textContent = rm.lines.join('\n');
        wrap.appendChild(pre);
        inner.appendChild(wrap);
      }
    }

    if (scene.frontmatter.skillCheck) {
      const row = document.createElement('div');
      row.className = 'skill-row';
      const b = document.createElement('button');
      b.className = 'choice';
      b.textContent = `Rolar teste: ${scene.frontmatter.skillCheck.label ?? scene.frontmatter.skillCheck.attr} (2d6)`;
      b.addEventListener('click', () => this.onSkillRoll(scene));
      row.appendChild(b);
      inner.appendChild(row);
    }

    const choices = filterChoices(scene.frontmatter.choices, this.state);
    const chWrap = document.createElement('div');
    chWrap.className = 'choices';

    for (const ch of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.appendChild(document.createTextNode(ch.text));
      if (ch.preview) {
        const span = document.createElement('span');
        span.className = 'preview';
        span.textContent = ch.preview;
        btn.appendChild(span);
      }
      btn.addEventListener('click', () => this.applyChoice(ch));
      chWrap.appendChild(btn);
    }
    inner.appendChild(chWrap);

    this.setupTimedChoices(choices, inner);

    shell.appendChild(inner);
  }

  private setupTimedChoices(choices: Choice[], shell: HTMLElement): void {
    const timed = choices.find((c) => c.timedMs && c.fallbackNext);
    if (!timed || !timed.timedMs || !timed.fallbackNext) return;
    const bar = document.createElement('div');
    bar.className = 'timed-bar';
    const inner = document.createElement('i');
    inner.style.animationDuration = `${timed.timedMs}ms`;
    bar.appendChild(inner);
    shell.appendChild(bar);
    this.timedTimer = setTimeout(() => {
      this.applyChoice({
        text: '',
        next: timed.fallbackNext,
        effects: [],
      });
    }, timed.timedMs);
  }

  private renderCombatInto(shell: HTMLElement): void {
    const c = this.state.combat;
    if (!c) return;
    const inner = document.createElement('div');
    inner.className = 'shell combat-shell';
    inner.innerHTML = `<h1>Combate</h1>`;

    const layout = document.createElement('div');
    layout.className = 'combat-layout';

    const left = document.createElement('div');
    for (const inst of c.enemies) {
      if (inst.hp <= 0) continue;
      const def = this.registry.data.enemies[inst.defId];
      if (!def) continue;
      const panel = document.createElement('div');
      panel.className = 'enemy-panel';
      const wounded = inst.hp / inst.maxHp < 0.35;
      const sprite = wounded && def.spriteWounded ? def.spriteWounded : def.sprite;
      const pre = document.createElement('pre');
      pre.className = 'enemy-sprite';
      pre.textContent = sprite;
      const hpBar = `[${'█'.repeat(Math.ceil((inst.hp / inst.maxHp) * 10))}${'░'.repeat(10 - Math.ceil((inst.hp / inst.maxHp) * 10))}]`;
      panel.innerHTML = `<div><strong>${def.name}</strong> · ${hpBar} ${inst.hp}/${inst.maxHp}</div>`;
      if (def.type === 'armored' && inst.armorChipsRemaining > 0) {
        panel.innerHTML += `<div>Armadura: ${inst.armorChipsRemaining} camadas</div>`;
      }
      panel.appendChild(pre);
      left.appendChild(panel);
    }
    layout.appendChild(left);

    const right = document.createElement('div');
    const dice = document.createElement('div');
    dice.className = 'dice-panel';
    const hdr = document.createElement('div');
    hdr.className = 'dice-panel-header';
    hdr.textContent = 'Dados & log de batalha';
    dice.appendChild(hdr);

    const logScroll = document.createElement('div');
    logScroll.className = 'combat-log-scroll';

    for (const entry of c.log.slice(-30)) {
      const wrap = document.createElement('div');
      wrap.className = `combat-log-entry combat-log-${entry.kind}`;

      const msg = document.createElement('div');
      msg.className = 'combat-log-msg';
      msg.textContent = entry.message;
      wrap.appendChild(msg);

      if (entry.dice?.length) {
        const pre = document.createElement('pre');
        pre.className = 'dice-ascii-block';
        pre.textContent = formatDiceAscii(entry.dice);
        wrap.appendChild(pre);
        const metaParts: string[] = [];
        if (entry.modifier !== undefined) {
          metaParts.push(`mod ${entry.modifier >= 0 ? '+' : ''}${entry.modifier}`);
        }
        if (entry.final !== undefined) {
          metaParts.push(`total ${entry.final}`);
        }
        if (metaParts.length) {
          const meta = document.createElement('div');
          meta.className = 'combat-log-meta';
          meta.textContent = metaParts.join(' · ');
          wrap.appendChild(meta);
        }
      } else if (entry.modifier !== undefined || entry.final !== undefined) {
        const metaParts: string[] = [];
        if (entry.modifier !== undefined) {
          metaParts.push(`mod ${entry.modifier >= 0 ? '+' : ''}${entry.modifier}`);
        }
        if (entry.final !== undefined) {
          metaParts.push(`total ${entry.final}`);
        }
        const meta = document.createElement('div');
        meta.className = 'combat-log-meta';
        meta.textContent = metaParts.join(' · ');
        wrap.appendChild(meta);
      }

      logScroll.appendChild(wrap);
    }
    dice.appendChild(logScroll);
    right.appendChild(dice);
    layout.appendChild(right);
    inner.appendChild(layout);

    const lead = this.state.party[0];
    if (c.phase === 'choose_stance' && lead) {
      const bar = document.createElement('div');
      bar.className = 'stance-bar';
      const stances: Stance[] = ['aggressive', 'defensive', 'focus'];
      const labels: Record<Stance, string> = {
        aggressive: 'Agressivo (+atk / −def)',
        defensive: 'Defensivo (−atk / +def)',
        focus: 'Foco (magia: Mente)',
      };
      for (const st of stances) {
        const btn = document.createElement('button');
        btn.className = 'stance';
        btn.textContent = labels[st];
        btn.addEventListener('click', () => {
          this.unlockAudio();
          this.audio.playDice();
          this.state = executePlayerTurn(this.state, st, this.registry.data, false);
          this.render();
        });
        bar.appendChild(btn);
      }
      const sp = document.createElement('button');
      sp.className = 'stance special';
      sp.textContent = lead.specialUsedThisCombat ? 'Especial já usado' : 'Golpe especial (+2, +Stress)';
      sp.disabled = lead.specialUsedThisCombat;
      sp.addEventListener('click', () => {
        if (!lead.specialUsedThisCombat) {
          this.unlockAudio();
          this.audio.playDice();
          this.state = executePlayerTurn(this.state, 'aggressive', this.registry.data, true);
          this.render();
        }
      });
      bar.appendChild(sp);
      inner.appendChild(bar);
    }

    const flee = document.createElement('button');
    flee.className = 'choice';
    flee.textContent = 'Tentar fugir';
    flee.addEventListener('click', () => {
      this.unlockAudio();
      this.state = fleeCombat(this.state);
      this.render();
    });
    inner.appendChild(flee);

    shell.appendChild(inner);
  }
}
