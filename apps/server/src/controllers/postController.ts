import type { Request as ExpressRequest } from "express";
import {
  Body,
  Get,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
} from "tsoa";
import { BEARER_AUTH, OIDC_AUTH } from "../lib/authentication.ts";
import { postService } from "../services/postService.ts";

export interface CreatePostRequest {
  title: string;
  content: string;
}

@Route("posts")
export class PostController {
  @Get("/")
  @SuccessResponse(200)
  async listPosts() {
    return postService.listPosts();
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
    return postService.createPost(user.id, body.title, body.content);
  }
}
