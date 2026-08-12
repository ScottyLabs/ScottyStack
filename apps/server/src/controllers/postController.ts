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

import { getAcUserFromRequest } from "../lib/accessControl.ts";
import { BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { postService } from "../services/postService.ts";

export interface CreatePostRequest {
  title: string;
  content: string;
  anonymous?: boolean;
}

export interface UpdatePostRequest {
  title: string;
  content: string;
  anonymous?: boolean;
}

export interface PostRecordResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplyResponse {
  id: string;
  userId: string;
  content: string;
  anonymous: boolean;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostResponse extends PostRecordResponse {
  authorName: string;
  replies: ReplyResponse[];
}

export interface PostListItemResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostListResponse {
  posts: PostListItemResponse[];
  nextCursor: string | null;
}

@Route("posts")
export class PostController {
  @Get("/")
  @SuccessResponse(200)
  async listPosts(
    @Request() req: ExpressRequest,
    @Query() limit?: number,
    @Query() cursor?: string,
  ): Promise<PostListResponse> {
    const user = await getAcUserFromRequest(req);
    return postService.listPosts(user, limit ?? 20, cursor);
  }

  @Get("{postId}")
  @SuccessResponse(200)
  async getPost(@Request() req: ExpressRequest, @Path() postId: string): Promise<PostResponse> {
    const requestUser = await getAcUserFromRequest(req);
    return postService.getPostById(requestUser, postId);
  }

  @Post("/")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(201)
  async createPost(
    @Request() req: ExpressRequest,
    @Body() body: CreatePostRequest,
  ): Promise<PostRecordResponse | undefined> {
    const user = await getAcUserFromRequest(req);
    return postService.createPost(user, body.title, body.content, body.anonymous ?? false);
  }

  @Patch("{postId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(200)
  async updatePost(
    @Request() req: ExpressRequest,
    @Path() postId: string,
    @Body() body: UpdatePostRequest,
  ): Promise<PostRecordResponse | undefined> {
    const user = await getAcUserFromRequest(req);
    return postService.updatePost(user, postId, body.title, body.content, body.anonymous ?? false);
  }

  @Delete("{postId}")
  @Security(OIDC_AUTH)
  @Security(BEARER_AUTH)
  @SuccessResponse(204)
  async deletePost(@Request() req: ExpressRequest, @Path() postId: string): Promise<void> {
    const user = await getAcUserFromRequest(req);
    await postService.deletePost(user, postId);
  }
}
