using NBA_LiveScore.Server.Data;
using NBA_LiveScore.Server.Models;
using NBA_LiveScore.Server.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NBA_LiveScore.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamsController : ControllerBase
    {
        private readonly NBAContext _context;
        private readonly IMemoryCache _cache;
        private const string TeamsCacheKey = "TeamsList";

        public TeamsController(NBAContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamDto>>> GetTeams()
        {
            if (!_cache.TryGetValue(TeamsCacheKey, out List<TeamDto>? cachedTeams))
            {
                var teams = await _context.Teams.AsNoTracking().ToListAsync();
                cachedTeams = teams.Select(t => t.ToDto()).OfType<TeamDto>().ToList();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromHours(12))
                    .SetAbsoluteExpiration(TimeSpan.FromDays(1));

                _cache.Set(TeamsCacheKey, cachedTeams, cacheEntryOptions);
            }

            return Ok(cachedTeams);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TeamDetailDto>> GetTeam(int id)
        {
            var team = await _context.Teams.AsNoTracking()
                .Include(t => t.Players)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (team == null)
            {
                return NotFound();
            }

            return Ok(team.ToDetailDto());
        }

        [HttpGet("{teamId}/name")]
        public async Task<IActionResult> GetTeamName(int teamId)
        {
            var team = await _context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null)
            {
                return NotFound();
            }
            return Ok(new { name = team.Name });
        }

        [HttpPost]
        public async Task<ActionResult<TeamDto>> PostTeam(Team team)
        {
            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTeam", new { id = team.Id }, team.ToDto());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTeam(int id, Team team)
        {
            if (id != team.Id)
            {
                return BadRequest();
            }

            _context.Entry(team).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TeamExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeam(int id)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                return NotFound();
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TeamExists(int id)
        {
            return _context.Teams.Any(e => e.Id == id);
        }

        [HttpPost("sync-coaches")]
        public async Task<IActionResult> SyncCoaches()
        {
            try
            {
                using var httpClient = new System.Net.Http.HttpClient();
                
                // First get all teams to get their ESPN IDs
                var teamsResponse = await httpClient.GetStringAsync("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=40");
                var teamsDoc = System.Text.Json.JsonDocument.Parse(teamsResponse);
                var sportsArray = teamsDoc.RootElement.GetProperty("sports")[0];
                var leaguesArray = sportsArray.GetProperty("leagues")[0];
                var espnTeams = leaguesArray.GetProperty("teams");

                var dbTeams = await _context.Teams.ToListAsync();
                int updatedCount = 0;

                foreach (var teamEl in espnTeams.EnumerateArray())
                {
                    var t = teamEl.GetProperty("team");
                    var espnId = t.GetProperty("id").GetString();
                    var displayName = t.GetProperty("displayName").GetString();

                    var dbTeam = dbTeams.FirstOrDefault(db => db.Name == displayName);
                    if (dbTeam != null && !string.IsNullOrEmpty(espnId))
                    {
                        // Fetch roster for this team to get the coach
                        try
                        {
                            var rosterResponse = await httpClient.GetStringAsync($"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{espnId}/roster");
                            var rosterDoc = System.Text.Json.JsonDocument.Parse(rosterResponse);
                            
                            if (rosterDoc.RootElement.TryGetProperty("coach", out var coachesArray) && coachesArray.GetArrayLength() > 0)
                            {
                                var coachObj = coachesArray[0];
                                var firstName = coachObj.GetProperty("firstName").GetString();
                                var lastName = coachObj.GetProperty("lastName").GetString();
                                
                                dbTeam.CoachName = $"{firstName} {lastName}".Trim();
                                updatedCount++;
                            }
                        }
                        catch (Exception)
                        {
                            // Skip if fails to fetch roster
                        }
                    }
                }

                if (updatedCount > 0)
                {
                    await _context.SaveChangesAsync();
                    _cache.Remove(TeamsCacheKey); // Invalidate cache
                }

                return Ok(new { message = $"Successfully synced {updatedCount} coaches." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error syncing coaches.", error = ex.Message });
            }
        }
    }
}
