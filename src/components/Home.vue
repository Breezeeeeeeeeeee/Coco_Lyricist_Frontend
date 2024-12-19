<template>
  <div id="app" class="home-page" style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px;margin-left:20px">
    <!-- 文本框和显示输入内容 -->
      <!-- 输入部分 -->
      <div class="file-upload-container">
        <!-- 文件选择按钮和点击渲染按钮 -->
        <div class="file-buttons">
          <!-- 隐藏原生文件按钮 -->
          <input 
            type="file" 
            id="fileInput"
            @change="handleFileUpload" 
            accept=".midi,.mid" 
            class="hidden-input"
          />

          <!-- 自定义按钮 -->
          <label for="fileInput" class="upload-button">
            Upload MIDI File
          </label>

          <!-- Click to Visualize Music Sheet 按钮 -->
          <button 
            @click="renderScore" 
            :disabled="!fileProcessed" 
            class="visualize-button"
          >
            Click to Visualize Music Sheet
          </button>
        </div>  
      </div>

      <!-- 文本框部分 -->
      <div class="text-input-container">
        <label for="userInput" class="text-input-label">Text Input：</label>
        <textarea 
          id="userInput"
          v-model="userInput" 
          @keydown.enter.prevent="extractKeywords" 
          placeholder="Input the user's story" 
          class="text-input-textarea"
        ></textarea>
      </div>

      <!-- 输入关键词数量 -->
      <div class="keyword-input-container">
        <label for="keywordsNum" class="keyword-input-label">Number of Keywords:</label>
        <input 
          id="keywordsNum"
          v-model.number="keywordsNum" 
          type="number" 
          placeholder="Enter number of keywords (e.g., 5)" 
          class="keyword-input-box"
        />
      </div>

      <!-- 显示服务器返回的关键词 -->
      <div class="keywords-container">
        <label class="keywords-label">Keywords Extracted:</label>
        <div class="keywords-box">
          <!-- 遍历显示关键词 -->
          <ul v-if="keywords.length > 0" class="keywords-list">
            <li v-for="(keyword, index) in keywords" :key="index" class="keywords-item">
              {{ keyword }}
            </li>
          </ul>
          <!-- 当 keywords 为空时显示提示 -->
          <p v-else class="no-keywords">No keywords extracted yet.</p>
        </div>
      </div>

    
      <!-- 显示文件信息 -->
      <div style="margin-top: 30px; margin-left:50px; text-align: center;">
        <span>{{ message }}</span>
      </div>

  </div>

</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message:"",
      fileSelected: false, // 是否选择了文件
      fileProcessed: false, // 是否接收到服务器返回的 JSON
      keywordsNum: 5,   // 默认关键词数量
      userInput: "", // 绑定用户输入的文本
      keywords: [],       // 存储提取的关键词
      errorMessage: ""    // 存储错误信息
    };
  },




methods: {
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) {
        this.message = "Please select a .midi file.";
        return;
      }

      // 检查文件类型
      if (!file.name.endsWith(".midi") && !file.name.endsWith(".mid")) {
        this.message = "Invalid file format. Please upload a .midi file.";
        return;
      }

      /*this.message = "File selected: " + file.name +"Processing file... Please wait."*/

      // 获取 JSON 文件并触发下载
      this.message = "Processing file... Please wait.";

       

      // 创建 FileReader 读取文件内容
      const reader = new FileReader();
      // reader.onload = (e) => {
      //   // 将文件内容存储到本地
      //   this.saveFileLocally(file);
      // };
      reader.readAsArrayBuffer(file); // 以二进制格式读取文件
    
       // 创建 FormData 对象
       const formData = new FormData();
      formData.append("file", file);

      try {
    const serverUrl = "http://172.28.177.139:8090/upload";

    const response = await fetch(serverUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    
    // 获取 JSON 文件并触发下载
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob); // 创建临时 URL
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "server_notes.json"; // 设置下载文件名
    document.body.appendChild(a);
    a.click(); // 触发下载
    window.URL.revokeObjectURL(url); // 释放 URL

    

    this.message = "JSON file downloaded successfully!";
    this.fileProcessed = true; // 允许点击渲染按钮
  } catch (error) {
    console.error("Error uploading file:", error);
    this.message = "Failed to upload file. Please try again.";
    this.fileProcessed = false;
  }

    },
    async extractKeywords() {
      this.errorMessage = "";
      this.keywords = [];


      try {
    const response = await fetch("http://172.28.177.139:8090/keywords_extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        story: this.userInput,        // 用户输入的故事
        keywords_num: this.keywordsNum // 用户指定的关键词数量
      })
    });

    const result = await response.json();
    if (result.status === "success") {
      console.log("关键词提取成功:", result.keywords);
      this.keywords=result.keywords
    } else {
      console.error("提取失败:", result.message);
      this.errorMessage=result.message
    }
  } catch (error) {
    console.error("请求失败:", error);
    this.errorMessage = "Failed to connect to the server. Please try again.";
  }
},
  
    async renderScore() {
      if (!this.fileProcessed) {
        alert("请先成功接收 JSON 文件后再点击渲染！");
        return;
      }

        // 调用渲染逻辑
      console.log("开始渲染五线谱...");
      
      // 成功接收 server_notes.json 后跳转到渲染页面
      this.$router.push({ path: '/render', query: { render: 'true' } });
    },
    saveFileLocally(file) {
      // 将文件保存到本地
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file); // 创建文件 URL
      link.download = file.name; // 设置下载的文件名
      link.click(); // 触发下载动作

      this.message = "File saved locally as: " + file.name;
    },

}

};
</script>



<style>

/* 全局样式设置 body 背景 */
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  background-image: url('/background5.png'); 
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

 
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

/* 父容器样式 */
.main-container {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 控制组件之间的间距 */
  position: relative;
  left: 20px; /* 整体偏移到左边 */
  top: 10px; /* 整体偏移到上边 */
}

.file-upload-container {
  margin-bottom: 20px;
}

/* 文件按钮容器，水平排列 */
.file-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 隐藏原生文件选择按钮 */
.hidden-input {
  display: none;
}

/* 自定义上传按钮 */
.upload-button {
  font-size: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  width: 300px;
  height: 50px;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  line-height: 30px;
}

/* 渲染按钮 */
.visualize-button {
  font-size: 20px;
  padding: 10px 20px;
  cursor: pointer;
  width: 320px;
  height: 50px;
  margin-left: 300px;
  }

  /* 文本输入的容器 */
.text-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 0; /* 修复无效的 px 值 */
  margin-top: 100px;
}

/* 标签样式 */
.text-input-label {
  font-size: 20px;
  white-space: nowrap;
}

/* 文本框样式 */
.text-input-textarea {
  font-size: 16px;
  padding: 10px;
  width: 100%;
  height: 150px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical; /* 允许垂直方向调整大小 */
  overflow-y: auto; /* 当内容超出时显示滚动条 */
  box-sizing: border-box; /* 包括内边距和边框在宽度计算中 */
}

/* 关键词输入容器 */
.keyword-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 标签样式 */
.keyword-input-label {
  font-size: 20px;
}

/* 输入框样式 */
.keyword-input-box {
  font-size: 16px;
  padding: 5px;
  width: 100px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

/* 整体容器 */
.keywords-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 标签样式 */
.keywords-label {
  font-size: 20px;
  white-space: nowrap;
}

/* 显示关键词的容器 */
.keywords-box {
  font-size: 18px;
  white-space: pre-wrap; /* 保留换行符 */
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}

/* 关键词列表样式 */
.keywords-list {
  margin: 0;
  padding: 0 0 0 20px;
}

/* 列表项样式 */
.keywords-item {
  margin-bottom: 5px;
}

/* 没有关键词时的提示样式 */
.no-keywords {
  color: gray;
  margin: 0;
}
</style>