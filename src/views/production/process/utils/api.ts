import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class ProcessApi extends BaseApi {
  push = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/push`
    );
  };
}

const processApi = new ProcessApi("/api/production/process");
export { processApi };
