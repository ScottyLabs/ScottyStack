import { Get, Query, Route, Security, SuccessResponse } from "tsoa";

import { ADMIN_SCOPE, BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { userService } from "../services/userService.ts";

export interface UserSummary {
  id: string;
  name: string;
  postCount: number;
  replyCount: number;
}

@Route("admin")
export class AdminController {
  @Get("users")
  @Security(OIDC_AUTH, [ADMIN_SCOPE])
  @Security(BEARER_AUTH, [ADMIN_SCOPE])
  @SuccessResponse(200)
  async listUsers(@Query() page?: number, @Query() limit?: number): Promise<UserSummary[]> {
    return userService.listUsers({
      ...(page !== undefined && { page }),
      ...(limit !== undefined && { limit }),
    });
  }
}
