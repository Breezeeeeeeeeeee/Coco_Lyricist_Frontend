<template>
  <div id="app">
    <!-- 导航栏 -->
    <nav class="navbar">
      <router-link class="nav-link" to="/">Home</router-link>
      <router-link class="nav-link" to="/render">Render Page</router-link>
    </nav>
    
    <!-- 路由视图 -->
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>




<style scoped>
/* 全局布局样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
}

/* 导航栏样式 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 左对齐 */
  padding: 10px 0px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  position: absolute; /* 固定在页面左上角 */
  top: 0;
  left: 0;
  width: 100%; /* 导航栏宽度占满 */
  z-index:5
}

.nav-link {
  margin: 0 10px;
  text-decoration: none;
  font-size: 16px;
  color: #007bff;
}

.nav-link:hover {
  color: #0056b3;
}

/* 主内容样式 */
.content {
  margin-top: 50px; /* 给导航栏留出空间 */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 80vh; /* 内容区域垂直居中 */
}
</style>
