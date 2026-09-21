using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NBA_LiveScore.Server;
using NBA_LiveScore.Server.Data;

namespace NBA_LiveScore.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SignalRController : ControllerBase
    {
        private readonly IHubContext<NBAHub> _hubContext;

        public SignalRController(IHubContext<NBAHub> hubContext)
        {
            _hubContext = hubContext;
        }

        // Endpoint pour envoyer un message à tous les clients connectés via SignalR
        [HttpPost("send-message")]
        public async Task<IActionResult> SendMessage([FromBody] string message)
        {
            if (string.IsNullOrEmpty(message))
            {
                return BadRequest("Le message ne peut pas être vide.");
            }

            // Envoi du message à tous les clients connectés
            await _hubContext.Clients.All.SendAsync("ReceiveMessage", message);

            return Ok(new { Status = "Message envoyé", Message = message });
        }
    }
}
