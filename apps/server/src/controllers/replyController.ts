import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
} from "tsoa";

import { getAcUserFromRequest } from "../lib/accessControl.ts";
import { BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { replyService } from "../services/replyService.ts";

export interface CreateReplyRequest {
  content: string;
  anonymous?: boolean;
}

export interface UpdateReplyRequest {
  content: string;
  anonymous?: boolean;
}

@Route("posts/{postId}/replies")
export class ReplyController extends Controller {
  @Post("/")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(201)
  async createReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Body() body: CreateReplyRequest,
  ) {
    this.setStatus(201);
    const user = await getAcUserFromRequest(req);
    return replyService.createReply(user, postId, body.content, body.anonymous ?? false);
  }

  @Patch("{replyId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(200)
  async updateReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Path() replyId: string,
    @Body() body: UpdateReplyRequest,
  ) {
    const user = await getAcUserFromRequest(req);
    return replyService.updateReply(user, postId, replyId, body.content, body.anonymous ?? false);
  }

  @Delete("{replyId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(204)
  async deleteReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Path() replyId: string,
  ): Promise<void> {
    this.setStatus(204);
    const user = await getAcUserFromRequest(req);
    await replyService.deleteReply(user, postId, replyId);
  }
}
