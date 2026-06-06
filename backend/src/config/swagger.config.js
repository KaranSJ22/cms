import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ISRO Internal Canteen Management System API",
      version: "1.0.0",
      description:
        "API documentation for CMS backend Module 1: Auth, Common Master, and Identity Access Management",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Backend and database health check APIs",
      },
      {
        name: "Auth",
        description: "Authentication APIs",
      },
      {
        name: "Common",
        description: "Common master/configuration APIs",
      },
      {
        name: "Identity",
        description: "User, role, customer, and employee identity APIs",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/docs/*.js", "./src/routes/*.js", "./src/modules/**/*.js"],
});