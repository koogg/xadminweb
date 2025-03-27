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
  production_order: null,
  process_step: null,
  start_time: "",
  // 修改为 null 而不是空字符串
  pause_time: null,
  resume_time: null,
  end_time: null
});

const rules = {
  workshop: [{ required: true, message: "请选择生产车间", trigger: "change" }],
  production_order: [
    { required: true, message: "请选择生产工单", trigger: "change" }
  ],
  process_step: [{ required: true, message: "请选择工序", trigger: "change" }],
  start_time: [{ required: true, message: "请选择开始时间", trigger: "change" }]
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
      workshopOptions.value = res.data.results.map(item => ({
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
      // 再次过滤，确保只包含待生产和生产中的工单
      const filteredResults = res.data.results.filter(
        item =>
          item.status &&
          (item.status.value === "pending" ||
            item.status.value === "in_progress")
      );

      orderOptions.value = filteredResults.map(item => ({
        value: item.pk,
        label: `${item.order_number}-${item.product_name}`
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
    // 先获取工单详情，找到对应的工艺ID
    const orderRes = await productionorderApi.retrieve(orderId);
    if (orderRes.code === 1000 && orderRes.data) {
      const processId = orderRes.data.process?.pk;
      if (processId) {
        // 根据工艺ID获取工序列表
        const stepsRes = await processstepApi.list({
          process: processId,
          is_active: true
        });
        if (stepsRes.code === 1000) {
          processStepOptions.value = stepsRes.data.results.map(step => ({
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
    <div class="form-header">
      <h3>{{ isEdit ? "编辑生产报工" : "新增生产报工" }}</h3>
    </div>

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
      <el-form-item label="生产工单" prop="production_order">
        <el-select
          v-model="formData.production_order"
          placeholder="请选择生产工单"
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

      <!-- 开始时间 -->
      <el-form-item label="开始时间" prop="start_time">
        <el-date-picker
          v-model="formData.start_time"
          type="datetime"
          placeholder="请选择开始时间"
          style="width: 100%"
          :disabled="isEdit"
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

<style scoped>
.mobile-form {
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-header {
  margin-bottom: 20px;
  text-align: center;
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
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
