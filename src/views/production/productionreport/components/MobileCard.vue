<script lang="ts" setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { handleOperation } from "@/components/RePlusPage";
import { useI18n } from "vue-i18n";
import Check from "@iconify-icons/ep/check";
import VideoPause from "@iconify-icons/ep/video-pause";
import VideoPlay from "@iconify-icons/ep/video-play";
import { productionreportApi } from "../utils/api";
import { ref } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  auth: {
    type: Object,
    required: true
  },
  onRefresh: {
    type: Function,
    default: () => {}
  }
});

const { t } = useI18n();

// 获取状态标签
const getStatusTag = (row) => {
  let type = "info";
  let text = "进行中";

  if (row.end_time) {
    type = "success";
    text = "已完成";
  } else if (row.pause_time && !row.resume_time) {
    type = "warning";
    text = "已暂停";
  }

  return { type, text };
};

// 控制操作状态
const isOperating = ref(false);

// 操作处理函数
const handleAction = (action, row) => {
  if (isOperating.value) return;
  isOperating.value = true;
  
  handleOperation({
    t,
    apiReq: productionreportApi[action](row.pk),
    success() {
      props.onRefresh();
    },
    requestEnd() {
      isOperating.value = false;
    }
  });
};

// 判断是否可以完成
const canComplete = (row) => {
  return !row.end_time && (!row.pause_time || row.resume_time);
};
</script>

<template>
  <div class="mobile-card">
    <div class="card-header">
      <div class="card-title">
        {{ item.production_order?.label || '生产报工' }}
      </div>
      <el-tag :type="getStatusTag(item).type" size="small">{{ getStatusTag(item).text }}</el-tag>
    </div>
    
    <div class="card-content">
      <div class="info-item" v-if="item.process_step">
        <span class="label">工序：</span>
        <span class="value">{{ item.process_step.label }}</span>
      </div>
      <div class="info-item" v-if="item.creator">
        <span class="label">操作人：</span>
        <span class="value">{{ item.creator.nickname }}</span>
      </div>
      <div class="info-item" v-if="item.start_time">
        <span class="label">开始时间：</span>
        <span class="value">{{ item.start_time }}</span>
      </div>
      <div class="info-item" v-if="item.end_time">
        <span class="label">结束时间：</span>
        <span class="value">{{ item.end_time }}</span>
      </div>
      <div class="info-item" v-if="item.total_time">
        <span class="label">总时长：</span>
        <span class="value">{{ item.total_time }}</span>
      </div>
    </div>
    
    <div class="card-footer">      
      <!-- 暂停按钮 -->
      <el-button 
        v-if="auth.pause && !item.end_time && !item.pause_time"
        type="warning" 
        size="small"
        :loading="isOperating"
        @click="handleAction('pause', item)"
      >
        <el-icon class="mr-1">
          <component :is="useRenderIcon(VideoPause)" />
        </el-icon>
        暂停
      </el-button>
      
      <!-- 恢复按钮 -->
      <el-button 
        v-if="auth.resume && item.pause_time && !item.resume_time && !item.end_time"
        type="primary" 
        size="small"
        :loading="isOperating"
        @click="handleAction('resume', item)"
      >
        <el-icon class="mr-1">
          <component :is="useRenderIcon(VideoPlay)" />
        </el-icon>
        恢复
      </el-button>
      
      <!-- 完成按钮 -->
      <el-button 
        v-if="auth.complete && canComplete(item)"
        type="success" 
        size="small"
        :loading="isOperating"
        @click="handleAction('complete', item)"
      >
        <el-icon class="mr-1">
          <component :is="useRenderIcon(Check)" />
        </el-icon>
        完成
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.mobile-card {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
}

.card-content {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.label {
  color: var(--el-text-color-secondary);
  margin-right: 8px;
  min-width: 80px;
}

.value {
  color: var(--el-text-color-primary);
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
</style>