package com.planit.userservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

        @Value("${PLANIT_USER_OPENAPI_DEV_SERVER_URL:${OPENAPI_DEV_SERVER_URL:http://planit-user-svc:8081}}")
        private String devServerUrl;

        @Value("${PLANIT_USER_OPENAPI_PROD_SERVER_URL:${OPENAPI_PROD_SERVER_URL:https://api.planit.com}}")
        private String prodServerUrl;
    
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PlanIt User Service API")
                        .description("PlanIt User Service REST API Documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("PlanIt Team")
                                .email("support@planit.com")))
                .servers(List.of(
                        new Server()
                                .url(devServerUrl)
                                .description("Local Development Server"),
                        new Server()
                                .url(prodServerUrl)
                                .description("Production Server")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Authentication")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
