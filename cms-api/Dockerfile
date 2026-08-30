# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["cms-api.csproj", "./"]
RUN dotnet restore "cms-api.csproj"

COPY . .
RUN dotnet publish "cms-api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:5030
ENV ASPNETCORE_HTTP_PORTS=5030
EXPOSE 5030
ENTRYPOINT ["dotnet", "cms-api.dll"]


