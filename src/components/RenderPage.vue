<template>
  <!-- 外部容器，用于控制整体布局 -->
  <div class="main-container">
    <!-- 播放/暂停逻辑 -->
    <div class="header-container">
      <h1>Coco_Lyricist Singing Music Visualization</h1>
      <button @click="togglePlayPause">
        {{ buttonLabel }}
      </button>
    </div>

    <!-- 渲染五线谱的容器 -->
    <div ref="vexflowContainer" class="vexflow-container">
    </div>
  </div>

  <!-- 图例 -->
  <div class="prosody-legend">
    <div class="legend-title">Prosody Legend</div>
    <div class="legend-item">
      <span class="legend-color blue"></span> Weak
    </div>
    <div class="legend-item">
      <span class="legend-color red"></span> Strong
    </div>
    <!-- 添加绿色星形的图注 -->
    <div class="legend-item">
      <span class="legend-color" style="color: green; font-size: 15px; line-height: 15px;">★</span> End of Phrase
    </div>
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
      isPlaying: false, // 播放状态
      buttonLabel: 'Play', // 按钮文本
      currentNoteIndex: 0, // 记录当前播放的音符索引
      playInterval: null, // 定时器句柄
      fileSelected: false, // 是否选择了文件
      fileProcessed: false, // 是否接收到服务器返回的 JSON
      canRender: false, // 是否允许渲染五线谱
    };
  },
  async mounted() {

  //if (this.$route.query.render === 'true') {
    if (!this.$route.query.render){
      console.log("渲染授权成功，开始渲染五线谱...");
    const durationMapping = {
  '1': 4.0,   // 全音符
  '2': 2.0,   // 二分音符
  '4': 1.0,   // 四分音符
  '8': 0.5,   // 八分音符
  '16': 0.25, // 十六分音符
  '1r': 4.0,  // 全休止符
  '2r': 2.0,  // 二分休止符
  '4r': 1.0,  // 四分休止符
  '8r': 0.5,  // 八分休止符
  '16r': 0.25 // 十六分休止符
};
const VF = Vex.Flow;
const div = this.$refs.vexflowContainer;
const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

// 设置渲染器尺寸
renderer.resize(2000, 2000);  // 增加高度以容纳多行五线谱

const context = renderer.getContext();

let measures = [];
const ties = []; // 用于存储连音线
//console.log("begin")
let notePlayDurations = []; // 用于存储每个音符的播放时长,合并连音线但不合并休止符
this.notePlayTimeData = []; // 初始化数组

let timeSignatureString = '4/4'; // 默认值
let timePerBeat = null; // 初始化为 null 或其他默认值
let markers=[];

try {
  const response = await fetch('./server_notes.json');
  //const response = await fetch('./notes.json');
  //const response = await fetch('./Edelweiss.json');
  //const response = await fetch('./Edelweiss_notes.json');

  if (!response.ok) {
    throw new Error(`Failed to fetch notes.json. Status: ${response.status}`);
  }

  const parsedData = await response.json();

  // 单独处理 meta_data
  const metaData = parsedData.meta_data;
    if (metaData) {
      const { time_signature, time_per_beat} = metaData;

      timeSignatureString = `${time_signature.numerator}/${time_signature.denominator}`;
      timePerBeat = time_per_beat;

      console.log("Metadata:");
      console.log(`Time Signature: ${time_signature.numerator}/${time_signature.denominator}`);
      console.log(`Time per Beat: ${time_per_beat}s`);
      // 你可以在这里根据元数据设置一些全局变量或渲染相关信息
    }
    else{
      console.log("error!!!!!")
    }

    // 移除 meta_data，从剩下的数据中处理小节信息
    delete parsedData.meta_data;



  let globalNoteIndex = 0; // 全局音符索引
  // 初始化 measures 和跨小节连音线数组
  const pendingCrossMeasureTies = []; // 用于存储跨小节连音线的请求

  let my_globalIndex = 0;
  for (let i = 0; i < Object.keys(parsedData).length; i++) {
    const measureKey = `measure[${i}]`;
    const measureNotes = parsedData[measureKey];

    // 验证 measureNotes
    if (!measureNotes || !Array.isArray(measureNotes)) {
      console.warn(`Invalid or missing notes in ${measureKey}`);
      continue; // 跳过无效的小节
    }

     // 遍历每个音符
    measureNotes.forEach((note) => {
      const isRest = note.duration.endsWith('r'); // 判断是否为休止符
      const duration = note.actual_play_time * timePerBeat; // 计算实际播放时长
      const lyrics=note.lyrics;
      const prosody=note.prosody;
      const marker=note.marker;
      // 将数据存入 notePlayTimeData
      this.notePlayTimeData.push({
        key: note.key,
        beats:note.actual_play_time,
        duration: duration,
        isRest: isRest,
        lyrics:lyrics,
        prosody:prosody,
        marker:marker
      });
    });


    





  const vexflowNotes = measureNotes.map((note) => {
    notePlayDurations.push(note.actual_play_time);
    const vexflowNote = new VF.StaveNote({
      clef: 'treble',
      keys: [note.key],
      duration: note.duration,
    });

    let color;
    // 使用全局索引访问 notePlayTimeData
    if (this.notePlayTimeData[my_globalIndex]?.isRest === true) {
      color = "black";
    } else {
      const prosody = this.notePlayTimeData[my_globalIndex]?.prosody;
      if (prosody === null || prosody === undefined) {
        color = "black"; // 如果 prosody 是 None（null 或 undefined）
      } else if (prosody === "weak") {
        color = "blue"; // 如果 prosody 是 weak
      } else if (prosody === "strong") {
        color = "red"; // 如果 prosody 是 strong
      } else {
        color = "black"; // 默认情况
      }
    }
    
    vexflowNote.setStyle({
      fillStyle: color,
      strokeStyle: color,
    });
    
    my_globalIndex++; // 增加全局索引
    return vexflowNote;
}).filter((note) => note !== null);

    // 当前小节内的连音线处理
    measureNotes.forEach((note, noteIndex) => {
      const currentNote = vexflowNotes[noteIndex];
      if (note.connect) {
        let nextNote = null;

        // 同小节连音
        if (noteIndex < measureNotes.length - 1) {
          nextNote = vexflowNotes[noteIndex + 1];
        } else if (i < Object.keys(parsedData).length - 1) {
          // 跨小节连音：延迟处理
          pendingCrossMeasureTies.push({
            from: currentNote,
            globalIndex: globalNoteIndex,
            nextMeasureIndex: i + 1, // 下一小节的索引
          });
        }

        // 如果找到目标音符，创建连音线
        if (currentNote && nextNote) {
          ties.push(new VF.StaveTie({
            first_note: currentNote,
            last_note: nextNote,
          }));
        }
      } 

      globalNoteIndex++; // 更新全局索引
    });

    // 添加当前小节音符到 measures
    measures.push(vexflowNotes);
  }

  // 处理跨小节连音线
  pendingCrossMeasureTies.forEach((pendingTie) => {
    const nextMeasureNotes = measures[pendingTie.nextMeasureIndex];
    if (nextMeasureNotes && nextMeasureNotes.length > 0) {
      const nextNote = nextMeasureNotes[0]; // 下一小节的第一个音符
      const nextGlobalIndex = pendingTie.globalIndex + 1; // 跨小节的全局索引
      ties.push(new VF.StaveTie({
        first_note: pendingTie.from,
        last_note: nextNote,
      }));
    } else {
      console.warn(
        `Skipping cross-measure tie creation: no valid note in measure[${pendingTie.nextMeasureIndex}]`
      );
    }
  });
} 
catch (error) {
  console.error('Failed to load or process notes.json:', error);
}

console.log('Note playTimeData:', this.notePlayTimeData);
// 渲染五线谱并记录音符位置
this.notePositions = []; // 用于记录每个音符的位置,连音线合并，仅记录第一个音的位置

const noteBaseWidth = 70; // 每个音符的基础宽度
const rowHeight = 160; // 每行五线谱的高度
const length_per_row=1200;
let currentX = 0; // 当前小节的 x 坐标
let currentY = 50; // 当前小节的 y 坐标

console.log(`Markers_out: ${markers}s`)
console.log(`time_per_beat_out: ${timePerBeat}s`)


const groupMeasuresIntoLines = (measures, noteBaseWidth, length_per_row) => {
  let lines = []; // 存储每一行的measures
  let currentLine = []; // 当前正在填充的行
  let currentWidth = 0; // 当前行的总宽度

  measures.forEach((measure) => {
    const measureWidth = noteBaseWidth * measure.length; // 当前小节的宽度

    // 如果加入当前小节后超过行的最大宽度，则新开一行
    if (currentWidth + measureWidth > length_per_row) {
      lines.push(currentLine); // 保存当前行
      currentLine = []; // 新建一行
      currentWidth = 0; // 重置宽度
    }

    currentLine.push(measure); // 将小节加入当前行
    currentWidth += measureWidth; // 更新当前行的宽度
  });

  // 如果最后一行有内容，添加到lines中
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
  
};



const lines = groupMeasuresIntoLines(measures, noteBaseWidth, length_per_row);
const calculateLineTotalLength = (line, noteBaseWidth) => {
  if (!Array.isArray(line) || line.length === 0) {
    console.warn("Invalid or empty line:", line);
    return 0;
  }

  // 计算总音符数量
  const totalNotes = line.reduce((sum, measure) => {
    if (!Array.isArray(measure)) {
      console.warn("Invalid measure in line:", measure);
      return sum; // 跳过无效的 measure
    }
    return sum + measure.length; // 累加音符数量
  }, 0);

  // 计算总长度
  const totalLength = totalNotes * noteBaseWidth;

  //console.log(`Line total notes: ${totalNotes}, Total length: ${totalLength}`);
  return totalLength;
};

lines.forEach((line, lineIndex) => {
  //console.log(`Rendering line ${lineIndex + 1}`);
  
  
  let totalLength = calculateLineTotalLength(line, noteBaseWidth);
  let rescale_factor=length_per_row/totalLength
  line.forEach((measure, measureIndex) => {
    // 动态计算每个小节的宽度
    const staveWidth = noteBaseWidth * measure.length*rescale_factor;

    // 创建五线谱小节
    const stave = new VF.Stave(currentX, currentY, staveWidth);

    
    // 如果是第一个小节，并且是第一行，添加谱号和拍号
    if (lineIndex === 0 && measureIndex === 0) {
      stave.addClef('treble').addTimeSignature(timeSignatureString);
    }

    // 如果是最后一个小节，添加加粗的结束线
    if (lineIndex === lines.length - 1 && measureIndex === line.length - 1) {
      stave.setEndBarType(VF.Barline.type.END);
    }

    // 渲染五线谱小节
    stave.setContext(context).draw();

   

    // 使用 VexFlow 渲染音符（假设 measure 是音符数组）
    VF.Formatter.FormatAndDraw(context, stave, measure);

    // **在此处添加代码，记录音符位置**
    measure.forEach((note) => {
      // 获取音符的绝对 X 坐标
      const x = note.getAbsoluteX();

      // 获取音符的 Y 坐标数组
      const ys = note.getYs();

      // 对于单个音符，取第一个 Y 坐标
    let y = ys[0];

    // 添加或减去一个固定的偏移量，例如 10 像素
    y -= 50; // 根据需要调整偏移量的大小

      // 存储音符的位置和相关信息
      this.notePositions.push({
        x: x,
        y: y,
        note: note,
        measureIndex: measureIndex,
        lineIndex: lineIndex,
      });
    });

    // 更新当前 x 坐标
    currentX += staveWidth;
  });

  
  // 渲染完当前行后换行
  currentX = 0; // 重置 x 坐标
  currentY += rowHeight; // 增加 y 坐标
});

// 渲染连音线：确保所有音符渲染完成后再渲染连音线
ties.forEach((tie, index) => {
  //console.log(`Rendering tie ${index}:`, tie); // 调试输出，确保 tie 数据正确
  tie.setContext(context).draw(); // 渲染连音线
});
console.log("Final notePositions:", this.notePositions);
//可视化note Positions的位置
this.notePositions.forEach((pos, index) => {
  // 创建音符标记点
  // const noteElement = document.createElement("div");
  // noteElement.style.position = "absolute";
  // noteElement.style.left = `${pos.x}px`;
  // noteElement.style.top = `${pos.y}px`;
  // noteElement.style.width = "5px";
  // noteElement.style.height = "5px";
  // noteElement.style.backgroundColor = "red";
  // noteElement.style.borderRadius = "50%";
  // noteElement.title = `Index: ${index}, Measure: ${pos.measureIndex}, Line: ${pos.lineIndex}`;
  // this.$refs.vexflowContainer.appendChild(noteElement);

  // 创建显示 lyrics 和 prosody 的文本元素
  const lyricsText = document.createElement("div");
  lyricsText.textContent = this.notePlayTimeData[index]?.lyrics || ""; // 显示歌词
  lyricsText.style.position = "absolute";
  lyricsText.style.left = `${pos.x}px`;
  lyricsText.style.top = `${pos.y - 20}px`; // 将歌词显示在音符上方
  lyricsText.style.fontSize = "17px";


  // 设置歌词颜色，与音符颜色一致
  const prosody = this.notePlayTimeData[index]?.prosody;
  lyricsText.style.color = prosody === "weak" ? "blue" : "red";

  // 如果该音符有 marker 标记为 True，则创建一个标记元素
  if (this.notePlayTimeData[index]?.marker === true) {
    const markerElement = document.createElement("div");
    // 这里你可以用想要的标记符号，比如星号、箭头或其他图案
    markerElement.textContent = "★"; 
    markerElement.style.position = "absolute";
    markerElement.style.left = `${pos.x}px`;
    markerElement.style.top = `${pos.y - 60}px`; // 根据需要调整位置，使其在音符头顶上方显示
    markerElement.style.fontSize = "20px";
    markerElement.style.color = "green";
    markerElement.style.fontWeight = "bold";
    markerElement.style.pointerEvents = "none";
    this.$refs.vexflowContainer.appendChild(markerElement);
  }
  
  
  lyricsText.style.fontWeight = "bold";
  lyricsText.style.pointerEvents = "none"; // 防止干扰鼠标事件
  this.$refs.vexflowContainer.appendChild(lyricsText);

  // const prosodyText = document.createElement("div");
  // prosodyText.textContent = this.notePlayTimeData[index]?.prosody || ""; // 显示韵律信息
  // prosodyText.style.position = "absolute";
  // prosodyText.style.left = `${pos.x}px`;
  // prosodyText.style.top = `${pos.y - 40}px`; // 将韵律信息显示在歌词上方
  // prosodyText.style.fontSize = "10px";
  // prosodyText.style.color = "green";
  // prosodyText.style.fontWeight = "normal";
  // prosodyText.style.pointerEvents = "none"; // 防止干扰鼠标事件
  // this.$refs.vexflowContainer.appendChild(prosodyText);
});

    // 创建图注容器
const legendContainer = document.createElement("div");
legendContainer.style.position = "fixed"; // 使用 fixed 定位，始终在页面右上角
legendContainer.style.top = "10px"; // 距离页面顶部 10px
legendContainer.style.right = "10px"; // 距离页面右侧 10px
legendContainer.style.backgroundColor = "white"; // 设置背景色
legendContainer.style.border = "1px solid black"; // 设置边框
legendContainer.style.padding = "10px"; // 内边距
legendContainer.style.borderRadius = "5px"; // 圆角
legendContainer.style.zIndex = "1000"; // 设置 z-index，避免被遮挡

// 创建一个光标元素
this.cursor = document.createElement("div");
this.cursor.style.position = "absolute";
this.cursor.style.width = "2px";
this.cursor.style.height = "100px";
this.cursor.style.backgroundColor = "red";
this.cursor.style.zIndex = "10";
//this.cursor.style.transition = "transform 0.1s linear";
this.cursor.style.transition = "none";
this.cursor.style.top = "40px";
this.$refs.vexflowContainer.appendChild(this.cursor);

// 初始化音频上下文和加载钢琴音源
this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
this.piano = await Soundfont.instrument(this.audioContext, 'acoustic_grand_piano');

console.log("note_positions:",this.notePositions)


  }
  else{
    console.log("页面未渲染！")
  }

},
  methods: {  
    // 切换播放/暂停状态
  togglePlayPause() {
    if (this.isPlaying) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  },

  // 开始播放音乐
  playMusic() {
    // 确保 AudioContext 在用户交互后启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('AudioContext resumed');
      }).catch((error) => {
        console.error('Failed to resume AudioContext:', error);
      });
    }

    // 如果有未完成的播放任务，先清除
    if (this.playInterval) {
      clearTimeout(this.playInterval);
      this.playInterval = null;
    }
    if (this.cursorInterval) {
      clearInterval(this.cursorInterval);
      this.cursorInterval = null;
    }

    this.isPlaying = true;
    this.buttonLabel = 'Pause';

    if (this.cursor) {
    this.cursor.style.left = '0px';
    this.cursor.style.top = '40px';
  }

    // 启动音符播放逻辑
    this.startNotePlayback();
  },

  // 暂停播放音乐
  pauseMusic() {
    this.isPlaying = false;
    this.buttonLabel = 'Play';

    // 停止光标移动
    if (this.cursorInterval) {
      clearInterval(this.cursorInterval);
      this.cursorInterval = null;
    }

    // 清除未完成的播放任务
    if (this.playInterval) {
      clearTimeout(this.playInterval);
      this.playInterval = null;
    }

    console.log('Music paused');
  },

  // addProsodyLegend() {
  //     // 创建图注容器
  //     const legendContainer = document.createElement("div");
  //     legendContainer.style.position = "fixed"; // 使用 fixed 定位，始终在页面右上角
  //     legendContainer.style.top = "10px"; // 距离页面顶部 10px
  //     legendContainer.style.right = "10px"; // 距离页面右侧 10px
  //     legendContainer.style.backgroundColor = "white"; // 设置背景色
  //     legendContainer.style.border = "1px solid black"; // 设置边框
  //     legendContainer.style.padding = "10px"; // 内边距
  //     legendContainer.style.borderRadius = "5px"; // 圆角
  //     legendContainer.style.zIndex = "1000"; // 设置 z-index，避免被遮挡

  //     // 添加图注标题
  //     const legendTitle = document.createElement("div");
  //     legendTitle.textContent = "Prosody Legend";
  //     legendTitle.style.fontSize = "14px";
  //     legendTitle.style.fontWeight = "bold";
  //     legendTitle.style.marginBottom = "8px";
  //     legendContainer.appendChild(legendTitle);

  //     // 添加蓝色图注
  //     const weakLegend = document.createElement("div");
  //     weakLegend.style.display = "flex";
  //     weakLegend.style.alignItems = "center";
  //     weakLegend.style.marginBottom = "5px";
  //     weakLegend.innerHTML = `
  //       <span style="display: inline-block; width: 15px; height: 15px; background-color: blue; margin-right: 8px; border-radius: 3px;"></span>
  //       Weak
  //     `;
  //     legendContainer.appendChild(weakLegend);

  //     // 添加红色图注
  //     const strongLegend = document.createElement("div");
  //     strongLegend.style.display = "flex";
  //     strongLegend.style.alignItems = "center";
  //     strongLegend.innerHTML = `
  //       <span style="display: inline-block; width: 15px; height: 15px; background-color: red; margin-right: 8px; border-radius: 3px;"></span>
  //       Strong
  //     `;
  //     legendContainer.appendChild(strongLegend);



  //     const startLegend = document.createElement("div");
  // startLegend.style.display = "flex";
  // startLegend.style.alignItems = "center";
  // startLegend.style.marginBottom = "5px";
  // startLegend.innerHTML = `
  //   <span style="
  //     display: inline-block; 
  //     width: 15px; 
  //     height: 15px; 
  //     font-size: 15px; 
  //     line-height: 15px; 
  //     margin-right: 8px; 
  //     text-align: center; 
  //     color: green !important;">
  //     ★
  //   </span>
  //   Start
  // `;
  // legendContainer.appendChild(startLegend);

  //     // 将图注容器添加到页面
  //     document.body.appendChild(legendContainer);
  // },


  // 播放音符
  playTone(noteKey, duration) {
  const formattedKey = noteKey.replace('/', ''); // 将 "G/4" 转换为 "G4"
  if (this.piano) {
    try {
      this.piano.play(formattedKey, this.audioContext.currentTime, { duration, gain: 0.8 });
      console.log(`Playing: ${formattedKey} for ${duration} seconds`);
    } catch (error) {
      console.error(`Failed to play note ${formattedKey}:`, error);
    }
  } else {
    console.warn('Piano is not loaded yet');
  }
},



startNotePlayback() {
  const playNextNote = (noteIndex = this.currentNoteIndex) => {
    // 停止播放的条件
    if (!this.isPlaying || noteIndex >= this.notePlayTimeData.length) {
      this.isPlaying = false;
      this.buttonLabel = 'Play';
      this.currentNoteIndex = 0; // 重置索引
      return;
    }

    const note = this.notePlayTimeData[noteIndex];
    console.log(`Playing noteIndex: ${noteIndex}, Note:`, note);

    // 更新光标位置
    this.updateCursorPosition(noteIndex);

    // 检查 duration 是否有效
    if (note.duration <= 0) {
      console.warn(`Skipping note with zero or negative duration:`, note);
      this.currentNoteIndex = noteIndex + 1; // 更新索引
      playNextNote(noteIndex + 1); // 直接播放下一个音符
      return;
    }

    // 处理休止符或音符播放
    if (note.isRest) {
      console.log('Rest note:', { duration: note.duration });
    } else {
      console.log('Playing note:', { key: note.key, duration: note.duration });
      this.playTone(note.key, note.duration);
    }

    // 准备播放下一个音符
    setTimeout(() => {
      if (this.isPlaying) {
        this.currentNoteIndex = noteIndex + 1; // 更新当前索引
        playNextNote(noteIndex + 1);
      }
    }, note.duration * 1000); // 持续时间转为毫秒
  };

  // 从第一个音符开始播放
  playNextNote();
},


updateCursorPosition(noteIndex) {
  if (noteIndex < 0 || noteIndex >= this.notePositions.length) {
    console.warn("Invalid note index for cursor:", noteIndex);
    return;
  }

  const notePosition = this.notePositions[noteIndex];
  console.log(`Moving cursor to noteIndex: ${noteIndex}, x: ${notePosition.x}, y: ${notePosition.y}`);

  // 使用 CSS transition 平滑移动光标
  this.cursor.style.transition = "transform 0.2s linear";
  this.cursor.style.transform = `translate(${notePosition.x}px, ${notePosition.y}px)`;
}



}

};
</script>




<style>

#appp {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}

.header-container {
  display: flex;
  flex-direction: column; /* 子元素垂直排列 */
  align-items: flex-start; /* 初始设置为左对齐 */
  position: relative; /* 允许子元素通过位置调整 */
  left: -350px; /* 手动移动标题和按钮 */
}

/* 按钮样式 */
button {
  margin-top: 10px; /* 给按钮一些上边距 */
  padding: 8px 20px; /* 增加按钮内边距 */
  align-self: center; /* 按钮在父容器内水平居中 */
}

/* 标题样式 */
h1 {
  margin: 0;
  text-align: left; /* 默认左对齐 */
}
/* 图例样式 */
.prosody-legend {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: white;
  border: 1px solid black;
  padding: 10px;
  border-radius: 5px;
  z-index: 1000;
  width: 150px;
}

.legend-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-color {
  display: inline-block;
  width: 15px;
  height: 15px;
  margin-right: 8px;
  border-radius: 3px;
}

.legend-color.blue {
  background-color: blue;
}

.legend-color.red {
  background-color: red;
}

.vexflow-container {
  position: relative;
  margin-top: 770px; /* 控制五线谱向下移动的距离 */
}

/* 容器的样式 */
.header-container {
  margin-bottom: -800px;
  margin-left: px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* 标题样式 */
.header-container h1 {
  margin-left: 700px;
  margin-top:300px
}

/* 按钮样式 */
.header-container button {
  font-size: 20px;
  padding: 10px 20px;
  cursor: pointer;
  margin-top: 10px; /* 可以根据需求调整顶部边距 */
  margin-left: 10px; /* 可以根据需求调整顶部边距 */
}

/* 外部容器：控制整体布局 */
.main-container {
  position: relative; /* 允许位置调整 */
  margin-left: -50px; /* 左移 50px */
  margin-top:950px; /* 上移 20px，可根据需求调整 */
}
</style>