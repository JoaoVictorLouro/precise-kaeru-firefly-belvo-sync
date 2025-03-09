export class HttpError extends Error {
  readonly response: Response;
  readonly statusCode: number;
  readonly responseBody: string | undefined;

  constructor(message: string, response: Response, responseBody?: string) {
    super();
    this.message = message;
    this.statusCode = response.status;
    this.response = response;
    this.responseBody = responseBody;
  }

  toString() {
    const base = super.toString();
    return `${base}\n${this.response.status}: ${this.response.statusText}${this.responseBody ? `\n\n${this.responseBody}` : ''}`;
  }
}
