import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GovbrAuthorizeQueryDto } from './dto/govbr-authorize-query.dto';
import { GovbrCallbackDto } from './dto/govbr-callback.dto';
import { GovbrService } from './govbr.service';
import { ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { InternalServerError } from 'src/shared/config/swagger/responses/errors';

@ApiInternalServerErrorResponse(InternalServerError)
@Controller()
export class GovbrController {
  constructor(private readonly service: GovbrService) {}

  @Get('govbr/authorize')
  async authorize(
    @Query() query: GovbrAuthorizeQueryDto,
    @Res() res: Response,
  ) {
    try {
      const url = await this.service.buildAuthorizeUrl(query.origin);
      return res.redirect(url);
    } catch (err: any) {
      const html = this.service.renderPopupClosePage(
        this.service.getOriginForResponse(query.origin, undefined),
        {
          status: 'error',
          message:
            err?.message || 'Não foi possível iniciar o login com o gov.br',
          error: err?.name,
        },
      );
      return res.status(400).type('html').send(html);
    }
  }

  @Get('govbr/callback')
  async callbackLegacy(@Query() query: GovbrCallbackDto, @Res() res: Response) {
    return this.handleCallback(query, res);
  }

  @Get('retornoWebHook')
  async callback(@Query() query: GovbrCallbackDto, @Res() res: Response) {
    return this.handleCallback(query, res);
  }

  private async handleCallback(query: GovbrCallbackDto, res: Response) {
    const originFromState = this.service.extractOriginFromState(query.state);
    const origin = this.service.getOriginForResponse(
      undefined,
      originFromState ?? undefined,
    );

    if (query.error) {
      const html = this.service.renderPopupClosePage(origin, {
        status: 'error',
        message: query.error_description || query.error,
        error: query.error,
      });
      return res.status(400).type('html').send(html);
    }

    try {
      const result = await this.service.handleCallback(query.code, query.state);
      const html = this.service.renderPopupClosePage(result.origin, {
        status: 'success',
        token: result.token,
        user: result.user,
      });
      return res.type('html').send(html);
    } catch (err: any) {
      const html = this.service.renderPopupClosePage(origin, {
        status: 'error',
        message:
          err?.message ||
          'Não foi possível concluir o login com o provedor gov.br',
        error: err?.name,
      });
      return res.status(400).type('html').send(html);
    }
  }
}
