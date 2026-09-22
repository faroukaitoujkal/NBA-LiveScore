FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["NBA_LiveScore.Server/NBA_LiveScore.Server.csproj", "NBA_LiveScore.Server/"]
RUN dotnet restore "NBA_LiveScore.Server/NBA_LiveScore.Server.csproj"
COPY . .
WORKDIR "/src/NBA_LiveScore.Server"
RUN dotnet build "NBA_LiveScore.Server.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NBA_LiveScore.Server.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NBA_LiveScore.Server.dll"]
