FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml trước để cache dependencies
COPY pom.xml .

# Copy source code
COPY src ./src

# Build với retry logic để xử lý network issues
RUN mvn clean package -DskipTests -B || \
    (echo "Retry 1..." && sleep 5 && mvn clean package -DskipTests -B) || \
    (echo "Retry 2..." && sleep 10 && mvn clean package -DskipTests -B)

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR từ build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8086

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
