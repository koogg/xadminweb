<script lang="ts" setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { handleOperation } from "@/components/RePlusPage";
import { useI18n } from "vue-i18n";
import Check from "@iconify-icons/ep/check";
import VideoPause from "@iconify-icons/ep/video-pause";
import VideoPlay from "@iconify-icons/ep/video-play";
import { productionreportApi } from "../utils/api";
import { ref } from "vue";
import { Edit, Delete } from "@element-plus/icons-vue";

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
  },
  onEdit: {
    type: Function,
    default: null
  },
  onDelete: {
    type: Function,
    default: null
  }
});

const { t } = useI18n();

// 获取状态标签
const getStatusTag = row => {
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

// 修改操作处理函数，直接使用 API 方法
const handleAction = (action, row) => {
  if (isOperating.value) return;
  isOperating.value = true;

  // 根据操作类型调用对应的 API 方法
  let apiReq;
  switch (action) {
    case 'pause':
      apiReq = productionreportApi.pause(row.pk);
      break;
    case 'resume':
      apiReq = productionreportApi.resume(row.pk);
      break;
    case 'complete':
      apiReq = productionreportApi.complete(row.pk);
      break;
    default:
      apiReq = null;
  }

  if (!apiReq) {
    isOperating.value = false;
    return;
  }

  handleOperation({
    t,
    apiReq,
    success() {
      props.onRefresh();
    },
    requestEnd() {
      isOperating.value = false;
    }
  });
};

// 判断是否可以完成
const canComplete = row => {
  return !row.end_time && (!row.pause_time || row.resume_time);
};

// 处理编辑
const handleEdit = () => {
  if (props.onEdit) {
    props.onEdit(props.item);
  }
};

// 处理删除
const handleDelete = () => {
  if (props.onDelete) {
    props.onDelete(props.item);
  }
};
</script>

<template>
  <div class="mobile-card">
    <div class="card-header">
      <div class="card-title">
        {{ item.production_order?.label || "生产报工" }}
      </div>
      <el-tag :type="getStatusTag(item).type" size="small"
        >{{ getStatusTag(item).text }}
      </el-tag>
    </div>

    <div class="card-content">
      <!-- 添加生产令号显示 -->
      <div class="info-item" v-if="item.production_order?.production_number">
        <span class="label">生产令号：</span>
        <span class="value">{{ item.production_order.production_number }}</span>
      </div>
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
      <!-- 添加暂停时间显示 -->
      <div class="info-item" v-if="item.pause_time">
        <span class="label">暂停时间：</span>
        <span class="value">{{ item.pause_time }}</span>
      </div>
      <!-- 添加恢复时间显示 -->
      <div class="info-item" v-if="item.resume_time">
        <span class="label">恢复时间：</span>
        <span class="value">{{ item.resume_time }}</span>
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
      <!-- 修改编辑按钮条件，确保显示 -->
      <el-button
        v-if="auth.update"
        type="primary"
        size="small"
        plain
        :icon="Edit"
        @click="handleEdit"
      >
        编辑
      </el-button>

      <!-- 删除按钮 -->
      <el-button
        v-if="onDelete && auth.destroy"
        type="danger"
        size="small"
        plain
        :icon="Delete"
        @click="handleDelete"
      >
        删除
      </el-button>

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
        v-if="
          auth.resume && item.pause_time && !item.resume_time && !item.end_time
        "
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
  overflow: hidden; /* 防止内容溢出 */
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%; /* 限制标题宽度 */
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
  flex-shrink: 0; /* 防止标签缩小 */
}

.value {
  color: var(--el-text-color-primary);
  flex: 1;
  word-break: break-all;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.mr-1 {
  margin-right: 4px;
}
</style>
