<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, reactive } from "vue";
import MobileCard from "./MobileCard.vue";
import MobileForm from "./MobileForm.vue";
import {
  ElPagination,
  ElEmpty,
  ElMessage,
  ElMessageBox,
  ElDrawer
} from "element-plus";
import { Plus, Search, RefreshRight } from "@element-plus/icons-vue";

const props = defineProps({
  api: {
    type: Object,
    required: true
  },
  auth: {
    type: Object,
    required: true
  }
});

const loading = ref(false);
const dataList = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
});

// 筛选条件
const filterForm = reactive({
  keyword: "",
  date_range: []
});

// 控制组件是否已卸载
const isUnmounted = ref(false);

// 控制筛选区域显示/隐藏
const showFilter = ref(false);

// 获取数据
const fetchData = async () => {
  if (loading.value || isUnmounted.value) return;

  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: filterForm.keyword || undefined,
      // 移除 status 参数
      start_date: filterForm.date_range?.[0] || undefined,
      end_date: filterForm.date_range?.[1] || undefined
    };

    const res = await props.api.list(params);
    if (!isUnmounted.value && res.code === 1000) {
      dataList.value = res.data.results || [];
      pagination.value.total = res.data.total || 0;
    }
  } catch (error) {
    if (!isUnmounted.value) {
      console.error("获取数据失败", error);
    }
  } finally {
    if (!isUnmounted.value) {
      loading.value = false;
    }
  }
};

// 页码变化
const handleCurrentChange = page => {
  if (isUnmounted.value) return;
  pagination.value.page = page;
  fetchData();
};

// 每页条数变化
const handleSizeChange = size => {
  if (isUnmounted.value) return;
  pagination.value.limit = size;
  pagination.value.page = 1;
  fetchData();
};

// 刷新数据
const refreshData = () => {
  if (isUnmounted.value) return;
  fetchData();
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.keyword = "";
  // 移除对 status 的重置
  filterForm.date_range = [];
  fetchData();
};

// 应用筛选
const applyFilter = () => {
  pagination.value.page = 1;
  fetchData();
};

// 处理删除
const handleDelete = item => {
  ElMessageBox.confirm("确定要删除该报工记录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = await props.api.destroy(item.pk);
        if (res.code === 1000) {
          ElMessage.success("删除成功");
          refreshData();
        } else {
          ElMessage.error(res.message || "删除失败");
        }
      } catch (error) {
        ElMessage.error("操作失败");
      }
    })
    .catch(() => {});
};

// 组件挂载时获取数据
onMounted(() => {
  isUnmounted.value = false;
  fetchData();
});

// 组件卸载前清理资源
onBeforeUnmount(() => {
  isUnmounted.value = true;
  dataList.value = [];
});

// 表单相关状态
const showForm = ref(false);
const isEdit = ref(false);
const currentItemId = ref(null);

// 处理新增
const handleAdd = () => {
  isEdit.value = false;
  currentItemId.value = null;
  showForm.value = true;
};

// 处理编辑
const handleEdit = item => {
  isEdit.value = true;
  currentItemId.value = item.pk;
  showForm.value = true;
};

// 表单提交成功
const handleFormSuccess = () => {
  showForm.value = false;
  refreshData();
};

// 表单取消
const handleFormCancel = () => {
  showForm.value = false;
};
</script>

<template>
  <div class="mobile-view">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button
        type="primary"
        :icon="Plus"
        @click="handleAdd"
        v-if="auth.create"
        >新增</el-button
      >
      <el-button :icon="Search" @click="showFilter = !showFilter">{{
        showFilter ? "隐藏筛选" : "显示筛选"
      }}</el-button>
      <el-button :icon="RefreshRight" @click="refreshData" :loading="loading"
        >刷新</el-button
      >
    </div>

    <!-- 筛选区域 -->
    <div v-if="showFilter" class="filter-container">
      <el-form :model="filterForm" label-position="top" size="small">
        <el-form-item label="工单令号">
          <el-input
            v-model="filterForm.keyword"
            placeholder="输入令号搜索"
            clearable
          />
        </el-form-item>

        <!-- 移除状态筛选 -->

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>

        <div class="filter-buttons">
          <el-button type="primary" @click="applyFilter">应用筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </div>
      </el-form>
    </div>

    <div v-loading="loading" class="card-container">
      <template v-if="dataList.length > 0">
        <MobileCard
          v-for="item in dataList"
          :key="item.pk"
          :item="item"
          :auth="auth"
          :onRefresh="refreshData"
          :onEdit="handleEdit"
          :onDelete="auth.destroy ? handleDelete : null"
        />
      </template>
      <el-empty v-else description="暂无数据" />
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>

    <!-- 表单抽屉 -->
    <el-drawer
      v-model="showForm"
      :title="isEdit ? '编辑生产报工' : '新增生产报工'"
      direction="rtl"
      size="100%"
      :destroy-on-close="true"
    >
      <MobileForm
        :is-edit="isEdit"
        :item-id="currentItemId"
        :on-success="handleFormSuccess"
        :on-cancel="handleFormCancel"
      />
    </el-drawer>
  </div>
</template>

<style scoped>
.mobile-view {
  padding: 16px;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-container {
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.filter-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.card-container {
  min-height: 200px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
