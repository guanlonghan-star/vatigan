export const SISTINE_PREP_CARDS = [
  {node:'V16', label:'天顶结构', cue:'中央九个《创世记》场景'},
  {node:'V17', label:'创造亚当', cue:'看两根手指之间的空白'},
  {node:'V18', label:'先知与女先知', cue:'巨大坐姿环绕中央场景'},
  {node:'V20', label:'最后的审判', cue:'祭坛墙上的身体漩涡'},
];

export class SistineController {
  constructor({player, navigate, host = globalThis.document?.body} = {}) {
    this.player = player; this.navigate = navigate; this.host = host; this.active = false;
  }
  enter() {
    this.player?.pause(); this.active = true;
    if (this.host) {
      const screen = document.createElement('section'); screen.className = 'sistine-screen'; screen.id = 'sistine-screen';
      screen.innerHTML = `<div><p class="eyebrow">SISTINE MODE</p><h1>请收起手机</h1><p>现在用眼睛看。先找祭坛墙的《最后的审判》，再抬头看天顶中央的九个《创世记》场景。</p><button class="sistine-exit">我已经出来</button></div>`;
      screen.querySelector('button').onclick = () => this.exit(); this.host.append(screen);
    }
  }
  exit() {
    this.active = false; this.host?.querySelector?.('#sistine-screen')?.remove(); this.navigate?.('V21');
  }
}
