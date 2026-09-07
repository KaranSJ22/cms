export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Invalid request parameters') {
        super(message, 400);
    }
}

export class UnauthenticatedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access denied.') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500);
    }
}