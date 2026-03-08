import type { Request as ExpressRequest } from "express";
import {
  Body,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
} from "tsoa";
import { BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { AuthenticationError } from "../middlewares/errorHandler.ts";
import { postService } from "../services/postService.ts";
import { getUserFromRequest } from "../utils.ts";

export interface CreatePostRequest {
  title: string;
  content: string;
  anonymous?: boolean;
}

export interface CreateReplyRequest {
  content: string;
  anonymous?: boolean;
}

export interface UpdatePostRequest {
  title: string;
  content: string;
  anonymous?: boolean;
}

@Route("posts")
export class PostController {
  @Get("/")
  @SuccessResponse(200)
  async listPosts(
    @Request() req: ExpressRequest,
    @Query() limit?: number,
    @Query() cursor?: string,
  ) {
    const user = await getUserFromRequest(req);
    const isAdmin = user?.isAdmin ?? false;
    return postService.listPosts(isAdmin, limit ?? 20, cursor);
  }

  @Get("{postId}")
  @SuccessResponse(200)
  async getPost(@Request() req: ExpressRequest, @Path() postId: string) {
    const user = await getUserFromRequest(req);
    const isAdmin = user?.isAdmin ?? false;
    return postService.getPostById(postId, isAdmin);
  }

  @Post("/")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(201)
  async createPost(
    @Request() req: ExpressRequest,
    @Body() body: CreatePostRequest,
  ) {
    const user = await getUserFromRequest(req);
    if (!user) throw new AuthenticationError();
    return postService.createPost(
      user.sub,
      body.title,
      body.content,
      body.anonymous ?? false,
    );
  }

  @Patch("{postId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(200)
  async updatePost(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Body() body: UpdatePostRequest,
  ) {
    const user = await getUserFromRequest(req);
    if (!user) throw new AuthenticationError();
    return postService.updatePost(
      user.sub,
      postId,
      body.title,
      body.content,
      body.anonymous ?? false,
    );
  }

  @Delete("{postId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(204)
  async deletePost(@Request() req: ExpressRequest, @Path() postId: string) {
    const user = await getUserFromRequest(req);
    if (!user) throw new AuthenticationError();
    await postService.deletePost(user.sub, postId, user.isAdmin);
  }

  @Post("{postId}/replies")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(201)
  async createReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Body() body: CreateReplyRequest,
  ) {
    const user = await getUserFromRequest(req);
    if (!user) throw new AuthenticationError();
    return postService.createReply(
      user.sub,
      postId,
      body.content,
      body.anonymous ?? false,
    );
  }

  @Delete("{postId}/replies/{replyId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(204)
  async deleteReply(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Path() replyId: string,
  ) {
    const user = await getUserFromRequest(req);
    if (!user) throw new AuthenticationError();
    await postService.deleteReply(user.sub, postId, replyId, user.isAdmin);
  }
}
