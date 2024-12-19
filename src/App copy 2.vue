<template>
  <div id="appp">
    <h1>VexFlow 乐谱播放示例</h1>
    <div ref="vexflowContainer" style="position: relative;"></div>
    <button @click="playMusic">Play</button>
  </div>
</template>

<script>
import * as Soundfont from 'soundfont-player';
import Vex from 'vexflow';

export default {
  name: 'App',
  data() {
    return {
      notes: [],
      audioContext: null,
      cursor: null,
      piano: null, // 保存加载的钢琴音源
    };
  },
  async mounted() {
    const VF = Vex.Flow;
    const div = this.$refs.vexflowContainer;
    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

    // 设置渲染器尺寸
    renderer.resize(800, 200);
    const context = renderer.getContext();

    // 定义音符数组
    this.notes = [
      new VF.StaveNote({ clef: 'treble', keys: ['c/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['d/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['e/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['f/4'], duration: 'q' }),

      new VF.StaveNote({ clef: 'treble', keys: ['g/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['a/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['b/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['c/5'], duration: 'q' }),

      new VF.StaveNote({ clef: 'treble', keys: ['d/5'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['e/5'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['f/5'], duration: 'qr' }), // 四分休止符
      new VF.StaveNote({ clef: 'treble', keys: ['g/5'], duration: 'q' }),

      new VF.StaveNote({ clef: 'treble', keys: ['f/5'], duration: 'hr' }), // 二分休止符
      new VF.StaveNote({ clef: 'treble', keys: ['g/5'], duration: 'q' }),

      new VF.StaveNote({ clef: 'treble', keys: ['c/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['d/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['e/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['f/4'], duration: 'q' }),

      new VF.StaveNote({ clef: 'treble', keys: ['c/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['d/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['e/4'], duration: 'q' }),
      new VF.StaveNote({ clef: 'treble', keys: ['f/4'], duration: 'q' }),
    ];

    // 每4个音符分成一小节
    const staveWidth = 200;
    const staves = [];
    for (let i = 0; i < this.notes.length; i += 4) {
      const stave = new VF.Stave(10 + i / 4 * staveWidth, 40, staveWidth);
      if (i === 0) {
        stave.addClef('treble').addTimeSignature('4/4');
      }
      stave.setContext(context).draw();
      staves.push(stave);

      const measureNotes = this.notes.slice(i, i + 4);
      VF.Formatter.FormatAndDraw(context, stave, measureNotes);
    }

    // 创建一个光标元素
    this.cursor = document.createElement("div");
    this.cursor.style.position = "absolute";
    this.cursor.style.width = "2px";
    this.cursor.style.height = "100px";
    this.cursor.style.backgroundColor = "red";
    this.cursor.style.top = "40px";
    div.appendChild(this.cursor);

    // 初始化音频上下文和加载钢琴音源
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.piano = await Soundfont.instrument(this.audioContext, 'acoustic_grand_piano');
  },
  methods: {
    playMusic() {
  const noteDuration = 0.5; // 每个音符播放 0.5 秒
  let startTime = this.audioContext.currentTime;

  this.notes.forEach((note, index) => {
    // 检查是否为休止符
    if (note.isRest()) {
      // 如果是休止符，只移动光标，但不播放音频
      setTimeout(() => {
        this.moveCursorToNotePosition(index);
      }, (startTime - this.audioContext.currentTime) * 1000);

      // 增加 startTime，以保持节奏一致
      startTime += noteDuration;
      return;
    }

    // 获取非休止符音符的键名
    const noteKey = note.keys[0].replace('/', '').toLowerCase();

    // 设置音符播放和光标移动
    setTimeout(() => {
      this.playTone(noteKey, noteDuration); // 播放钢琴音源
      this.moveCursorToNotePosition(index);
    }, (startTime - this.audioContext.currentTime) * 1000);

    // 增加 startTime
    startTime += noteDuration;
  });
},

playTone(noteKey, duration) {
  if (this.piano) {
    this.piano.play(noteKey, this.audioContext.currentTime, { duration });
  }
},
    moveCursorToNotePosition(index) {
      const note = this.notes[index];
      const position = note.getBoundingBox().getX();
      this.cursor.style.left = `${position + 10}px`;
    },
  },
};
</script>

<style>
#appp {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: -200px;
}
</style>
