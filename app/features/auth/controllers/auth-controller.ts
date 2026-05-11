import { BaseController } from '@core/controllers/base-controller';
import express from 'express';
import { StatusCode } from 'status-code-enum';
import { Inject, Service } from 'typedi';
import { AuthRequestDTO, AuthResponseDTO, RefreshTokenResponseDTO } from '../dtos/auth-dto';
import AuthService from '../services/auth-service';

@Service()
class AuthController extends BaseController {
  @Inject(() => AuthService) private readonly authService!: AuthService;

  /**
   * Authenticate user using username and password, returns access and refresh tokens.
   */
  async auth(req: express.Request, res: express.Response): Promise<express.Response<AuthResponseDTO> | void> {
    const authenticationDTO = await this.authService.auth(req.body as AuthRequestDTO, res);
    return res.status(StatusCode.SuccessOK).send(authenticationDTO);
  }

  /**
   * Refresh access token using refresh token from cookie.
   */
  async refreshToken(req: express.Request, res: express.Response): Promise<express.Response<RefreshTokenResponseDTO>> {
    const authenticationDTO = await this.authService.refreshToken(req, res);
    return res.status(StatusCode.SuccessOK).send(authenticationDTO);
  }

  /**
   * Logs out the current user by clearing the refresh token cookie.
   */
  async logout(_req: express.Request, res: express.Response): Promise<express.Response> {
    this.authService.logout(res);
    return res.status(StatusCode.SuccessOK).send();
  }
}

export default AuthController;
