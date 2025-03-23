import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class WorkshopApi extends BaseApi {
  push = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/push`
    );
  };
}

const workshopApi = new WorkshopApi("/api/production/workshop");
export { workshopApi };
