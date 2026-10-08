using Microsoft.AspNetCore.Mvc;

namespace NBA_LiveScore.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpPost("verify")]
        public IActionResult VerifyAdmin()
        {
            // If the request reached here, the ApiKeyAuthMiddleware already verified the X-API-Key header.
            return Ok(new { success = true });
        }
    }
}
