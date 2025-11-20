export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  code: string;
  constructor(code: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' = 'INVALID_PASSWORD') {
    const message = code === 'USER_NOT_FOUND' 
      ? 'No account found with this email' 
      : 'Incorrect password';
    super(message);
    this.name = 'InvalidCredentialsError';
    this.code = code;
  }
}

export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid or expired token');
    this.name = 'InvalidTokenError';
  }
}

export class ExecutionLimitReachedError extends Error {
  constructor() {
    super('Execution limit reached. Please sign up to continue.');
    this.name = 'ExecutionLimitReachedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`);
    this.name = 'NotFoundError';
  }
}
