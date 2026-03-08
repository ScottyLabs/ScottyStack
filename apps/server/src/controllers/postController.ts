import type { Request as ExpressRequest } from "express";
import {
  Body,
  Get,
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
    return postService.createPost(user.sub, body.title, body.content);
  }
}
