using Microsoft.AspNetCore.SignalR;
using Serilog;

namespace NBA_LiveScore.Server
{
    public class NBAHub : Hub
    {
        public string GetConnectionId()
        {
            Log.Information("ConnectionId requested: {ConnectionId}", Context.ConnectionId);
            return Context.ConnectionId ?? "No connection ID available";
        }

        public override async Task OnConnectedAsync()
        {
            Log.Information("Client connected with ConnectionId: {ConnectionId}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }
    }
}
