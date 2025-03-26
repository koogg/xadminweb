<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import MobileCard from './MobileCard.vue';
import { ElPagination, ElEmpty } from 'element-plus';

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

// 控制组件是否已卸载
const isUnmounted = ref(false);

// 获取数据
const fetchData = async () => {
  if (loading.value || isUnmounted.value) return;
  
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    
    const res = await props.api.list(params);
    if (!isUnmounted.value && res.code === 1000) {
      dataList.value = res.data.results || [];
      pagination.value.total = res.data.total || 0;
    }
  } catch (error) {
    if (!isUnmounted.value) {
      console.error('获取数据失败', error);
    }
  } finally {
    if (!isUnmounted.value) {
      loading.value = false;
    }
  }
};

// 页码变化
const handleCurrentChange = (page) => {
  if (isUnmounted.value) return;
  pagination.value.page = page;
  fetchData();
};

// 每页条数变化
const handleSizeChange = (size) => {
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
</script>

<template>
  <div class="mobile-view">
    <div v-loading="loading" class="card-container">
      <template v-if="dataList.length > 0">
        <MobileCard 
          v-for="item in dataList" 
          :key="item.pk" 
          :item="item" 
          :auth="auth"
          :onRefresh="refreshData"
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
  </div>
</template>

<style scoped>
.mobile-view {
  padding: 16px;
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