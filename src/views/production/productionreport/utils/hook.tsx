import { productionreportApi } from "@/views/production/productionreport/utils/api";
import { getCurrentInstance, h, reactive, type Ref, shallowRef } from "vue";
import { getDefaultAuths } from "@/router/utils";
import type { OperationProps, PageTableColumn } from "@/components/RePlusPage";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { handleOperation } from "@/components/RePlusPage";
import { ElTag } from "element-plus";
import Check from "@iconify-icons/ep/check";
import VideoPause from "@iconify-icons/ep/video-pause";
import VideoPlay from "@iconify-icons/ep/video-play";
import { useI18n } from "vue-i18n"; // 添加 useI18n 导入

export function useProductionReport(tableRef: Ref) {
  // 添加 t 变量定义
  const { t } = useI18n();

  // 权限判断，用于判断是否有该权限
  const api = reactive(productionreportApi);
  const auth = reactive({
    complete: false,
    pause: false,
    resume: false,
    ...getDefaultAuths(getCurrentInstance(), ["complete", "pause", "resume"])
  });

  /**
   * 添加操作按钮，用于控制报工的完成、暂停和恢复
   */
  const operationButtonsProps = shallowRef<OperationProps>({
    width: 300,
    showNumber: 4,
    buttons: [
      // 暂停按钮
      {
        text: "暂停",
        code: "pause",
        props: {
          type: "warning",
          icon: useRenderIcon(VideoPause),
          link: true
        },
        onClick: ({ row, loading }) => {
          loading.value = true;
          handleOperation({
            t,
            apiReq: api.pause(row?.pk ?? row?.id),
            success() {
              tableRef.value?.handleGetData();
            },
            requestEnd() {
              loading.value = false;
            }
          });
        },
        show: row => auth.pause && !row.end_time && !row.pause_time
      },
      // 恢复按钮
      {
        text: "恢复",
        code: "resume",
        props: {
          type: "primary",
          icon: useRenderIcon(VideoPlay),
          link: true
        },
        onClick: ({ row, loading }) => {
          loading.value = true;
          handleOperation({
            t,
            apiReq: api.resume(row?.pk ?? row?.id),
            success() {
              tableRef.value?.handleGetData();
            },
            requestEnd() {
              loading.value = false;
            }
          });
        },
        show: row =>
          auth.resume && row.pause_time && !row.resume_time && !row.end_time
      },
      // 完成按钮
      {
        text: "完成",
        code: "complete",
        props: {
          type: "success",
          icon: useRenderIcon(Check),
          link: true
        },
        onClick: ({ row, loading }) => {
          loading.value = true;
          handleOperation({
            t,
            apiReq: api.complete(row?.pk ?? row?.id),
            success() {
              tableRef.value?.handleGetData();
            },
            requestEnd() {
              loading.value = false;
            }
          });
        },
        show: row => auth.complete && !row.end_time
      }
    ]
  });

  /**
   * 表格列操作
   * @param columns
   */
  const listColumnsFormat = (columns: PageTableColumn[]) => {
    columns.forEach(column => {
      switch (column._column?.key) {
        case "status":
          column["cellRenderer"] = ({ row }) => {
            let type = "info";
            let text = "进行中";

            if (row.end_time) {
              type = "success";
              text = "已完成";
            } else if (row.pause_time && !row.resume_time) {
              type = "warning";
              text = "已暂停";
            }

            return h(ElTag, { type }, () => text);
          };
          break;
      }
    });
    return columns;
  };

  return {
    api,
    auth,
    listColumnsFormat,
    operationButtonsProps
  };
}
