<script lang="ts" setup>
import { RePlusPage } from "@/components/RePlusPage";
import { useProductionReport } from "./utils/hook";
import { ref } from "vue";

defineOptions({
  name: "生产报工" // 必须定义，用于菜单自动匹配组件
});
const tableRef = ref();
const { api, auth } = useProductionReport(tableRef);
</script>
<template>
  <RePlusPage
    ref="tableRef"
    :api="api"
    :auth="auth"
    locale-name="ProductionReport"
  />
</template>
