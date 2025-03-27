import { workshopApi } from "@/views/production/workshop/utils/api";
import { getCurrentInstance, reactive, type Ref } from "vue";
import { getDefaultAuths } from "@/router/utils";

export function useWorkShop(tableRef: Ref) {
  // 权限判断，用于判断是否有该权限
  const api = reactive(workshopApi);
  const auth = reactive({
    push: false,
    ...getDefaultAuths(getCurrentInstance(), ["push"])
  });

  return {
    api,
    auth
  };
}
