<script lang="ts" setup>
import { RePlusPage } from "@/components/RePlusPage";
import { useProcessStep } from "./utils/hook";
import { ref } from "vue";

defineOptions({
  name: "工序管理" // 必须定义，用于菜单自动匹配组件
});
const tableRef = ref();
const { api, auth } = useProcessStep(tableRef);
</script>
<template>
  <RePlusPage
    ref="tableRef"
    :api="api"
    :auth="auth"
    locale-name="ProcessStep"
  />
</template>
