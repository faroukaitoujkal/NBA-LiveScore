using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Linq;

namespace NBA_LiveScore.Server
{
    public class ApiKeyAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private const string APIKEYNAME = "X-API-Key";

        public ApiKeyAuthMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IConfiguration config)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            if (path.StartsWith("/NBAHub", System.StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Only protect POST, PUT, DELETE
            var method = context.Request.Method.ToUpper();
            if (method == "POST" || method == "PUT" || method == "DELETE")
            {
                if (!context.Request.Headers.TryGetValue(APIKEYNAME, out var extractedApiKey))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("API Key was not provided.");
                    return;
                }

                var appSettingsApiKey = config.GetValue<string>("AdminApiKey");
                
                // If not configured, block to be safe
                if (string.IsNullOrEmpty(appSettingsApiKey) || !appSettingsApiKey.Equals(extractedApiKey))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Unauthorized client.");
                    return;
                }
            }

            await _next(context);
        }
    }
}
