import type { Request as ExpressRequest } from "express";
import {
  Body,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
} from "tsoa";
import { BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { postService } from "../services/postService.ts";
import { isAdminFromRequest } from "../utils.ts";

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
  async listPosts(@Request() req: ExpressRequest) {
    const isAdmin = await isAdminFromRequest(req);
    return postService.listPosts(isAdmin);
  }

  @Get("{postId}")
  @SuccessResponse(200)
  async getPost(@Request() req: ExpressRequest, @Path() postId: string) {
    const isAdmin = await isAdminFromRequest(req);
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
    const user = req.user as Express.User;
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
    const user = req.user as Express.User;
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
    const user = req.user as Express.User;
    const isAdmin = await isAdminFromRequest(req);
    await postService.deletePost(user.sub, postId, isAdmin);
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
    const user = req.user as Express.User;
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
    const user = req.user as Express.User;
    const isAdmin = await isAdminFromRequest(req);
    await postService.deleteReply(user.sub, postId, replyId, isAdmin);
  }
}
