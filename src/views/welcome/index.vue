<template>
  <div class="welcome-container">
    <button class="report-btn" @click="goToProductionReport">点我报工</button>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 跳转到生产报工页面
const goToProductionReport = () => {
  router.push('/production/productionreport/index');
};
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.report-btn {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.report-btn:hover {
  background-color: #66b1ff;
}
</style>
