package com.planit.basetemplate;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaAuditing
@SpringBootApplication
@ComponentScan(basePackages = {"com.planit.basetemplate", "com.planit.userservice"})
@EntityScan(basePackages = {"com.planit.basetemplate", "com.planit.userservice"})
@EnableJpaRepositories(basePackages = {"com.planit.basetemplate", "com.planit.userservice"})
public class PlanitBaseTemplateApplication {

    public static void main(String[] args) {
        // .env 파일 로드 및 시스템 프로퍼티 설정
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
            System.out.println("✅ User Service: .env 환경 변수 로드 완료");
        } catch (Exception e) {
            System.err.println("⚠️ .env 파일 로드 실패: " + e.getMessage());
        }

        SpringApplication.run(PlanitBaseTemplateApplication.class, args);
    }
}
