import type { Request as ExpressRequest } from "express";
import {
  Body,
  Delete,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
} from "tsoa";
import { getUserFromRequest } from "../lib/accessControl.ts";
import { BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { replyService } from "../services/replyService.ts";

export interface CreateReplyRequest {
  content: string;
  anonymous?: boolean;
}

@Route("posts/{postId}/replies")
export class ReplyController {
  @Post("/")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(201)
  async createReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Body() body: CreateReplyRequest,
  ) {
    const user = await getUserFromRequest(req);
    return replyService.createReply(
      user,
      postId,
      body.content,
      body.anonymous ?? false,
    );
  }

  @Delete("{replyId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(204)
  async deleteReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Path() replyId: string,
  ) {
    const user = await getUserFromRequest(req);
    await replyService.deleteReply(user, postId, replyId);
  }
}
