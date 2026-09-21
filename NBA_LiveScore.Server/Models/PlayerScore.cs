using System.ComponentModel.DataAnnotations.Schema;

namespace NBA_LiveScore.Server.Models
{
    public class PlayerScore
    {
        public int Id { get; set; }
        public int PlayerId { get; set; }
        public Player? Player { get; set; }
        public int Points { get; set; } // 1, 2, ou 3 points
        public DateTime ScoreTime { get; set; }
        public int MatchId { get; set; }
    }
}
