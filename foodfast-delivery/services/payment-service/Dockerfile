# Stage 1: Build
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Install Maven and build with retry logic
RUN apt-get update && apt-get install -y maven && \
    (mvn clean package -DskipTests -B || \
    (echo "Retry 1..." && sleep 5 && mvn clean package -DskipTests -B) || \
    (echo "Retry 2..." && sleep 10 && mvn clean package -DskipTests -B))

# Stage 2: Runtime
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/payment-service-1.0-SNAPSHOT.jar /app/payment-service.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "/app/payment-service.jar"]
