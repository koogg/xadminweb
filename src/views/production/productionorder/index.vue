<script lang="ts" setup>
import { RePlusPage } from "@/components/RePlusPage";
import { useProductionOrder } from "./utils/hook";
import { ref } from "vue";

defineOptions({
  name: "生产订单" // 必须定义，用于菜单自动匹配组件
});
const tableRef = ref();
const { api, auth } = useProductionOrder(tableRef);
</script>
<template>
  <RePlusPage
    ref="tableRef"
    :api="api"
    :auth="auth"
    locale-name="ProductionOrder"
  />
</template>
