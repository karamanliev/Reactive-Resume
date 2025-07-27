import { Controller } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Config } from "./config/schema";
import { ResumeService } from "./resume/resume.service";

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly resumeService: ResumeService,
  ) {}
}
