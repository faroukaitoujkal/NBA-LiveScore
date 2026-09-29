using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Xunit;
using NBA_LiveScore.Server;
using System.Collections.Generic;
using System.IO;

namespace NBA_LiveScore.Tests
{
    public class ApiKeyAuthMiddlewareTests
    {
        private IConfiguration GetConfig(string apiKey = "test-key")
        {
            var inMemorySettings = new Dictionary<string, string> {
                {"AdminApiKey", apiKey}
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
        }

        [Fact]
        public async Task InvokeAsync_PostWithoutApiKey_Returns401()
        {
            var middleware = new ApiKeyAuthMiddleware(innerHttpContext => Task.CompletedTask);
            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Response.Body = new MemoryStream();

            var config = GetConfig();

            await middleware.InvokeAsync(context, config);

            Assert.Equal(401, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_GetWithoutApiKey_CallsNextAndReturns200()
        {
            var nextCalled = false;
            var middleware = new ApiKeyAuthMiddleware(innerHttpContext => {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = new DefaultHttpContext();
            context.Request.Method = "GET";

            var config = GetConfig();

            await middleware.InvokeAsync(context, config);

            Assert.True(nextCalled);
            Assert.Equal(200, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_PostWithValidApiKey_CallsNext()
        {
            var nextCalled = false;
            var middleware = new ApiKeyAuthMiddleware(innerHttpContext => {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.Headers["X-API-Key"] = "test-key";

            var config = GetConfig();

            await middleware.InvokeAsync(context, config);

            Assert.True(nextCalled);
        }

        [Fact]
        public async Task InvokeAsync_PostWithInvalidApiKey_Returns401()
        {
            var middleware = new ApiKeyAuthMiddleware(innerHttpContext => Task.CompletedTask);
            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Response.Body = new MemoryStream();
            context.Request.Headers["X-API-Key"] = "wrong-key";

            var config = GetConfig();

            await middleware.InvokeAsync(context, config);

            Assert.Equal(401, context.Response.StatusCode);
        }
    }
}
