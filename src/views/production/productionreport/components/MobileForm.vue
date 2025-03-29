<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import { productionreportApi } from "../utils/api";
import { useWorkShop } from "@/views/production/workshop/utils/hook";
import { useProductionOrder } from "@/views/production/productionorder/utils/hook";
import { useProcessStep } from "@/views/production/processstep/utils/hook";
import { useProcess } from "@/views/production/process/utils/hook";

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  itemId: {
    type: [Number, String],
    default: null
  },
  onSuccess: {
    type: Function,
    default: () => {}
  },
  onCancel: {
    type: Function,
    default: () => {}
  }
});

// 初始化各模块的API
const dummyRef = ref();
const { api: workshopApi } = useWorkShop(dummyRef);
const { api: productionorderApi } = useProductionOrder(dummyRef);
const { api: processstepApi } = useProcessStep(dummyRef);
const { api: processApi } = useProcess(dummyRef);

const formData = reactive({
  workshop: null,
  production_name: null,
  process_step: null,
  start_time: "",
  pause_time: null,
  resume_time: null,
  end_time: null
});

const rules = {
  workshop: [{ required: true, message: "请选择生产车间", trigger: "change" }],
  production_order: [
    { required: true, message: "请选择生产令号", trigger: "change" }
  ],
  process_step: [{ required: true, message: "请选择工序", trigger: "change" }]
  // 移除 start_time 的必填验证
};

const formRef = ref(null);
const loading = ref(false);
const workshopOptions = ref([]);
const orderOptions = ref([]);
const processStepOptions = ref([]);

// 获取车间选项
const fetchWorkshops = async () => {
  try {
    const res = await workshopApi.list({
      page: 1,
      limit: 100,
      is_active: true
    });
    if (res.code === 1000 && res.data && res.data.results) {
      workshopOptions.value = res.data.results
        .filter(item => item && item.pk !== undefined && item.name)
        .map(item => ({
          value: item.pk,
          label: item.name
        }));
    } else {
      console.error("获取车间数据失败", res.message);
    }
  } catch (error) {
    console.error("获取车间数据失败", error);
  }
};

// 获取工单选项
const fetchOrders = async (workshopId = null) => {
  try {
    const params = {
      page: 1,
      limit: 100,
      status__in: "pending,in_progress" // 确保只获取待生产和生产中的工单
    };

    // 如果指定了车间ID，添加到查询参数中
    if (workshopId) {
      params.workshop = workshopId;
    }

    const res = await productionorderApi.list(params);
    if (res.code === 1000 && res.data && res.data.results) {
      // 再次过滤，确保只包含待生产和生产中的工单，并且有有效的数据
      const filteredResults = res.data.results.filter(
        item =>
          item &&
          item.pk !== undefined &&
          item.order_number &&
          item.product_name &&
          item.production_number && // 确保有生产令号
          item.status &&
          (item.status.value === "pending" ||
            item.status.value === "in_progress")
      );

      // 修改这里，在标签中包含生产令号
      orderOptions.value = filteredResults.map(item => ({
        value: item.pk,
        label: `${item.order_number}-${item.production_number}-${item.product_name}`,
        // 保存额外数据以便后续使用
        raw: item
      }));

      // 如果没有工单数据，显示提示信息
      if (orderOptions.value.length === 0) {
        ElMessage.info("当前车间没有待生产或生产中的工单");
      }
    } else {
      console.error("获取工单数据失败", res.message);
    }
  } catch (error) {
    console.error("获取工单数据失败", error);
  }
};

// 获取工序选项
const fetchProcessSteps = async orderId => {
  if (!orderId) {
    processStepOptions.value = [];
    formData.process_step = null;
    return;
  }

  try {
    // 从工单选项中找到当前选中的工单
    const selectedOrder = orderOptions.value.find(
      option => option.value === orderId
    );

    // 如果找到工单并且工单包含工艺信息
    if (
      selectedOrder &&
      selectedOrder.raw &&
      selectedOrder.raw.process &&
      selectedOrder.raw.process.pk
    ) {
      const processId = selectedOrder.raw.process.pk;

      // 根据工艺ID获取工序列表
      const stepsRes = await processstepApi.list({
        process: processId,
        is_active: true
      });

      if (stepsRes.code === 1000 && stepsRes.data && stepsRes.data.results) {
        processStepOptions.value = stepsRes.data.results
          .filter(
            step => step && step.pk !== undefined && step.code && step.name
          )
          .map(step => ({
            value: step.pk,
            label: `${step.code}-${step.name}`
          }));
      } else {
        console.error("获取工序列表失败", stepsRes.message);
      }
    } else {
      // 如果在选项中找不到工单信息，则回退到原来的方法
      const orderRes = await productionorderApi.retrieve(orderId);
      if (orderRes.code === 1000 && orderRes.data) {
        const processId = orderRes.data.process?.pk;
        if (processId) {
          // 根据工艺ID获取工序列表
          const stepsRes = await processstepApi.list({
            process: processId,
            is_active: true
          });
          if (
            stepsRes.code === 1000 &&
            stepsRes.data &&
            stepsRes.data.results
          ) {
            processStepOptions.value = stepsRes.data.results
              .filter(
                step => step && step.pk !== undefined && step.code && step.name
              )
              .map(step => ({
                value: step.pk,
                label: `${step.code}-${step.name}`
              }));
          } else {
            console.error("获取工序列表失败", stepsRes.message);
          }
        }
      } else {
        console.error("获取工单详情失败", orderRes.message);
      }
    }
  } catch (error) {
    console.error("获取工序数据失败", error);
  }
};

// 监听车间变化，获取对应的工单
watch(
  () => formData.workshop,
  newVal => {
    if (newVal) {
      fetchOrders(newVal);
    } else {
      // 如果没有选择车间，则获取所有工单
      fetchOrders();
    }
    // 重置工单和工序选择
    formData.production_order = null;
    formData.process_step = null;
    processStepOptions.value = [];
  }
);

// 监听工单变化，获取对应的工序
watch(
  () => formData.production_order,
  newVal => {
    if (newVal) {
      fetchProcessSteps(newVal);
    } else {
      processStepOptions.value = [];
      formData.process_step = null;
    }
  }
);

// 获取选项数据
const fetchOptions = async () => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "加载中..."
  });
  try {
    // 先获取车间数据
    await fetchWorkshops();
    // 如果是编辑模式且已有车间ID，则根据车间ID获取工单
    if (props.isEdit && formData.workshop) {
      await fetchOrders(formData.workshop);
    } else {
      // 否则获取所有工单
      await fetchOrders();
    }
  } catch (error) {
    console.error("获取选项数据失败", error);
    ElMessage.error("获取选项数据失败");
  } finally {
    loadingInstance.close();
  }
};

// 获取编辑数据
const fetchEditData = async () => {
  if (!props.isEdit || !props.itemId) return;

  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "加载数据中..."
  });
  try {
    const res = await productionreportApi.retrieve(props.itemId);
    if (res.code === 1000 && res.data) {
      // 填充表单数据
      formData.workshop = res.data.workshop?.pk || null;
      formData.production_order = res.data.production_order?.pk || null;
      formData.process_step = res.data.process_step?.pk || null;
      formData.start_time = res.data.start_time || "";
      // 修改为 null 而不是空字符串
      formData.pause_time = res.data.pause_time || null;
      formData.resume_time = res.data.resume_time || null;
      formData.end_time = res.data.end_time || null;

      // 如果有工单ID，获取对应的工序
      if (formData.production_order) {
        await fetchProcessSteps(formData.production_order);
      }
    } else {
      ElMessage.error("获取数据失败");
    }
  } catch (error) {
    console.error("获取数据失败", error);
    ElMessage.error("获取数据失败");
  } finally {
    loadingInstance.close();
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    loading.value = true;
    try {
      // 处理表单数据，确保时间字段为 null 而不是空字符串
      const submitData = {
        ...formData,
        start_time: formData.start_time || null, // 确保空值为 null
        pause_time: formData.pause_time || null,
        resume_time: formData.resume_time || null,
        end_time: formData.end_time || null
      };

      let res;
      if (props.isEdit && props.itemId) {
        // 更新
        res = await productionreportApi.update(props.itemId, submitData);
      } else {
        // 新增
        res = await productionreportApi.create(submitData);
      }

      if (res.code === 1000) {
        ElMessage.success(props.isEdit ? "修改成功" : "新增成功");
        props.onSuccess(res.data);
      } else {
        ElMessage.error(
          res.message || (props.isEdit ? "修改失败" : "新增失败")
        );
      }
    } catch (error) {
      console.error("提交失败", error);
      ElMessage.error("操作失败");
    } finally {
      loading.value = false;
    }
  });
};

// 取消操作
const cancelForm = () => {
  props.onCancel();
};

// 初始化
onMounted(() => {
  fetchOptions();
  if (props.isEdit && props.itemId) {
    fetchEditData();
  }
});
</script>

<template>
  <div class="mobile-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      class="form-content"
    >
      <!-- 生产车间 -->
      <el-form-item label="生产车间" prop="workshop">
        <el-select
          v-model="formData.workshop"
          placeholder="请选择生产车间"
          style="width: 100%"
          :disabled="isEdit"
        >
          <el-option
            v-for="item in workshopOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 生产工单 -->
      <el-form-item label="生产令号" prop="production_order">
        <el-select
          v-model="formData.production_order"
          placeholder="请选择生产令号"
          style="width: 100%"
          :disabled="isEdit"
        >
          <el-option
            v-for="item in orderOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 工序 -->
      <el-form-item label="工序" prop="process_step">
        <el-select
          v-model="formData.process_step"
          placeholder="请选择工序"
          style="width: 100%"
          :disabled="isEdit || !formData.production_order"
        >
          <el-option
            v-for="item in processStepOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 开始时间 - 优化日期选择器 -->
      <el-form-item label="开始时间" prop="start_time">
        <el-date-picker
          v-model="formData.start_time"
          type="datetime"
          placeholder="请选择开始时间"
          style="width: 100%"
          :disabled="isEdit"
          popper-class="mobile-date-picker"
          teleported
          placement="bottom-start"
          :popper-options="{
            strategy: 'fixed',
            modifiers: [
              {
                name: 'preventOverflow',
                options: {
                  padding: 10,
                  boundariesElement: 'viewport'
                }
              },
              {
                name: 'flip',
                options: {
                  fallbackPlacements: ['top-start', 'top', 'top-end']
                }
              }
            ]
          }"
          :shortcuts="[]"
        />
      </el-form-item>
    </el-form>

    <div class="form-footer">
      <el-button @click="cancelForm">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading">
        {{ isEdit ? "保存修改" : "提交" }}
      </el-button>
    </div>
  </div>
</template>

<style>
/* 全局样式，优化移动端日期选择器 */
.mobile-date-picker.el-picker__popper {
  position: fixed !important;
  max-width: 100vw !important;
  width: 90vw !important;
  margin: 0 auto !important;
  left: 5vw !important;
  right: 5vw !important;
  transform: none !important;
  z-index: 2100 !important;
}

/* 移除左侧边栏的空间 */
.mobile-date-picker .el-picker-panel__sidebar {
  display: none !important;
}

/* 确保日期面板占满整个宽度 */
.mobile-date-picker .el-picker-panel__body {
  min-width: auto !important;
  width: 100% !important;
  padding: 0 !important;
}

/* 调整日期面板内容布局 */
.mobile-date-picker .el-date-picker__header {
  margin: 8px 0 !important;
  padding: 0 12px !important;
}

.mobile-date-picker .el-picker-panel__content {
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 调整日期表格单元格大小 */
.mobile-date-picker .el-date-table {
  width: 100% !important;
  table-layout: fixed !important;
}

.mobile-date-picker .el-date-table th,
.mobile-date-picker .el-date-table td {
  padding: 2px !important;
  text-align: center !important;
}

.mobile-date-picker .el-date-table td {
  width: 14.28% !important;
  height: 32px !important;
}

/* 调整时间选择器样式 */
.mobile-date-picker .el-date-picker__time-header {
  padding: 8px 12px !important;
}

.mobile-date-picker .el-time-panel {
  width: 100% !important;
}

.mobile-date-picker .el-time-spinner__wrapper {
  width: 33.33% !important;
  max-width: none !important;
}

.mobile-date-picker .el-time-spinner__item {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 14px !important;
}

/* 移除右侧留白 */
.mobile-date-picker .el-date-picker__body {
  width: 100% !important;
}

.mobile-date-picker .el-date-range-picker__content {
  width: 100% !important;
}

/* 添加自动翻转功能 */
.mobile-date-picker.el-popper[data-popper-placement^="top"] .el-popper__arrow {
  bottom: -6px !important;
}

.mobile-date-picker.el-popper[data-popper-placement^="bottom"]
  .el-popper__arrow {
  top: -6px !important;
}

/* 优化日期选择器在小屏幕上的显示 */
@media screen and (max-width: 480px) {
  .mobile-date-picker .el-date-picker__header-label {
    font-size: 14px !important;
  }

  .mobile-date-picker .el-picker-panel__icon-btn {
    margin: 0 1px !important;
  }

  .mobile-date-picker .el-date-table th {
    font-size: 12px !important;
  }

  .mobile-date-picker .el-date-table td {
    font-size: 12px !important;
  }
}
</style>

<style scoped>
.mobile-form {
  padding: 0 16px 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
}

.form-content {
  margin-bottom: 20px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
