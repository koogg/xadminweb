import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class ProcessStepApi extends BaseApi {
  push = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/push`
    );
  };
}

const processstepApi = new ProcessStepApi("/api/production/process-step");
export { processstepApi };
