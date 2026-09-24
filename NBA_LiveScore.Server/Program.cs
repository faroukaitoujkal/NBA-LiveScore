AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
using NBA_LiveScore.Server.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Serilog;
using NBA_LiveScore.Server;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/log.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.WithOrigins("https://nba-livescore.vercel.app", "http://localhost:4200", "http://localhost:61961")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials(); 
        });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

// Add services to the container.
var envUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string? postgresConnectionString = null;

if (!string.IsNullOrEmpty(envUrl))
{
    bool isUri = Uri.TryCreate(envUrl, UriKind.Absolute, out Uri? dbUri);
    if (isUri && dbUri != null)
    {
        var userInfo = dbUri.UserInfo.Split(':');
        postgresConnectionString = $"Host={dbUri.Host};Port={(dbUri.Port > 0 ? dbUri.Port : 5432)};Database={dbUri.LocalPath.Substring(1)};Username={userInfo[0]};Password=xxxx;SSL Mode=Require;Trust Server Certificate=true;";
    }
    else
    {
        postgresConnectionString = envUrl;
    }
}

builder.Services.AddDbContext<NBAContext>(options =>
{
    if (!string.IsNullOrEmpty(postgresConnectionString))
    {
        options.UseNpgsql(postgresConnectionString);
    }
    else
    {
        options.UseInMemoryDatabase("NBADb");
    }
});

// Register SignalR
builder.Services.AddSignalR();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.MapHub<NBAHub>("/NBAHub");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<NBAContext>();
        context.Database.EnsureCreated(); // Ensure DB is created
        await DataSeeder.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating/seeding the DB.");
    }
}

app.MapFallbackToFile("/index.html");

app.Run();
