我的服务器代码接受的是http请求

<template>
  <div id="app">
    <h1>MIDI 文件上传和转换播放</h1>
    <input type="file" @change="handleFileUpload" accept=".mid,.midi" />
    <button @click="uploadFile" :disabled="!midiFile">上传并转换</button>
    <audio v-if="wavUrl" :src="wavUrl" controls></audio>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      midiFile: null,
      wavUrl: null,
    };
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && (file.name.endsWith('.mid') || file.name.endsWith('.midi'))) {
        this.midiFile = file;
      } else {
        alert("请选择一个有效的 MIDI 文件");
        this.midiFile = null; // 如果文件格式无效，则重置
      }
    },
    async uploadFile() {
      if (!this.midiFile) return;

      const formData = new FormData();
      formData.append("file", this.midiFile);

      try {
        const response = await axios.post("http://172.28.177.139:8088/convert", formData, {
          responseType: "blob", // 确保我们接收的是 blob 数据
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        // 将返回的 .wav 文件 blob 转换成 URL 并赋值给 wavUrl
        this.wavUrl = URL.createObjectURL(response.data);
      } catch (error) {
        console.error("文件转换失败:", error);
        alert("文件转换失败，请重试");
      }
    }
  }
};
</script>

<style>
#app {
  text-align: center;
  margin-top: 20px;
}
</style>
