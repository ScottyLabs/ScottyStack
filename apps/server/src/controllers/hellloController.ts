import type { Request as ExpressRequest } from "express";
import { Get, Request, Route, SuccessResponse } from "tsoa";
import { helloService } from "../services/helloService";

@Route("hello")
export class HelloController {
  @Get("/")
  @SuccessResponse(200)
  async getHello(@Request() _req: ExpressRequest) {
    return helloService.hello();
  }
}
