import HTTP_STATUS from "~/constants/httpStatus";
import { USER_MESSAGES } from "~/constants/messages";



type ErrorType = Record<string, {
    msg: string
    location: string
    value: any
    path: string
    [key: string]: any // optional
}>; // {[key: string]:string}

export class ErrorWithStatus {
    message: string;
    status: number;
    constructor({ message, status }: { message: string; status: number }) {
        this.message = message;
        this.status = status;
    }
}

export class EntityError extends Error {
    errors: ErrorType;
    status: number;

    constructor({ message = USER_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorType }) {
        super(message); // chỉ truyền message (string) cho Error
        this.status = HTTP_STATUS.UNPROCESSABLE_ENTITY;
        this.errors = errors;

    }
}