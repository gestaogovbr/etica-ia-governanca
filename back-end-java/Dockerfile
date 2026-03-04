FROM eclipse-temurin:17-jre-alpine AS base

# Use Maven image for building
FROM maven:3.9.5-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM maven:3.9.5-eclipse-temurin-17-alpine as dev
WORKDIR /app
COPY pom.xml .
COPY src ./src
EXPOSE 8080
CMD ["mvn", "spring-boot:run"]

FROM base AS prod
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]